import os
import json
import time
import uuid
from io import BytesIO
from datetime import datetime
from dotenv import load_dotenv

from flask import Flask, request, jsonify, send_file
from openai import OpenAI
from pymongo import MongoClient
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
import numpy as np

# ---------------------------
# Setup
# ---------------------------
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY missing in .env")

client = OpenAI(api_key=OPENAI_API_KEY)
mongo = MongoClient(MONGO_URI)
db = mongo["edtech_ai"]
papers_collection = db["question_papers"]       # from teacher generator
evaluations_collection = db["evaluations"]      # new collection for evals

app = Flask(__name__)


# ---------------------------
# Helpers
# ---------------------------
def cosine_similarity(a, b):
    a = np.array(a, dtype=float)
    b = np.array(b, dtype=float)
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def get_embeddings_batch(texts, timeout=25):
    """
    Batch embeddings call. Returns list of embeddings or None for failed items.
    """
    try:
        start = time.time()
        resp = client.embeddings.create(
            model="text-embedding-3-small",
            input=texts,
            timeout=timeout
        )
        elapsed = time.time() - start
        print(f"Embeddings generated for {len(texts)} items in {elapsed:.2f}s")
        return [r.embedding for r in resp.data]
    except Exception as e:
        print("Embedding error:", e)
        return [None] * len(texts)


def evaluate_mcq_answer(student_ans, correct_ans):
    """
    Flexible MCQ matching:
      - if both single-letter (A/B/C/D) compare letters
      - else compare normalized text
    Returns score (0 or 1) and feedback string.
    """
    if not student_ans or not correct_ans:
        return 0, "Answer missing."

    s = str(student_ans).strip().lower()
    c = str(correct_ans).strip().lower()

    # if single-letter option format
    if len(s) == 1 and len(c) == 1:
        return (1, "Correct") if s == c else (0, "Incorrect")

    # else fallback to normalized string comparison
    if s == c:
        return 1, "Correct"
    # allow cases where correct_ans may contain the letter and explanation "A. Option text"
    if c.startswith(s) or s.startswith(c):
        return 1, "Correct (normalized)"
    return 0, "Incorrect"


def generate_pdf_evaluation(evaluation_doc):
    """
    evaluation_doc is dict with keys:
      - eval_id, student_id, paper_title, timestamp, total_score, percentage, details (list)
    Returns BytesIO buffer with PDF.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elems = []

    elems.append(Paragraph(f"<b>Evaluation Report</b>", styles["Title"]))
    elems.append(Paragraph(f"Eval ID: {evaluation_doc.get('eval_id')}", styles["Normal"]))
    elems.append(Paragraph(f"Student ID: {evaluation_doc.get('student_id', 'N/A')}", styles["Normal"]))
    elems.append(Paragraph(f"Paper: {evaluation_doc.get('paper_title','N/A')}", styles["Normal"]))
    elems.append(Paragraph(f"Date: {evaluation_doc.get('timestamp')}", styles["Normal"]))
    elems.append(Spacer(1, 12))

    elems.append(Paragraph(f"<b>Total Score:</b> {evaluation_doc.get('total_score')} / {evaluation_doc.get('total_marks')}", styles["Normal"]))
    elems.append(Paragraph(f"<b>Percentage:</b> {evaluation_doc.get('percentage')}%", styles["Normal"]))
    elems.append(Spacer(1, 12))

    for i, d in enumerate(evaluation_doc.get("details", []), 1):
        qtxt = d.get("question", "Question text missing")
        elems.append(Paragraph(f"<b>Q{i}.</b> {qtxt}", styles["Normal"]))
        elems.append(Paragraph(f"Type: {d.get('type','-')} | Marks: {d.get('marks',0)} | Score awarded: {d.get('score_awarded')}", styles["Normal"]))
        # show optionally similarity and feedback
        if d.get("similarity") is not None:
            elems.append(Paragraph(f"Similarity: {d.get('similarity')}", styles["Normal"]))
        if d.get("feedback"):
            elems.append(Paragraph(f"Feedback: {d.get('feedback')}", styles["Normal"]))
        elems.append(Spacer(1, 8))

    doc.build(elems)
    buffer.seek(0)
    return buffer


# ---------------------------
# Main route: evaluate student answers
# ---------------------------
@app.route("/evaluate_student", methods=["POST"])
def evaluate_student():
    """
    Accepts JSON:
    {
      "student_id": "STU001",
      "paper_id": "<optional if paper provided>",
      "paper": { optional full paper JSON if not using paper_id },
      "answers": [
         {"q_index": 1, "student_answer": "A"},
         {"q_index": 2, "student_answer": "Deadlock happens when ..."}
      ]
    }

    Returns evaluation JSON and stores eval in MongoDB.
    """
    try:
        data = request.get_json(force=True)
        student_id = data.get("student_id", "ANON")
        paper_id = data.get("paper_id")
        paper = data.get("paper")
        answers = data.get("answers", [])

        # fetch paper if paper_id provided
        if not paper and paper_id:
            paper = papers_collection.find_one({"_id": paper_id}, {"_id": 0})
            if not paper:
                return jsonify({"error": "paper_id not found"}), 404

        if not paper:
            return jsonify({"error": "No paper provided or found."}), 400

        questions = paper.get("questions", [])
        total_marks = paper.get("total_marks", sum([q.get("marks",0) for q in questions]))

        # Build quick lookup for answers by q_index (1-based index)
        answer_map = {int(a.get("q_index")): a.get("student_answer") for a in answers}

        # Prepare lists for batch embeddings for subjective questions
        subj_texts = []   # will be [student_ans1, correct_ans1, student_ans2, correct_ans2, ...]
        subj_q_indices = []  # mapping to question index

        details = []  # per-question details to fill

        # First pass: prepare and handle MCQs quickly
        for idx, q in enumerate(questions, start=1):
            q_type = str(q.get("type", "Short")).lower()
            correct_ans = q.get("answer") or q.get("correct_answer") or ""  # teacher generator may use different key
            marks = q.get("marks", 0)
            student_ans = answer_map.get(idx, "")  # if not provided, empty string

            detail = {
                "q_index": idx,
                "question": q.get("question"),
                "type": q.get("type"),
                "marks": marks,
                "student_answer": student_ans,
                "correct_answer": correct_ans,
                "score_awarded": 0,
                "feedback": "",
                "similarity": None
            }

            if q_type in ["mcq", "multiple", "choice", "multiple choice", "mcq"]:
                # evaluate immediately
                score, feedback = evaluate_mcq_answer(student_ans, correct_ans)
                detail["score_awarded"] = score * marks
                detail["feedback"] = feedback
            else:
                # collect for batch similarity later
                subj_texts.append(str(student_ans))
                subj_texts.append(str(correct_ans))
                subj_q_indices.append(idx)

            details.append(detail)

        # If there are subjective questions, evaluate them in batch
        if subj_texts:
            embeddings = get_embeddings_batch(subj_texts)
            # process pairs
            for i, q_idx in enumerate(subj_q_indices):
                student_emb = embeddings[2 * i]
                correct_emb = embeddings[2 * i + 1]

                # find corresponding detail record
                detail = next((d for d in details if d["q_index"] == q_idx), None)
                if not detail:
                    continue

                if student_emb is None or correct_emb is None:
                    detail["score_awarded"] = 0
                    detail["feedback"] = "Embedding failed - could not evaluate."
                    detail["similarity"] = None
                    continue

                sim = cosine_similarity(student_emb, correct_emb)
                detail["similarity"] = round(sim, 3)

                # scoring policy (configurable)
                if sim >= 0.85:
                    awarded = detail["marks"]
                    feedback = "Excellent"
                elif sim >= 0.7:
                    awarded = round(detail["marks"] * 0.6, 2)
                    feedback = "Partially correct"
                elif sim >= 0.55:
                    awarded = round(detail["marks"] * 0.3, 2)
                    feedback = "Attempted but insufficient"
                else:
                    awarded = 0
                    feedback = "Incorrect / off-topic"

                detail["score_awarded"] = awarded
                detail["feedback"] = feedback

        # final totals
        total_score = sum([d.get("score_awarded", 0) for d in details])
        percentage = round((total_score / total_marks) * 100, 2) if total_marks else 0.0

        # build evaluation document
        eval_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        evaluation_doc = {
            "eval_id": eval_id,
            "student_id": student_id,
            "paper_id": paper_id,
            "paper_title": paper.get("title", "Untitled"),
            "timestamp": timestamp,
            "total_marks": total_marks,
            "total_score": total_score,
            "percentage": percentage,
            "details": details
        }

        # save to DB
        evaluations_collection.insert_one(evaluation_doc)
        print(f"Saved evaluation {eval_id} for student {student_id}")

        return jsonify({"status": "success", "eval_id": eval_id, "evaluation": evaluation_doc}), 200

    except Exception as e:
        print("Error in evaluate_student:", e)
        return jsonify({"error": str(e)}), 500


# ---------------------------
# Download evaluation PDF
# ---------------------------
@app.route("/download_report/<eval_id>", methods=["GET"])
def download_report(eval_id):
    try:
        doc = evaluations_collection.find_one({"eval_id": eval_id}, {"_id": 0})
        if not doc:
            return jsonify({"error": "Evaluation not found"}), 404

        pdf_buf = generate_pdf_evaluation(doc)
        filename = f"Evaluation_{eval_id}.pdf"
        return send_file(pdf_buf, as_attachment=True, download_name=filename, mimetype="application/pdf")
    except Exception as e:
        print("Error in download_report:", e)
        return jsonify({"error": str(e)}), 500


# ---------------------------
# List evaluations for a student
# ---------------------------
@app.route("/list_evaluations/<student_id>", methods=["GET"])
def list_evaluations(student_id):
    try:
        docs = list(evaluations_collection.find({"student_id": student_id}, {"_id": 0, "details": 0}))
        return jsonify({"evaluations": docs}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------
# Run app
# ---------------------------
if __name__ == "__main__":
    print("✅ Smart Evaluation Assistant running on port 5006")
    app.run(port=5006, debug=True)
