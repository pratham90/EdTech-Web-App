from flask import Flask, request, jsonify
import numpy as np
import random
import json
from datetime import datetime

app = Flask(__name__)

# -------------------------------
# Helper Functions
# -------------------------------

def analyze_performance(history):
    """
    Analyze student test history and extract weak/strong areas.
    """
    topic_scores = {}
    for record in history:
        topic = record.get("topic", "Unknown")
        score = record.get("score", 0)
        if topic not in topic_scores:
            topic_scores[topic] = []
        topic_scores[topic].append(score)

    topic_analysis = {}
    for topic, scores in topic_scores.items():
        avg_score = np.mean(scores)
        topic_analysis[topic] = {
            "avg_score": round(float(avg_score), 2),
            "status": "weak" if avg_score < 0.5 else "strong" if avg_score > 0.8 else "average"
        }

    return topic_analysis


def recommend_next_steps(topic_analysis):
    """
    Generate recommendations based on topic-level performance.
    """
    weak_topics = [t for t, d in topic_analysis.items() if d["status"] == "weak"]
    strong_topics = [t for t, d in topic_analysis.items() if d["status"] == "strong"]

    next_difficulty = "Easy" if len(weak_topics) > len(strong_topics) else "Medium"
    if all(d["status"] == "strong" for d in topic_analysis.values()):
        next_difficulty = "Hard"

    recommended_topics = weak_topics if weak_topics else random.sample(list(topic_analysis.keys()), min(2, len(topic_analysis)))

    action_plan = []
    for topic in recommended_topics:
        action_plan.append({
            "topic": topic,
            "suggestion": f"Revise {topic} and attempt more {next_difficulty.lower()}-level questions."
        })

    return {
        "recommended_topics": recommended_topics,
        "next_difficulty": next_difficulty,
        "action_plan": action_plan
    }


# -------------------------------
# API Endpoint
# -------------------------------

@app.route('/analyze_learning', methods=['POST'])
def analyze_learning():
    """
    Input JSON:
    {
      "student_name": "Pratham",
      "test_history": [
        {"topic": "Operating System", "score": 1},
        {"topic": "DBMS", "score": 0.4},
        {"topic": "Networking", "score": 0.6},
        {"topic": "DBMS", "score": 0.3}
      ]
    }

    Output JSON:
    {
      "student_name": "Pratham",
      "analysis": {...},
      "recommendation": {...},
      "timestamp": "2025-10-30T12:00:00"
    }
    """
    try:
        data = request.get_json()
        student_name = data.get("student_name", "Unknown Student")
        history = data.get("test_history", [])

        if not history:
            return jsonify({"error": "No test history provided."}), 400

        # Step 1: Analyze student performance
        topic_analysis = analyze_performance(history)

        # Step 2: Generate adaptive recommendations
        recommendations = recommend_next_steps(topic_analysis)

        # Step 3: Return final adaptive plan
        response = {
            "student_name": student_name,
            "analysis": topic_analysis,
            "recommendation": recommendations,
            "timestamp": datetime.now().isoformat()
        }

        print(f"✅ Adaptive Learning Analysis complete for {student_name}")
        return jsonify(response), 200

    except Exception as e:
        print("❌ Error in /analyze_learning:", e)
        return jsonify({"error": str(e)}), 500


# -------------------------------
# Run Server
# -------------------------------
if __name__ == "__main__":
    app.run(port=5004, debug=True)
    print("✅ Adaptive Learning Engine running on port 5004")
