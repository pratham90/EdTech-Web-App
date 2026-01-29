from flask import Flask, request, jsonify
from datetime import datetime
from pymongo import MongoClient
import numpy as np
import os
from dotenv import load_dotenv

# ---------------------------
# Setup
# ---------------------------
load_dotenv()
app = Flask(__name__)

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://root:root@pratham.bxzwh2p.mongodb.net/")
client = MongoClient(MONGO_URI)
db = client["edtech_ai"]
collection = db["student_progress"]

print("✅ MongoDB connected successfully.")


# ---------------------------
# Helper Functions
# ---------------------------
def calculate_progress(data):
    """Compute average score, weak areas, and progress trend."""
    scores = [d.get("percentage", 0) for d in data]
    avg_score = np.mean(scores) if scores else 0

    trend = "Improving" if len(scores) > 1 and scores[-1] > np.mean(scores[:-1]) else "Needs Improvement"

    # Extract weak topics (simplified logic)
    weak_topics = []
    for record in data:
        for q in record.get("evaluation", []):
            if q.get("score", 0) < 1:
                weak_topics.append(q.get("topic", "Unknown Topic"))

    weak_topics = list(set(weak_topics)) or ["None identified"]

    return {
        "average_score": round(avg_score, 2),
        "trend": trend,
        "weak_topics": weak_topics
    }


# ---------------------------
# API Routes
# ---------------------------

@app.route("/save_progress", methods=["POST"])
def save_progress():
    """
    Store mock test evaluation results for a student.

    Expected JSON:
    {
      "student_id": "12345",
      "mock_test_id": "TEST101",
      "percentage": 80,
      "evaluation": [
        {"id": 1, "type": "mcq", "topic": "Deadlock", "score": 1},
        {"id": 2, "type": "subjective", "topic": "Memory Management", "score": 0.5}
      ]
    }
    """
    try:
        data = request.get_json(force=True)
        data["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        collection.insert_one(data)
        print(f"🧾 Progress saved for student {data.get('student_id')}")
        return jsonify({"message": "Progress saved successfully."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/get_progress/<student_id>", methods=["GET"])
def get_progress(student_id):
    """Fetch a student's performance history and analytics."""
    try:
        records = list(collection.find({"student_id": student_id}, {"_id": 0}))
        if not records:
            return jsonify({"error": "No records found for this student."}), 404

        analytics = calculate_progress(records)

        return jsonify({
            "student_id": student_id,
            "total_tests": len(records),
            "analytics": analytics,
            "records": records
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/delete_progress/<student_id>", methods=["DELETE"])
def delete_progress(student_id):
    """Delete all records for a given student (for testing/demo reset)."""
    try:
        result = collection.delete_many({"student_id": student_id})
        return jsonify({"deleted_records": result.deleted_count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------
# Run App
# ---------------------------
if __name__ == "__main__":
    app.run(port=5004, debug=True)
    print("✅ Progress Tracking & Analytics API running on port 5004")
