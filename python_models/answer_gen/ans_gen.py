from flask import Flask, request, jsonify
from openai import OpenAI
import os, json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
app = Flask(__name__)

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("❌ OPENAI_API_KEY not found in environment variables.")

client = OpenAI(api_key=OPENAI_API_KEY)

# Exam-style context rules
EXAM_STYLES = {
    "School Exam": "Give short, simple, and direct textbook-based answers understandable for school-level students.",
    "University Exam": "Provide structured and descriptive answers suitable for 2-mark and 5-mark university exam questions.",
    "Competitive Exam": "Give concise, fact-based answers focusing on accuracy and key terms for multiple-choice preparation.",
    "Job Interview": "Provide conceptual and scenario-based explanations that demonstrate practical understanding and reasoning."
}


@app.route('/generate_answer', methods=['POST'])
def generate_answer():
    """
    Input:  { "question": "Explain deadlock in Operating Systems", "exam_type": "University Exam" }
    Output: { "answer": "...", "explanation": "..." }
    """
    try:
        data = request.json
        question = data.get("question")
        exam_type = data.get("exam_type", "University Exam")

        if not question:
            return jsonify({"error": "Question field is required"}), 400

        style_instruction = EXAM_STYLES.get(
            exam_type, "Provide a concise factual answer appropriate for the given question."
        )

        prompt = f"""
        You are a subject expert preparing answers for a {exam_type}.

        {style_instruction}

        Question: {question}

        Provide:
        - A clear and accurate answer.
        - A short explanation (2–3 lines) improving understanding.
        
        Respond strictly in JSON format:
        {{
          "answer": "string",
          "explanation": "string"
        }}
        """

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an educational AI that provides precise academic answers following exam-specific styles."},
                {"role": "user", "content": prompt}
            ]
        )

        generated_text = response.choices[0].message.content.strip()

        try:
            result = json.loads(generated_text)
        except json.JSONDecodeError:
            result = {"raw_output": generated_text}

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/generate_answers_batch', methods=['POST'])
def generate_answers_batch():
    """
    Input: { "questions": ["Q1", "Q2"], "exam_type": "School Exam" }
    Output: { "answers": [ {...}, {...} ] }
    """
    try:
        data = request.json
        questions = data.get("questions", [])
        exam_type = data.get("exam_type", "University Exam")

        if not questions:
            return jsonify({"error": "questions list is required"}), 400

        style_instruction = EXAM_STYLES.get(
            exam_type, "Provide a concise factual answer appropriate for the given question."
        )

        results = []
        for q in questions:
            prompt = f"""
            You are a subject expert preparing answers for a {exam_type}.
            {style_instruction}

            Question: {q}

            Respond in valid JSON format:
            {{
              "answer": "string",
              "explanation": "string"
            }}
            """

            resp = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an educational AI that provides precise academic answers following exam-specific styles."},
                    {"role": "user", "content": prompt}
                ]
            )
            txt = resp.choices[0].message.content.strip()

            try:
                results.append(json.loads(txt))
            except json.JSONDecodeError:
                results.append({"question": q, "raw_output": txt})

        return jsonify({"answers": results}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5002, debug=True)
    print("✅ Enhanced Answer/Explanation model running on port 5002")
