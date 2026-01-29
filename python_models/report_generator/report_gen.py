from flask import Flask, jsonify, send_file
from pymongo import MongoClient
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()
app = Flask(__name__)

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://root:root@pratham.bxzwh2p.mongodb.net/")
client = MongoClient(MONGO_URI)
db = client["edtech_ai"]
collection = db["student_progress"]

def generate_report(student_id):
    records = list(collection.find({"student_id": student_id}, {"_id": 0}))
    if not records:
        return None

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(f"Student Progress Report - {student_id}", styles["Title"]))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles["Normal"]))
    elements.append(Spacer(1, 20))

    for i, r in enumerate(records, 1):
        elements.append(Paragraph(f"<b>Test {i}:</b> {r.get('mock_test_id', '')}", styles["Heading4"]))
        elements.append(Paragraph(f"Score: {r.get('percentage')}%", styles["Normal"]))
        elements.append(Paragraph(f"Date: {r.get('timestamp')}", styles["Normal"]))
        elements.append(Spacer(1, 8))
        for q in r.get("evaluation", []):
            elements.append(Paragraph(f"- {q.get('topic')} | Score: {q.get('score')}", styles["Normal"]))
        elements.append(Spacer(1, 10))

    doc.build(elements)
    buffer.seek(0)
    return buffer

@app.route("/report/<student_id>", methods=["GET"])
def download_report(student_id):
    pdf = generate_report(student_id)
    if not pdf:
        return jsonify({"error": "Student not found"}), 404
    return send_file(pdf, download_name=f"{student_id}_report.pdf", as_attachment=True)

if __name__ == "__main__":
    print("✅ Report Generator running on port 5013")
    app.run(port=5013, debug=True)
