from flask import Flask, request, jsonify
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not found")

client = OpenAI(api_key=OPENAI_API_KEY)

exam_styles = {
    "School Exam": "Ask simple direct textbook-based questions.",
    "University Exam": "Include descriptive questions of 2-mark and 5-mark types.",
    "Competitive Exam": "Generate MCQs focusing on conceptual clarity and reasoning.",
    "Job Interview": "Ask conceptual and scenario-based questions suitable for interviews."
}

@app.route('/generate_questions', methods=["POST"])
def generate_questions():
    try:
        data = request.json
        topic = data.get("topic")
        exam_type = data.get("exam_type", "University Exam")
        difficulty = data.get("difficulty", "medium")
        question_type = data.get("question_type", "mixed")
        num_questions = data.get("num_questions", 5)

        if not topic:
            return jsonify({'error': "Topic is required"}), 400

        prompt = f"""
        You are an educational AI that generates questions and answers based on syllabus topics.

        Topic: {topic}
        Exam Type: {exam_type}
        Difficulty Level: {difficulty}
        Question Type: {question_type}
        Number of Questions: {num_questions}

        Exam Style Guide:
        {exam_styles.get(exam_type, "Generate suitable educational questions.")}

        Instructions:
        - Ensure full coverage of key subtopics from the provided topic.
        - Maintain accuracy and clarity.
        - Provide answers with brief explanations.
        - Respond ONLY in JSON format as:
        [
          {{
            "question": "string",
            "type": "MCQ/Short/Long",
            "options": ["A", "B", "C", "D"] (if MCQ),
            "answer": "string",
            "explanation": "string"
          }}
        ]
        """

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an AI assistant that generates structured educational questions accurately."},
                {"role": "user", "content": prompt}
            ]
        )

        generated_text = response.choices[0].message.content

        # Attempt to parse JSON safely
        import json
        try:
            questions_json = json.loads(generated_text)
        except Exception:
            questions_json = [{"raw_text": generated_text}]

        return jsonify({'questions': questions_json}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5002, debug=True)
