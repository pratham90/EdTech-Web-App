import os
import uuid
import time
import json
from datetime import datetime
from dotenv import load_dotenv

from flask import Flask, request, jsonify
from openai import OpenAI
import numpy as np

# Try to reuse your existing whisper listener if present
try:
    from whisper_listener.whisper_listener import transcribe_audio
    WHISPER_REUSE = True
except Exception:
    WHISPER_REUSE = False
    try:
        import whisper
    except Exception:
        whisper = None

# ---------------------------
# Setup
# ---------------------------
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not found in .env")

client = OpenAI(api_key=OPENAI_API_KEY)
app = Flask(__name__)

# ---------------------------
# Simple in-memory session store
# { session_id: {subject, difficulty, last_question, history: [{q, student_ans, score, feedback}], created_at } }
# ---------------------------
SESSIONS = {}

# ---------------------------
# Helper: embeddings & similarity
# ---------------------------
def get_embedding(text):
    """Return embedding vector using OpenAI client; returns None on failure."""
    try:
        resp = client.embeddings.create(model="text-embedding-3-small", input=text, timeout=20)
        return resp.data[0].embedding
    except Exception as e:
        print("Embedding error:", e)
        return None

def cosine_sim(a, b):
    a = np.array(a, dtype=float)
    b = np.array(b, dtype=float)
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)

# ---------------------------
# Helper: transcription
# ---------------------------
def transcribe_file_local(path):
    """Fallback local whisper transcription if whisper and model available."""
    if WHISPER_REUSE:
        return transcribe_audio(path)
    if whisper:
        model = whisper.load_model("small")
        result = model.transcribe(path)
        return result.get("text", "")
    raise RuntimeError("No transcription backend available. Provide text or install/enable Whisper module.")

# ---------------------------
# Helper: prompt builders
# ---------------------------
def build_first_question_prompt(subject, difficulty):
    return f"""
You are an experienced interviewer for the subject "{subject}".
Generate one clear interview question appropriate for a {difficulty} level (Short/Medium/Hard).
Return only the question text (no JSON wrappers).
"""

def build_followup_prompt(last_question, student_transcript, exam_style_hint="be concise"):
    return f"""
You are an expert interviewer and evaluator in the relevant subject.
The candidate answered the question: "{last_question}" with:
\"\"\"{student_transcript}\"\"\"

Give:
1) A short feedback (1-2 sentences) pointing strengths and missing points.
2) A suggested score between 0 and 1 (float), where 1 is perfect.
3) A single follow-up question to probe deeper on the missing concept (or next question).

Respond in strict JSON:
{{ "feedback": "text", "score": 0.0, "next_question": "text" }}
Keep feedback concise.
"""

# ---------------------------
# API: start a new interview session -> returns session_id + first question
# ---------------------------
@app.route("/start_session", methods=["POST"])
def start_session():
    """
    POST JSON:
    { "subject": "Operating Systems", "difficulty": "Medium" }
    Response:
    { "session_id": "...", "question": "..." }
    """
    try:
        data = request.get_json(force=True)
        subject = data.get("subject", "General")
        difficulty = data.get("difficulty", "Medium")

        # create session
        sid = str(uuid.uuid4())
        SESSIONS[sid] = {
            "subject": subject,
            "difficulty": difficulty,
            "last_question": None,
            "history": [],
            "created_at": datetime.now().isoformat()
        }

        # ask LLM to generate the first question
        prompt = build_first_question_prompt(subject, difficulty)
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role":"system", "content":"You generate concise interview questions."},
                      {"role":"user", "content": prompt}],
            temperature=0.3
        )
        q_text = resp.choices[0].message.content.strip()
        SESSIONS[sid]["last_question"] = q_text

        return jsonify({"session_id": sid, "question": q_text}), 200

    except Exception as e:
        print("Error in start_session:", e)
        return jsonify({"error": str(e)}), 500

# ---------------------------
# API: submit answer (text or audio file) and receive feedback + next question + score
# ---------------------------
@app.route("/submit_answer", methods=["POST"])
def submit_answer():
    """
    Accepts form-data or JSON:
    - JSON: { "session_id": "...", "student_answer": "text answer" }
    - form-data with file: "file" -> audio file (mp3/m4a/wav), plus session_id in form
    Returns:
    { "feedback": "...", "score": 0.8, "next_question": "...", "transcript": "..." }
    """
    try:
        # Accept both JSON and form-data (file)
        if request.is_json:
            data = request.get_json(force=True)
            session_id = data.get("session_id")
            student_text = data.get("student_answer", "")
        else:
            session_id = request.form.get("session_id")
            student_text = ""
            if "file" in request.files:
                audio = request.files["file"]
                tmp_path = f"/tmp/{uuid.uuid4().hex}_{audio.filename}"
                audio.save(tmp_path)
                try:
                    student_text = transcribe_file_local(tmp_path)
                finally:
                    try:
                        os.remove(tmp_path)
                    except Exception:
                        pass

        if not session_id or session_id not in SESSIONS:
            return jsonify({"error": "Invalid or missing session_id"}), 400

        if not student_text:
            return jsonify({"error":"No text answer provided or transcription failed."}), 400

        session = SESSIONS[session_id]
        last_q = session.get("last_question", "")
        # Build follow up prompt and call LLM for feedback + next question
        prompt = build_followup_prompt(last_q, student_text)
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role":"system", "content":"You are an expert instructor and evaluator."},
                      {"role":"user", "content": prompt}],
            temperature=0.2
        )
        raw = resp.choices[0].message.content.strip()

        # Attempt to parse JSON from the model output (strip code fences)
        cleaned = raw
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            parsed = json.loads(cleaned)
            feedback = parsed.get("feedback","")
            score = float(parsed.get("score", 0.0))
            next_q = parsed.get("next_question","")
        except Exception:
            # fallback: try to be robust and extract fields heuristically
            feedback = raw
            score = 0.0
            next_q = ""

        # If LLM didn't give next_q, create a simple follow-up question
        if not next_q:
            next_q = f"Can you elaborate on one key aspect of: {last_q}?"

        # Evaluate semantic similarity optionally (embedding-based) to cross-check LLM score
        # If we have an expected ideal answer available we could compare; here we compare to LLM 'ideal' by asking the LLM
        # We'll ask the model to give an ideal short answer, then compute similarity between student and ideal.
        ideal_prompt = f"Provide a one-line ideal answer for the interview question: \"{last_q}\"."
        try:
            ideal_resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role":"system","content":"You are an expert subject-matter answer generator."},
                          {"role":"user","content": ideal_prompt}],
                temperature=0.0
            )
            ideal_text = ideal_resp.choices[0].message.content.strip()
            emb_student = get_embedding_safe(student_text)
            emb_ideal = get_embedding_safe(ideal_text)
            similarity = None
            if emb_student is not None and emb_ideal is not None:
                similarity = round(cosine_sim(emb_student, emb_ideal), 3)
            else:
                similarity = None
        except Exception:
            similarity = None
            ideal_text = None

        # store in session history
        entry = {
            "question": last_q,
            "student_answer": student_text,
            "feedback": feedback,
            "llm_score": score,
            "similarity": similarity,
            "ideal_answer": ideal_text,
            "timestamp": datetime.now().isoformat()
        }
        session["history"].append(entry)

        # set next question as last_question
        session["last_question"] = next_q

        return jsonify({
            "feedback": feedback,
            "score": score,
            "similarity": similarity,
            "next_question": next_q,
            "transcript": student_text
        }), 200

    except Exception as e:
        print("Error in submit_answer:", e)
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Small helpers used above (placed here so code is complete)
# ---------------------------
def get_embedding_safe(text):
    try:
        resp = client.embeddings.create(model="text-embedding-3-small", input=text, timeout=15)
        return resp.data[0].embedding
    except Exception as e:
        print("Embedding error:", e)
        return None

def cosine_sim(a, b):
    a = np.array(a, dtype=float)
    b = np.array(b, dtype=float)
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)

# ---------------------------
# Small endpoints to inspect session & end session
# ---------------------------
@app.route("/session/<session_id>", methods=["GET"])
def get_session(session_id):
    if session_id not in SESSIONS:
        return jsonify({"error":"session not found"}), 404
    return jsonify(SESSIONS[session_id]), 200

@app.route("/end_session/<session_id>", methods=["POST"])
def end_session(session_id):
    if session_id not in SESSIONS:
        return jsonify({"error":"session not found"}), 404
    data = SESSIONS.pop(session_id)
    return jsonify({"status":"ended", "session": data}), 200

# ---------------------------
# Run server
# ---------------------------
if __name__ == "__main__":
    print("✅ Interview Engine running on port 5008")
    app.run(port=5008, debug=True)
