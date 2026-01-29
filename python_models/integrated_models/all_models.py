import requests
from flask import Flask, jsonify, request
from dotenv import load_dotenv
import os

load_dotenv()
app = Flask(__name__)

# -----------------------------
# ✅ Service Registry (all models and their ports)
# -----------------------------
SERVICES = {
    "syllabus_parser": "http://127.0.0.1:5001",
    "question_gen": "http://127.0.0.1:5002",
    "answer_gen": "http://127.0.0.1:5003",
    "mock_test": "http://127.0.0.1:5005",
    "smart_evaluator": "http://127.0.0.1:5006",
    "teacher_assistant": "http://127.0.0.1:5007",
    "interview_bot": "http://127.0.0.1:5008",
    "analytics": "http://127.0.0.1:5004",
    "adaptive_learning": "http://127.0.0.1:5010",
    "teacher_dashboard": "http://127.0.0.1:5011",
    "recommendation_engine": "http://127.0.0.1:5012",
    "report_generator": "http://127.0.0.1:5013"
}

# -----------------------------
# ✅ Unified Routes (acts as a proxy for all submodels)
# -----------------------------

@app.route("/parse_syllabus", methods=["POST"])
def parse_syllabus():
    """Route syllabus content to syllabus parser."""
    try:
        resp = requests.post(f"{SERVICES['syllabus_parser']}/parse_syllabus", files=request.files, data=request.form)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/generate_questions", methods=["POST"])
def generate_questions():
    """Generate questions using question_gen model."""
    try:
        payload = request.get_json(force=True)
        resp = requests.post(f"{SERVICES['question_gen']}/generate_questions", json=payload)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/generate_answers", methods=["POST"])
def generate_answers():
    """Generate answers for given questions."""
    try:
        payload = request.get_json(force=True)
        resp = requests.post(f"{SERVICES['answer_gen']}/generate_answers", json=payload)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/evaluate_mock", methods=["POST"])
def evaluate_mock():
    """Evaluate mock test."""
    try:
        payload = request.get_json(force=True)
        resp = requests.post(f"{SERVICES['mock_test']}/evaluate_mock", json=payload)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/evaluate_answer", methods=["POST"])
def evaluate_answer():
    """Smart evaluator - check semantic accuracy."""
    try:
        payload = request.get_json(force=True)
        resp = requests.post(f"{SERVICES['smart_evaluator']}/evaluate_answer", json=payload)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/teacher_help", methods=["POST"])
def teacher_help():
    """Ask AI teacher assistant for help."""
    try:
        payload = request.get_json(force=True)
        resp = requests.post(f"{SERVICES['teacher_assistant']}/teacher_help", json=payload)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/interview/start", methods=["POST"])
def start_interview():
    """Start interview session."""
    try:
        payload = request.get_json(force=True)
        resp = requests.post(f"{SERVICES['interview_bot']}/start_session", json=payload)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/interview/submit", methods=["POST"])
def submit_interview():
    """Submit interview answer."""
    try:
        payload = request.get_json(force=True)
        resp = requests.post(f"{SERVICES['interview_bot']}/submit_answer", json=payload)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/analytics/<student_id>", methods=["GET"])
def get_analytics(student_id):
    """Fetch student analytics from progress tracker."""
    try:
        resp = requests.get(f"{SERVICES['analytics']}/get_progress/{student_id}")
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/teacher/dashboard", methods=["GET"])
def teacher_dashboard():
    """Aggregate all student analytics."""
    try:
        resp = requests.get(f"{SERVICES['teacher_dashboard']}/teacher/dashboard")
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/recommend/<student_id>", methods=["GET"])
def recommend(student_id):
    """Recommend materials based on weak topics."""
    try:
        resp = requests.get(f"{SERVICES['recommendation_engine']}/recommend/{student_id}")
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/report/<student_id>", methods=["GET"])
def report(student_id):
    """Generate downloadable student report."""
    try:
        resp = requests.get(f"{SERVICES['report_generator']}/report/{student_id}")
        return resp.content, resp.status_code, {
            "Content-Type": resp.headers.get("Content-Type"),
            "Content-Disposition": resp.headers.get("Content-Disposition")
        }
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/adaptive", methods=["POST"])
def adaptive_learning():
    """Send data to adaptive learning engine for difficulty adjustment."""
    try:
        payload = request.get_json(force=True)
        resp = requests.post(f"{SERVICES['adaptive_learning']}/adjust_difficulty", json=payload)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------
# 🚀 Run Gateway
# -----------------------------
if __name__ == "__main__":
    print("✅ Central Orchestrator running on port 5050")
    app.run(port=5050, debug=True)
