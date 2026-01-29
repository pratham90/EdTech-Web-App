from flask import Flask, jsonify, request
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()
app = Flask(__name__)

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://root:root@pratham.bxzwh2p.mongodb.net/")
client = MongoClient(MONGO_URI)
db = client["edtech_ai"]
progress_collection = db["student_progress"]

RESOURCE_MAP = {
    "Deadlock": [
        {"title": "Deadlocks in OS (Gate Smashers)", "url": "https://www.youtube.com/watch?v=Qj5y0grYYFw"},
        {"title": "Deadlock Detection Notes (GeeksforGeeks)", "url": "https://www.geeksforgeeks.org/deadlock-in-operating-system/"}
    ],
    "Memory Management": [
        {"title": "Paging and Segmentation - OS Concepts", "url": "https://www.youtube.com/watch?v=wvja5V3WbDk"},
        {"title": "Memory Management in OS - Notes", "url": "https://www.studytonight.com/operating-system/memory-management"}
    ],
    "Threads": [
        {"title": "Multithreading in OS", "url": "https://www.youtube.com/watch?v=5ctyQWzZBaE"}
    ]
}

@app.route("/recommend/<student_id>", methods=["GET"])
def recommend(student_id):
    """
    Find student's weak topics and suggest related resources.
    """
    records = list(progress_collection.find({"student_id": student_id}, {"_id": 0}))
    if not records:
        return jsonify({"error": "Student not found"}), 404

    weak_topics = set()
    for r in records:
        for q in r.get("evaluation", []):
            if q.get("score", 0) < 1:
                weak_topics.add(q.get("topic", "Unknown"))

    recommendations = []
    for topic in weak_topics:
        if topic in RESOURCE_MAP:
            recommendations.extend(RESOURCE_MAP[topic])

    return jsonify({
        "student_id": student_id,
        "weak_topics": list(weak_topics),
        "recommendations": recommendations or "No resources found"
    })

if __name__ == "__main__":
    print("✅ Recommendation Engine running on port 5012")
    app.run(port=5012, debug=True)
