from flask import Flask, jsonify
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from statistics import mean

load_dotenv()
app = Flask(__name__)

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://root:root@pratham.bxzwh2p.mongodb.net/")
client = MongoClient(MONGO_URI)
db = client["edtech_ai"]
collection = db["student_progress"]

@app.route("/teacher/dashboard", methods=["GET"])
def teacher_dashboard():
    """
    Aggregates performance data for all students.
    Returns class average, weak topics, and top performers.
    """
    records = list(collection.find({}, {"_id": 0}))
    if not records:
        return jsonify({"message": "No records found"}), 404

    class_avg = mean([r.get("percentage", 0) for r in records])
    weak_topic_counts = {}
    student_scores = {}

    for r in records:
        sid = r.get("student_id")
        student_scores[sid] = r.get("percentage", 0)
        for q in r.get("evaluation", []):
            topic = q.get("topic", "Unknown")
            score = q.get("score", 0)
            if topic not in weak_topic_counts:
                weak_topic_counts[topic] = {"attempts": 0, "low_scores": 0}
            weak_topic_counts[topic]["attempts"] += 1
            if score < 1:
                weak_topic_counts[topic]["low_scores"] += 1

    weak_topics = sorted(
        [{"topic": k, "weakness_rate": v["low_scores"]/v["attempts"]} for k, v in weak_topic_counts.items()],
        key=lambda x: x["weakness_rate"],
        reverse=True
    )[:5]

    top_students = sorted(student_scores.items(), key=lambda x: x[1], reverse=True)[:5]

    return jsonify({
        "class_average": round(class_avg, 2),
        "weak_topics": weak_topics,
        "top_students": top_students,
        "total_students": len(student_scores)
    })

if __name__ == "__main__":
    print("✅ Teacher Dashboard running on port 5011")
    app.run(port=5011, debug=True)
