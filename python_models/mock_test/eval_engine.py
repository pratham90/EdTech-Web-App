from flask import Flask, request, jsonify
from openai import OpenAI
import numpy as np
import os
import time
from dotenv import load_dotenv

# ---------------------------
# Setup
# ---------------------------
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("❌ OPENAI_API_KEY not found in environment variables.")

client = OpenAI(api_key=OPENAI_API_KEY)
app = Flask(__name__)

# ---------------------------
# Helper Functions
# ---------------------------

def cosine_similarity(vec1, vec2):
    """Compute cosine similarity between two vectors."""
    a, b = np.array(vec1), np.array(vec2)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def get_embeddings_batch(texts):
    """
    Generate embeddings for multiple texts in one API call with timeout and error handling.
    """
    print(f"🧠 Generating embeddings for {len(texts)} text(s)...")
    try:
        start = time.time()
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=texts,
            timeout=20  # Force timeout after 20s
        )
        elapsed = round(time.time() - start, 2)
        print(f"✅ Embeddings generated successfully in {elapsed}s")
        return [item.embedding for item in response.data]

    except Exception as e:
        print("❌ Embedding Error:", e)
        # Return None embeddings so processing continues
        return [None for _ in texts]


def evaluate_mcq(student_answer, correct_answer):
    """Rule-based checking for MCQs."""
    if not student_answer or not correct_answer:
        return {"score": 0, "feedback": "Answer missing."}

    if student_answer.strip().lower() == correct_answer.strip().lower():
        return {"score": 1, "feedback": "✅ Correct Answer"}
    else:
        return {"score": 0, "feedback": "❌ Incorrect Answer"}


def evaluate_subjective(student_answer, correct_answer):
    """Semantic similarity-based evaluation for subjective answers."""
    if not student_answer or not correct_answer:
        return {"score": 0, "similarity": 0, "feedback": "Answer missing."}

    embeddings = get_embeddings_batch([student_answer, correct_answer])
    if not embeddings[0] or not embeddings[1]:
        return {"score": 0, "similarity": 0, "feedback": "Embedding generation failed."}

    similarity = cosine_similarity(embeddings[0], embeddings[1])
    print(f"📊 Similarity Score: {similarity:.3f}")

    if similarity >= 0.85:
        score = 1
        feedback = "Excellent – conceptually accurate and complete."
    elif similarity >= 0.7:
        score = 0.5
        feedback = "Partially correct – needs more detail or clarity."
    else:
        score = 0
        feedback = "Incorrect or lacks conceptual understanding."

    return {"score": score, "similarity": round(similarity, 3), "feedback": feedback}


# ---------------------------
# Flask Route
# ---------------------------

@app.route('/evaluate_mock', methods=['POST'])
def evaluate_mock():
    """
    Evaluates a mock test submission.
    Expected Input JSON:
    {
      "questions": [
        {
          "id": 1,
          "type": "MCQ",
          "correct_answer": "A",
          "student_answer": "A"
        },
        {
          "id": 2,
          "type": "Subjective",
          "correct_answer": "Deadlock occurs when processes wait for each other’s resources indefinitely.",
          "student_answer": "Deadlock is when two processes wait forever for each other’s resources."
        }
      ]
    }
    """
    try:
        data = request.get_json(force=True)
        questions = data.get("questions", [])
        print(f"📩 Received {len(questions)} questions for evaluation.")

        total_score = 0
        evaluated = []

        for q in questions:
            q_type = q.get("type", "subjective").lower()
            q_id = q.get("id")
            print(f"🔍 Evaluating Question ID {q_id} ({q_type.upper()})")

            student_ans = q.get("student_answer", "")
            correct_ans = q.get("correct_answer", "")

            if q_type == "mcq":
                result = evaluate_mcq(student_ans, correct_ans)
            else:
                result = evaluate_subjective(student_ans, correct_ans)

            result["id"] = q_id
            result["type"] = q_type
            evaluated.append(result)
            total_score += result["score"]

        total_questions = len(questions)
        percentage = round((total_score / total_questions) * 100, 2) if total_questions else 0

        print(f"✅ Evaluation Complete → Score: {total_score}/{total_questions} ({percentage}%)")

        return jsonify({
            "total_questions": total_questions,
            "total_score": total_score,
            "percentage": percentage,
            "evaluation": evaluated
        }), 200

    except Exception as e:
        print("❌ Error in /evaluate_mock:", e)
        return jsonify({"error": str(e)}), 500


# ---------------------------
# App Runner
# ---------------------------
if __name__ == '__main__':
    print("🚀 Mock Test & Evaluation Engine running on port 5002")
    app.run(port=5002, debug=True)
