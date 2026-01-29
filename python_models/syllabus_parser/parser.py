import os
import re
import tempfile
import pdfplumber
import whisper
import spacy
import nltk
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename

# ---------------------------
# 🧩 INITIAL SETUP
# ---------------------------
nltk.download("punkt", quiet=True)
nltk.download("stopwords", quiet=True)
nltk.download("punkt_tab", quiet=True)

from nltk.corpus import stopwords
from nltk.tokenize import sent_tokenize, word_tokenize

# ✅ Auto-download spaCy model if missing
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    from spacy.cli import download
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

app = Flask(__name__)

ALLOWED_EXTENSIONS = {"pdf", "txt", "mp3", "wav", "m4a"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ---------------------------
# 1️⃣ PDF / TEXT EXTRACTORS
# ---------------------------
def extract_text_from_pdf(pdf_path):
    """Extracts text from PDF using pdfplumber"""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        print(f"❌ PDF parsing error: {e}")
    return text.strip()


def extract_text_from_txt(file_path):
    """Reads raw text file"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception as e:
        print(f"❌ Text file error: {e}")
        return ""


# ---------------------------
# 2️⃣ VOICE TRANSCRIPTION
# ---------------------------
def transcribe_audio(audio_path):
    """Transcribes voice audio using Whisper"""
    try:
        model = whisper.load_model("base")
        result = model.transcribe(audio_path)
        return result["text"].strip()
    except Exception as e:
        print(f"❌ Whisper transcription error: {e}")
        return ""


# ---------------------------
# 3️⃣ NLP TOPIC EXTRACTION
# ---------------------------
def extract_topics(text):
    """
    Extracts main topics & subtopics using NLP.
    Combines keyword extraction + Named Entity Recognition.
    """
    if not text:
        return {"main_topics": [], "sub_topics": []}

    doc = nlp(text)
    sentences = sent_tokenize(text)
    stop_words = set(stopwords.words("english"))
    keywords = []

    for sent in sentences:
        words = word_tokenize(sent)
        filtered = [w for w in words if w.isalpha() and w.lower() not in stop_words]
        keywords.extend(filtered)

    # Named entities (short proper nouns, concepts)
    entities = [ent.text for ent in doc.ents if 2 <= len(ent.text.split()) <= 5]

    all_topics = list(set([w.title() for w in keywords + entities if len(w) > 3]))

    structured = {
        "main_topics": all_topics[:10],
        "sub_topics": all_topics[10:30],
    }

    return structured


# ---------------------------
# 4️⃣ FLASK ROUTE
# ---------------------------
@app.route("/parse_syllabus", methods=["POST"])
def parse_syllabus():
    print("\n📥 Incoming request received...")
    print("✅ request.is_json:", request.is_json)
    print("✅ request.files keys:", list(request.files.keys()))
    print("✅ request.form keys:", list(request.form.keys()))

    text = ""

    # Case 1: JSON Text Input
    if request.is_json:
        data = request.get_json()
        text = data.get("text", "").strip()
        print("🧾 Received JSON text length:", len(text))

    # Case 2: File Upload (PDF / TXT / Audio)
    elif len(request.files) > 0:
        # ✅ Handle any key name — lowercase, uppercase, or blank
        file_key = next(iter(request.files))
        file = request.files[file_key]
        print(f"📂 File received ({file_key}):", file.filename)

        if file.filename == "" or not allowed_file(file.filename):
            return jsonify({"error": "Invalid or missing file"}), 400

        filename = secure_filename(file.filename)
        temp_dir = tempfile.mkdtemp()
        file_path = os.path.join(temp_dir, filename)
        file.save(file_path)
        print("💾 Saved to:", file_path)

        ext = filename.rsplit(".", 1)[1].lower()
        if ext == "pdf":
            text = extract_text_from_pdf(file_path)
        elif ext == "txt":
            text = extract_text_from_txt(file_path)
        elif ext in ["mp3", "wav", "m4a"]:
            text = transcribe_audio(file_path)
        else:
            return jsonify({"error": "Unsupported file type"}), 400

    else:
        print("❌ No JSON or file found in request.")
        return jsonify({"error": "No valid input found"}), 400

    if not text:
        print("❌ No text extracted.")
        return jsonify({"error": "No text could be extracted"}), 500

    topics = extract_topics(text)
    print("✅ Topics extracted successfully!")

    return jsonify({
        "raw_text_preview": text[:1000] + ("..." if len(text) > 1000 else ""),
        "topics": topics
    })




if __name__ == "__main__":
    app.run(port=5003, debug=True)
    print("✅ Syllabus Parser API running on port 5003")
