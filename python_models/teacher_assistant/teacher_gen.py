from flask import Flask, request, jsonify, send_file
from openai import OpenAI
from pymongo import MongoClient
from dotenv import load_dotenv
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from io import BytesIO
import os, json, uuid

# --------------------------------
# 🔧 Setup
# --------------------------------
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/edtech_ai")

if not OPENAI_API_KEY:
    raise ValueError("❌ Missing OPENAI_API_KEY in .env file")

client = OpenAI(api_key=OPENAI_API_KEY)
mongo_client = MongoClient(MONGO_URI)
db = mongo_client["edtech_ai"]
papers_collection = db["question_papers"]

app = Flask(__name__)


# --------------------------------
# 🧩 Helper Functions
# --------------------------------
def clean_json(text):
    """Remove extra formatting and safely parse JSON from model output."""
    try:
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        print("⚠️ JSON parse error:", e)
        return {"questions": [], "total_marks": 0}


def calculate_total_marks(paper):
    """Recalculate total marks based on question entries."""
    total = 0
    for q in paper.get("questions", []):
        if isinstance(q.get("marks"), (int, float)):
            total += q["marks"]
    paper["total_marks"] = total
    return paper


def remove_duplicate_questions(questions):
    """Eliminate duplicate or similar questions."""
    seen = set()
    unique = []
    for q in questions:
        text = q["question"].strip().lower()
        if text not in seen:
            seen.add(text)
            unique.append(q)
    return unique


def generate_pdf(paper_data):
    """Convert question paper JSON into a formatted downloadable PDF."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(f"<b>{paper_data.get('title', 'Question Paper')}</b>", styles["Title"]))
    elements.append(Spacer(1, 20))

    for idx, q in enumerate(paper_data.get("questions", []), 1):
        question_text = q.get("question", "")
        marks = q.get("marks", 0)
        qtype = q.get("type", "Short")
        elements.append(Paragraph(f"<b>Q{idx}.</b> {question_text}", styles["Normal"]))
        elements.append(Paragraph(f"<i>Type:</i> {qtype} | <i>Marks:</i> {marks}", styles["Normal"]))
        elements.append(Spacer(1, 12))

    elements.append(Spacer(1, 20))
    elements.append(Paragraph(f"<b>Total Marks:</b> {paper_data.get('total_marks', 0)}", styles["Normal"]))
    doc.build(elements)
    buffer.seek(0)
    return buffer


# --------------------------------
# 🧠 Core AI Logic
# --------------------------------
def generate_questions_with_ai(subject, exam_type, num_questions, marks_distribution, difficulty):
    """
    Generate unique, plagiarism-free, exam-type-specific question papers using GPT-4.
    """
    prompt = f"""
    You are an experienced exam setter.
    Generate {num_questions} unique, plagiarism-free questions for the subject "{subject}".
    The exam type is "{exam_type}" with difficulty level "{difficulty}".
    Use marks distribution {marks_distribution}.
    
    - Ensure **no duplicate or repeated questions**.
    - Each question should be original and rephrased naturally.
    - Include a mix of 'Short' and 'Long' questions.
    - Return only valid JSON output in the format below:

    {{
      "title": "{subject} - {exam_type}",
      "questions": [
        {{"question": "Explain the concept of data normalization.", "marks": 2, "type": "Short"}},
        {{"question": "Describe how 3NF eliminates transitive dependencies.", "marks": 5, "type": "Long"}}
      ]
    }}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a precise educational AI that writes original and plagiarism-free exam questions."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.6
    )

    raw_output = response.choices[0].message.content
    print("🧾 GPT Output:\n", raw_output[:500])

    paper = clean_json(raw_output)
    paper["questions"] = remove_duplicate_questions(paper.get("questions", []))
    paper = calculate_total_marks(paper)

    return paper


# --------------------------------
# 🚀 API Routes
# --------------------------------

@app.route('/generate_paper', methods=['POST'])
def generate_paper():
    """
    POST body example:
    {
        "subject": "Database Management Systems",
        "exam_type": "Midterm",
        "num_questions": 8,
        "marks_distribution": [2, 5],
        "difficulty": "Medium"
    }
    """
    try:
        data = request.get_json()
        subject = data.get("subject", "")
        exam_type = data.get("exam_type", "")
        num_questions = int(data.get("num_questions", 5))
        marks_distribution = data.get("marks_distribution", [2, 5])
        difficulty = data.get("difficulty", "Medium")

        print(f"📩 Generating paper for: {subject} ({exam_type})")

        paper = generate_questions_with_ai(subject, exam_type, num_questions, marks_distribution, difficulty)
        paper_id = str(uuid.uuid4())
        paper["_id"] = paper_id

        papers_collection.insert_one(paper)
        print(f"✅ Saved paper in MongoDB with ID: {paper_id}")

        return jsonify({"status": "success", "paper_id": paper_id, "paper": paper}), 200

    except Exception as e:
        print("❌ Error in /generate_paper:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/download_paper/<paper_id>', methods=['GET'])
def download_paper(paper_id):
    """Download a stored question paper as a PDF."""
    try:
        paper = papers_collection.find_one({"_id": paper_id}, {"_id": 0})
        if not paper:
            return jsonify({"error": "Paper not found"}), 404

        pdf_buffer = generate_pdf(paper)
        filename = f"{paper.get('title', 'Question_Paper').replace(' ', '_')}.pdf"

        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype="application/pdf"
        )

    except Exception as e:
        print("❌ Error in /download_paper:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/list_papers', methods=['GET'])
def list_papers():
    """Fetch all generated papers from database."""
    try:
        papers = list(papers_collection.find({}, {"_id": 1, "title": 1, "total_marks": 1}))
        return jsonify({"papers": papers}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --------------------------------
# 🏁 Run Server
# --------------------------------
if __name__ == "__main__":
    print("✅ Teacher Question Paper Generator with MongoDB & PDF running on port 5003")
    app.run(port=5003, debug=True)
