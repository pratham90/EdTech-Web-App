"""
Unified Python Service - All EdTech Models Integrated
Run this single file to start all AI models
"""

from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from openai import OpenAI
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import json
import uuid
import time
import tempfile
import re
import numpy as np
from datetime import datetime
from io import BytesIO
from werkzeug.utils import secure_filename

# PDF and Audio processing
import pdfplumber
try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    print("⚠️ Whisper not available. Audio transcription will be disabled.")

# NLP libraries
try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
    SPACY_AVAILABLE = True
except:
    SPACY_AVAILABLE = False
    print("⚠️ spaCy not available. Some NLP features may be limited.")

import nltk
nltk.download("punkt", quiet=True)
nltk.download("stopwords", quiet=True)
nltk.download("punkt_tab", quiet=True)
from nltk.corpus import stopwords
from nltk.tokenize import sent_tokenize, word_tokenize

# PDF generation
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

# ---------------------------
# Setup
# ---------------------------
load_dotenv()
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")

if not OPENAI_API_KEY:
    raise ValueError("❌ OPENAI_API_KEY not found in environment variables")

client = OpenAI(api_key=OPENAI_API_KEY)

# MongoDB setup with proper timeout settings and retry logic
def get_mongo_client():
    """Get MongoDB client with retry logic"""
    mongo_options = {
        "serverSelectionTimeoutMS": 10000,  # 10 seconds to select server
        "connectTimeoutMS": 10000,  # 10 seconds to connect
        "socketTimeoutMS": 60000,  # 60 seconds for socket operations (increased)
        "retryWrites": True,
        "w": "majority",
        "maxPoolSize": 50,  # Maintain up to 50 socket connections
        "minPoolSize": 5,  # Maintain at least 5 socket connections
        "maxIdleTimeMS": 45000,  # Close connections after 45 seconds of inactivity
        "retryReads": True,  # Enable retry for read operations
    }
    return MongoClient(MONGO_URI, **mongo_options)

# Helper function for MongoDB operations with retry logic
def mongo_operation_with_retry(operation, max_retries=3, retry_delay=1):
    """Execute MongoDB operation with automatic retry on connection errors"""
    from pymongo.errors import AutoReconnect, ServerSelectionTimeoutError, NetworkTimeout
    
    for attempt in range(max_retries):
        try:
            return operation()
        except (AutoReconnect, ServerSelectionTimeoutError, NetworkTimeout) as e:
            if attempt < max_retries - 1:
                wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                print(f"⚠️ MongoDB connection error (attempt {attempt + 1}/{max_retries}): {e}")
                print(f"🔄 Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
                # Try to refresh connection if mongo_client exists
                try:
                    if 'mongo_client' in globals() and mongo_client is not None:
                        mongo_client.admin.command('ping')
                except:
                    pass
            else:
                print(f"❌ MongoDB operation failed after {max_retries} attempts: {e}")
                raise
        except Exception as e:
            # For non-connection errors, don't retry
            raise

try:
    mongo_client = get_mongo_client()
    # Test connection
    mongo_client.admin.command('ping')
    db = mongo_client["edtech_ai"]
    papers_collection = db["question_papers"]
    evaluations_collection = db["evaluations"]
    progress_collection = db["student_progress"]
    assignments_collection = db["assignments"]  # Store test assignments
    print("✅ MongoDB connected successfully")
except Exception as e:
    print(f"⚠️ MongoDB connection failed: {e}")
    print(f"💡 Make sure MongoDB is running and connection string is correct")
    mongo_client = None
    papers_collection = None
    evaluations_collection = None
    progress_collection = None
    assignments_collection = None

# In-memory session store for interview bot
INTERVIEW_SESSIONS = {}

# Exam styles configuration
EXAM_STYLES = {
    "School Exam": "Give short, simple, and direct textbook-based answers understandable for school-level students.",
    "University Exam": "Provide structured and descriptive answers suitable for 2-mark and 5-mark university exam questions.",
    "Competitive Exam": "Give concise, fact-based answers focusing on accuracy and key terms for multiple-choice preparation.",
    "Job Interview": "Provide conceptual and scenario-based explanations that demonstrate practical understanding and reasoning."
}

# Resource recommendations map
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

ALLOWED_EXTENSIONS = {"pdf", "txt", "mp3", "wav", "m4a", "webm", "ogg", "flac"}

# ---------------------------
# Helper Functions
# ---------------------------

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

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

def check_ffmpeg():
    """Check if ffmpeg is available"""
    import subprocess
    try:
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, timeout=5)
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False

def transcribe_audio(audio_path):
    """Transcribes voice audio using Whisper"""
    if not WHISPER_AVAILABLE:
        print("⚠️ Whisper not available - cannot transcribe audio")
        raise ValueError("Audio transcription is not available. Please install Whisper or use text/PDF input instead.")
    
    # Check if ffmpeg is available (required by Whisper)
    if not check_ffmpeg():
        error_msg = (
            "FFmpeg is not installed or not in PATH. "
            "Whisper requires FFmpeg to process audio files.\n\n"
            "Quick fix options:\n"
            "1. Install via Chocolatey: choco install ffmpeg (run PowerShell as Admin)\n"
            "2. Install via Winget: winget install ffmpeg\n"
            "3. Manual: Download from https://www.gyan.dev/ffmpeg/builds/ and add to PATH\n\n"
            "After installing, RESTART your Python service.\n"
            "See FFMPEG_INSTALLATION.md for detailed instructions.\n\n"
            "Alternative: Use text input or upload PDF/TXT files instead of audio."
        )
        print(f"❌ {error_msg}")
        raise ValueError("FFmpeg is not installed. Please install FFmpeg and restart the service. See FFMPEG_INSTALLATION.md for instructions.")
    
    # Convert to absolute path and normalize for Windows compatibility
    audio_path = os.path.abspath(os.path.normpath(audio_path))
    print(f"🎤 Transcription input path (absolute): {audio_path}")
    
    # Verify file exists before processing
    if not os.path.exists(audio_path):
        error_msg = f"Audio file not found at path: {audio_path}"
        print(f"❌ {error_msg}")
        print(f"📁 Current working directory: {os.getcwd()}")
        print(f"📁 Parent directory exists: {os.path.exists(os.path.dirname(audio_path)) if os.path.dirname(audio_path) else 'N/A'}")
        raise FileNotFoundError(f"Failed to transcribe audio: {error_msg}. Please try a different audio file or use text input.")
    
    # Verify file is readable
    if not os.access(audio_path, os.R_OK):
        error_msg = f"Audio file is not readable: {audio_path}"
        print(f"❌ {error_msg}")
        raise ValueError(f"Failed to transcribe audio: {error_msg}. Please check file permissions.")
    
    # Get file size
    file_size = os.path.getsize(audio_path)
    print(f"📊 File size: {file_size} bytes")
    
    if file_size == 0:
        raise ValueError("Audio file is empty. Please check your recording and try again.")
    
    # Load model first (before any file operations that might fail)
    print(f"⏳ Loading Whisper model...")
    model = whisper.load_model("base")
    print("✅ Whisper model loaded")
    
    try:
        print(f"🎤 Starting audio transcription for: {audio_path}")
        
        # Double-check file exists right before transcription
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"File disappeared before transcription: {audio_path}")
        
        # Verify file is readable and get size
        file_size_check = os.path.getsize(audio_path)
        print(f"🔍 Pre-transcription check: file exists, size={file_size_check} bytes, readable={os.access(audio_path, os.R_OK)}")
        
        # For Windows, try multiple path formats
        transcription_attempts = []
        if os.name == 'nt':  # Windows
            # Try 1: Forward slashes (often works better with ffmpeg)
            transcription_attempts.append(audio_path.replace('\\', '/'))
            # Try 2: Original path with backslashes
            transcription_attempts.append(audio_path)
        else:
            transcription_attempts.append(audio_path)
        
        result = None
        last_error = None
        
        for attempt_path in transcription_attempts:
            try:
                print(f"🔍 Attempting transcription with path: {attempt_path}")
                # Ensure file still exists (check original path)
                if not os.path.exists(audio_path):
                    raise FileNotFoundError(f"File disappeared: {audio_path}")
                
                result = model.transcribe(attempt_path)
                print(f"✅ Transcription succeeded with path format")
                break
            except (FileNotFoundError, OSError) as path_error:
                last_error = path_error
                error_str = str(path_error)
                print(f"⚠️ Attempt failed with path '{attempt_path}': {path_error}")
                
                # Check if it's an ffmpeg not found error
                if 'WinError 2' in error_str or 'cannot find the file specified' in error_str.lower():
                    # This is likely an ffmpeg issue, not a file path issue
                    if not check_ffmpeg():
                        raise ValueError(
                            "FFmpeg is not installed or not in PATH. "
                            "Please install FFmpeg from https://ffmpeg.org/download.html "
                            "and add it to your system PATH, then restart the service."
                        )
                
                if attempt_path != transcription_attempts[-1]:
                    print(f"🔄 Trying next path format...")
                    continue
                else:
                    # Last attempt failed - will be caught by outer exception handler
                    raise
        
        transcribed_text = result["text"].strip()
        print(f"✅ Transcription completed: {len(transcribed_text)} characters")
        
        if not transcribed_text:
            raise ValueError("Audio transcription returned empty text. The audio might be too short, silent, or unclear.")
        
        return transcribed_text
    except FileNotFoundError as fnf:
        # Re-raise FileNotFoundError with more context
        error_msg = f"File not found during transcription: {audio_path}. Error: {str(fnf)}"
        print(f"❌ {error_msg}")
        # Check if file still exists
        if os.path.exists(audio_path):
            print(f"⚠️ File still exists but Whisper can't access it. This might be a permissions or path format issue.")
            print(f"💡 Trying alternative approach with direct file read...")
            # Try reading the file into memory and using BytesIO
            try:
                import io
                with open(audio_path, 'rb') as f:
                    audio_bytes = f.read()
                print(f"📋 Read {len(audio_bytes)} bytes from file into memory")
                
                # Try using BytesIO
                audio_io = io.BytesIO(audio_bytes)
                # Note: Whisper might not support BytesIO directly, so try saving to a very simple path
                simple_path = os.path.join('C:', 'temp', f"whisper_{uuid.uuid4().hex[:8]}.webm")
                try:
                    os.makedirs(os.path.dirname(simple_path), exist_ok=True)
                except:
                    # If C:\temp doesn't work, use system temp with very short name
                    simple_path = os.path.join(tempfile.gettempdir(), f"w{uuid.uuid4().hex[:6]}.webm")
                
                with open(simple_path, 'wb') as f:
                    f.write(audio_bytes)
                
                print(f"📋 Saved to very simple path: {simple_path}")
                if os.path.exists(simple_path):
                    # Try with forward slashes
                    simple_path_forward = simple_path.replace('\\', '/')
                    result = model.transcribe(simple_path_forward)
                    transcribed_text = result["text"].strip()
                    # Cleanup
                    try:
                        os.remove(simple_path)
                    except:
                        pass
                    if transcribed_text:
                        print(f"✅ Alternative approach succeeded!")
                        return transcribed_text
            except Exception as alt_error:
                print(f"❌ Alternative approach also failed: {alt_error}")
                import traceback
                traceback.print_exc()
        raise FileNotFoundError(error_msg)
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Whisper transcription error: {error_msg}")
        import traceback
        traceback.print_exc()
        raise ValueError(f"Failed to transcribe audio: {error_msg}. Please try a different audio file or use text input.")

def extract_topics(text):
    """Extracts main topics & subtopics using NLP"""
    if not text:
        return {"main_topics": [], "sub_topics": []}
    
    if SPACY_AVAILABLE:
        doc = nlp(text)
        entities = [ent.text for ent in doc.ents if 2 <= len(ent.text.split()) <= 5]
    else:
        entities = []
    
    sentences = sent_tokenize(text)
    stop_words = set(stopwords.words("english"))
    keywords = []
    
    for sent in sentences:
        words = word_tokenize(sent)
        filtered = [w for w in words if w.isalpha() and w.lower() not in stop_words]
        keywords.extend(filtered)
    
    all_topics = list(set([w.title() for w in keywords + entities if len(w) > 3]))
    
    return {
        "main_topics": all_topics[:10],
        "sub_topics": all_topics[10:30],
    }

def cosine_similarity(vec1, vec2):
    """Compute cosine similarity between two vectors"""
    a, b = np.array(vec1), np.array(vec2)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)

def get_embeddings_batch(texts, timeout=40):
    """Generate embeddings for multiple texts with increased timeout"""
    try:
        start = time.time()
        # Use longer timeout for embeddings (40 seconds)
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=texts,
            timeout=timeout
        )
        elapsed = time.time() - start
        print(f"✅ Embeddings generated for {len(texts)} items in {elapsed:.2f}s")
        return [item.embedding for item in response.data]
    except Exception as e:
        print(f"❌ Embedding error: {e}")
        # Return None for all embeddings to trigger fallback
        return [None] * len(texts)

def clean_json(text):
    """Remove extra formatting and safely parse JSON"""
    try:
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        print(f"⚠️ JSON parse error: {e}")
        return {}

# ---------------------------
# 1. SYLLABUS PARSER ROUTES
# ---------------------------

@app.route("/api/parse_syllabus", methods=["POST"])
def parse_syllabus():
    """Parse syllabus from PDF, text, or voice"""
    print("\n📥 Syllabus parsing request received...")
    print(f"📋 Request method: {request.method}")
    print(f"📋 Content-Type: {request.content_type}")
    print(f"📋 Has files: {len(request.files) > 0}")
    print(f"📋 Is JSON: {request.is_json}")
    
    text = ""
    
    # Case 1: JSON Text Input
    if request.is_json:
        data = request.get_json()
        text = data.get("text", "").strip()
        print(f"🧾 Received JSON text length: {len(text)}")
    
    # Case 2: File Upload (PDF / TXT / Audio)
    elif len(request.files) > 0:
        file_key = next(iter(request.files))
        file = request.files[file_key]
        print(f"📂 File received ({file_key}): {file.filename}")
        print(f"📊 File details: size={file.content_length if hasattr(file, 'content_length') else 'unknown'}, type={file.content_type if hasattr(file, 'content_type') else 'unknown'}")
        
        # Log file type information for debugging
        if hasattr(file, 'mimetype'):
            print(f"📄 MIME type: {file.mimetype}")
        if hasattr(file, 'content_type'):
            print(f"📄 Content type: {file.content_type}")
        
        # Handle empty filename or missing extension
        if not file.filename or file.filename == "":
            # Try to detect from content type (check both content_type and mimetype)
            content_type = ''
            if hasattr(file, 'content_type') and file.content_type:
                content_type = file.content_type
            elif hasattr(file, 'mimetype') and file.mimetype:
                content_type = file.mimetype
            print(f"⚠️ No filename provided, detecting from content type: {content_type}")
            
            # Map content types to extensions
            content_type_map = {
                'audio/webm': 'webm',
                'audio/mpeg': 'mp3',
                'audio/wav': 'wav',
                'audio/x-wav': 'wav',
                'audio/mp4': 'm4a',
                'audio/ogg': 'ogg',
                'audio/flac': 'flac',
                'application/pdf': 'pdf',
                'text/plain': 'txt'
            }
            
            # Try to get extension from content type
            ext = None
            for ct, ext_val in content_type_map.items():
                if ct in content_type.lower():
                    ext = ext_val
                    break
            
            # Default to webm for audio if not detected
            if not ext:
                if 'audio' in content_type.lower():
                    ext = 'webm'
                    print(f"⚠️ Defaulting to webm for audio file")
                else:
                    return jsonify({"error": "Cannot determine file type. Please ensure the file has a proper extension or content type."}), 400
            
            filename = f"upload.{ext}"
        elif not allowed_file(file.filename):
            # Check if we can still process it by extension detection
            print(f"⚠️ Filename '{file.filename}' not in allowed list, attempting to process anyway")
            filename = file.filename
        else:
            filename = file.filename
        
        # Secure the filename to prevent path traversal
        filename = secure_filename(filename)
        
        # Create temp directory and ensure it exists
        temp_dir = tempfile.mkdtemp(prefix='edtech_audio_')
        print(f"📁 Created temp directory: {temp_dir}")
        
        # Use absolute path and normalize for Windows compatibility
        file_path = os.path.abspath(os.path.normpath(os.path.join(temp_dir, filename)))
        print(f"📝 Target file path: {file_path}")
        
        # Ensure temp directory exists
        os.makedirs(temp_dir, exist_ok=True)
        
        try:
            # Save file with explicit error handling
            file.save(file_path)
            
            # Ensure file is fully written and closed
            import time
            time.sleep(0.1)  # Small delay to ensure file is fully written
            
            # Flush any buffers
            if hasattr(file, 'stream'):
                try:
                    file.stream.flush()
                except:
                    pass
            
            print(f"💾 File saved to: {file_path}")
            
            # Verify immediately after save
            if not os.path.exists(file_path):
                print(f"❌ File does not exist after save! Path: {file_path}")
                print(f"📁 Temp directory exists: {os.path.exists(temp_dir)}")
                print(f"📁 Temp directory contents: {os.listdir(temp_dir) if os.path.exists(temp_dir) else 'N/A'}")
                return jsonify({"error": f"File was not saved correctly. Path: {file_path}"}), 500
            
            file_size = os.path.getsize(file_path)
            if file_size == 0:
                print(f"❌ File is empty after save!")
                return jsonify({"error": "Uploaded file is empty. Please check your file and try again."}), 400
            
            print(f"✅ File saved successfully: {file_size} bytes")
            print(f"✅ File path verified: {file_path}")
            print(f"✅ File is readable: {os.access(file_path, os.R_OK)}")
            
        except Exception as save_error:
            print(f"❌ Error saving file: {save_error}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Failed to save uploaded file: {str(save_error)}"}), 500
        
        # Get file extension - handle files without extension or with multiple dots
        if "." in filename:
            ext = filename.rsplit(".", 1)[1].lower()
        else:
            # This shouldn't happen now since we set filename above, but keep as fallback
            ext = "webm"
            print(f"⚠️ No extension found, defaulting to webm for audio file")
        
        print(f"📄 Processing file with extension: {ext}")
        
        if ext == "pdf":
            text = extract_text_from_pdf(file_path)
        elif ext == "txt":
            text = extract_text_from_txt(file_path)
        elif ext in ["mp3", "wav", "m4a", "webm", "ogg", "flac"]:
            # Double-check file exists before transcription
            if not os.path.exists(file_path):
                print(f"❌ File missing before transcription! Path: {file_path}")
                return jsonify({"error": f"File not found at path: {file_path}. Please try again."}), 500
            
            print(f"🎤 Starting transcription for file: {file_path}")
            print(f"📊 File size before transcription: {os.path.getsize(file_path)} bytes")
            
            # For Windows, copy to a simpler path to avoid path issues with Whisper/ffmpeg
            transcription_file_path = file_path
            temp_copy_path = None
            if os.name == 'nt':  # Windows
                try:
                    import shutil
                    # Create a very simple path - use C:\temp or system temp with simple name
                    # Avoid long paths and special characters
                    simple_filename = f"audio_{uuid.uuid4().hex[:8]}.{ext}"
                    # Use system temp directory directly (usually C:\Users\...\AppData\Local\Temp)
                    system_temp = tempfile.gettempdir()
                    temp_copy_path = os.path.join(system_temp, simple_filename)
                    
                    # Normalize the path
                    temp_copy_path = os.path.normpath(temp_copy_path)
                    
                    print(f"📋 Copying file to simpler path for Whisper: {temp_copy_path}")
                    
                    # Ensure source file is closed and accessible
                    import time
                    time.sleep(0.1)
                    
                    # Copy with metadata preservation
                    shutil.copy2(file_path, temp_copy_path)
                    
                    # Wait a moment and verify copy
                    time.sleep(0.1)
                    
                    if os.path.exists(temp_copy_path):
                        copy_size = os.path.getsize(temp_copy_path)
                        if copy_size > 0 and copy_size == os.path.getsize(file_path):
                            transcription_file_path = temp_copy_path
                            print(f"✅ File copied successfully ({copy_size} bytes), using: {transcription_file_path}")
                        else:
                            print(f"⚠️ Copy size mismatch or empty, using original path")
                            if os.path.exists(temp_copy_path):
                                os.remove(temp_copy_path)
                            temp_copy_path = None
                    else:
                        print(f"⚠️ Copy file does not exist, using original path")
                        temp_copy_path = None
                except Exception as copy_error:
                    print(f"⚠️ Could not copy file, using original path: {copy_error}")
                    import traceback
                    traceback.print_exc()
                    temp_copy_path = None
            
            try:
                text = transcribe_audio(transcription_file_path)
                print(f"✅ Transcription completed successfully")
            except ValueError as ve:
                # Return the error message to user
                print(f"❌ Transcription ValueError: {ve}")
                return jsonify({"error": str(ve)}), 400
            except FileNotFoundError as fnf:
                print(f"❌ FileNotFoundError during transcription: {fnf}")
                print(f"📁 Checking if file still exists: {os.path.exists(transcription_file_path)}")
                return jsonify({"error": f"File not found during transcription: {str(fnf)}. Path: {transcription_file_path}"}), 500
            except Exception as e:
                print(f"❌ Transcription error: {e}")
                import traceback
                traceback.print_exc()
                return jsonify({"error": f"Audio transcription failed: {str(e)}. Please ensure Whisper is installed and the audio file is valid."}), 500
            finally:
                # Cleanup temp copy if we created one
                if temp_copy_path and os.path.exists(temp_copy_path):
                    try:
                        os.remove(temp_copy_path)
                        print(f"🗑️ Removed temp copy: {temp_copy_path}")
                    except Exception as cleanup_error:
                        print(f"⚠️ Could not remove temp copy: {cleanup_error}")
        else:
            return jsonify({"error": f"Unsupported file type: {ext}. Supported: pdf, txt, mp3, wav, m4a, webm, ogg, flac"}), 400
        
        # Cleanup - remove file and temp directory (only after processing is complete)
        # Note: We do this in a finally block to ensure cleanup happens even if there's an error
        cleanup_done = False
        try:
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    print(f"🗑️ Removed file: {file_path}")
                except Exception as remove_error:
                    print(f"⚠️ Could not remove file: {remove_error}")
            
            # Try to remove temp directory (might fail if not empty, that's okay)
            try:
                if os.path.exists(temp_dir):
                    os.rmdir(temp_dir)
                    print(f"🗑️ Removed temp directory: {temp_dir}")
            except Exception as rmdir_error:
                # Directory might not be empty, which is fine
                print(f"⚠️ Could not remove temp directory (may not be empty): {rmdir_error}")
            cleanup_done = True
        except Exception as cleanup_error:
            print(f"⚠️ Cleanup warning: {cleanup_error}")
            # Don't fail the request if cleanup fails
    else:
        return jsonify({"error": "No valid input found"}), 400
    
    if not text or not text.strip():
        error_msg = "No text could be extracted from the input. "
        if len(request.files) > 0:
            file_key = next(iter(request.files))
            file = request.files[file_key]
            ext = file.filename.rsplit(".", 1)[1].lower() if "." in file.filename else "unknown"
            if ext in ["mp3", "wav", "m4a", "webm", "ogg", "flac"]:
                error_msg += "The audio file might be too short, silent, or unclear. Please try recording again or use a different audio file."
            elif ext == "pdf":
                error_msg += "The PDF might be empty, corrupted, or image-based. Please try a different file or use text input."
            else:
                error_msg += "Please check the file and try again, or use text input instead."
        else:
            error_msg += "Please provide valid content."
        return jsonify({"error": error_msg}), 500
    
    topics = extract_topics(text)
    print("✅ Topics extracted successfully!")
    
    return jsonify({
        "raw_text_preview": text[:1000] + ("..." if len(text) > 1000 else ""),
        "full_text": text,
        "topics": topics
    })

# ---------------------------
# 2. QUESTION GENERATOR ROUTES
# ---------------------------

@app.route("/api/generate_questions", methods=["POST"])
def generate_questions():
    """Generate questions based on topic and exam type"""
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
        {EXAM_STYLES.get(exam_type, "Generate suitable educational questions.")}
        
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
        
        try:
            questions_json = json.loads(generated_text)
        except Exception:
            questions_json = clean_json(generated_text)
            if not isinstance(questions_json, list):
                questions_json = [{"raw_text": generated_text}]
        
        return jsonify({'questions': questions_json}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ---------------------------
# 3. ANSWER GENERATOR ROUTES
# ---------------------------

@app.route("/api/generate_answer", methods=["POST"])
def generate_answer():
    """Generate answer for a question"""
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
            result = clean_json(generated_text)
            if not result:
                result = {"raw_output": generated_text}
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/generate_answers_batch", methods=["POST"])
def generate_answers_batch():
    """Generate answers for multiple questions"""
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
                parsed = clean_json(txt)
                results.append(parsed if parsed else {"question": q, "raw_output": txt})
        
        return jsonify({"answers": results}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------
# 4. MOCK TEST EVALUATOR ROUTES
# ---------------------------

def extract_answer_letter(answer):
    """Extract just the letter from answer formats like 'B) Text', 'B.', 'B', 'b', etc."""
    if not answer:
        return ""
    
    answer = answer.strip()
    
    # If it's just a single letter (a-z, A-Z), return it lowercase
    if len(answer) == 1 and answer.isalpha():
        return answer.lower()
    
    # If it starts with a letter followed by ) or . (e.g., "B) Text" or "B. Text")
    if len(answer) >= 2 and answer[0].isalpha() and answer[1] in [')', '.', ':']:
        return answer[0].lower()
    
    # If it's a longer string, try to extract the first letter
    # Handle formats like "B) Application Programming Interface"
    import re
    match = re.match(r'^([a-zA-Z])[\)\.\:\s]', answer)
    if match:
        return match.group(1).lower()
    
    # If no pattern matches, return the first character if it's a letter
    if answer and answer[0].isalpha():
        return answer[0].lower()
    
    # Otherwise, return the whole answer (for non-MCQ answers)
    return answer.lower()

@app.route("/api/evaluate_mock", methods=['POST'])
def evaluate_mock():
    """Evaluate a mock test submission"""
    try:
        data = request.get_json(force=True)
        questions = data.get("questions", [])
        print(f"📩 Received {len(questions)} questions for evaluation.")
        
        total_score = 0
        total_marks = 0
        evaluated = []
        
        for idx, q in enumerate(questions):
            q_type = q.get("type", "subjective").lower()
            q_id = q.get("id", idx + 1)
            marks = q.get("marks", 1)
            total_marks += marks
            
            print(f"🔍 Evaluating Question ID {q_id} ({q_type.upper()})")
            
            student_ans = str(q.get("student_answer", "")).strip()
            correct_ans = str(q.get("correct_answer", "")).strip()
            
            print(f"   Student Answer: '{student_ans}'")
            print(f"   Correct Answer: '{correct_ans}'")
            
            if q_type == "mcq" or q_type == "mixed":
                # Rule-based MCQ evaluation - extract just the letter
                if not student_ans or not correct_ans:
                    result = {
                        "id": q_id,
                        "type": q_type,
                        "score": 0,
                        "marks": marks,
                        "feedback": "Answer missing.",
                        "is_correct": False
                    }
                else:
                    # Extract just the letter from both answers
                    student_letter = extract_answer_letter(student_ans)
                    correct_letter = extract_answer_letter(correct_ans)
                    
                    print(f"   Extracted - Student: '{student_letter}', Correct: '{correct_letter}'")
                    
                    if student_letter == correct_letter:
                        result = {
                            "id": q_id,
                            "type": q_type,
                            "score": marks,
                            "marks": marks,
                            "feedback": "✅ Correct Answer",
                            "is_correct": True
                        }
                        total_score += marks
                    else:
                        result = {
                            "id": q_id,
                            "type": q_type,
                            "score": 0,
                            "marks": marks,
                            "feedback": "❌ Incorrect Answer",
                            "is_correct": False
                        }
            else:
                # Semantic similarity for subjective
                if not student_ans or not correct_ans:
                    result = {
                        "id": q_id,
                        "type": q_type,
                        "score": 0,
                        "marks": marks,
                        "similarity": 0,
                        "feedback": "Answer missing.",
                        "is_correct": False
                    }
                else:
                    embeddings = get_embeddings_batch([student_ans, correct_ans])
                    if not embeddings[0] or not embeddings[1]:
                        result = {
                            "id": q_id,
                            "type": q_type,
                            "score": 0,
                            "marks": marks,
                            "similarity": 0,
                            "feedback": "Embedding generation failed.",
                            "is_correct": False
                        }
                    else:
                        similarity = cosine_similarity(embeddings[0], embeddings[1])
                        print(f"📊 Similarity Score: {similarity:.3f}")
                        
                        if similarity >= 0.85:
                            score = marks
                            feedback = "Excellent – conceptually accurate and complete."
                            is_correct = True
                        elif similarity >= 0.7:
                            score = round(marks * 0.6, 2)
                            feedback = "Partially correct – needs more detail or clarity."
                            is_correct = False
                        else:
                            score = 0
                            feedback = "Incorrect or lacks conceptual understanding."
                            is_correct = False
                        
                        result = {
                            "id": q_id,
                            "type": q_type,
                            "score": score,
                            "marks": marks,
                            "similarity": round(similarity, 3),
                            "feedback": feedback,
                            "is_correct": is_correct
                        }
                        total_score += score
            
            evaluated.append(result)
        
        total_questions = len(questions)
        correct_answers = sum(1 for r in evaluated if r.get("is_correct", False))
        percentage = round((total_score / total_marks) * 100, 2) if total_marks else 0
        
        print(f"✅ Evaluation Complete → Score: {total_score}/{total_marks} ({percentage}%)")
        
        return jsonify({
            "total_questions": total_questions,
            "total_marks": total_marks,
            "total_score": total_score,
            "correct_answers": correct_answers,
            "percentage": percentage,
            "question_results": evaluated,
            "evaluation": evaluated  # Keep for backward compatibility
        }), 200
    
    except Exception as e:
        print("❌ Error in /evaluate_mock:", e)
        return jsonify({"error": str(e)}), 500

# ---------------------------
# 5. SMART EVALUATOR ROUTES
# ---------------------------

@app.route("/api/evaluate_student", methods=["POST"])
def evaluate_student():
    """Smart evaluator for student answers"""
    try:
        data = request.get_json(force=True)
        student_id = data.get("student_id", "ANON")
        paper_id = data.get("paper_id")
        paper = data.get("paper")
        answers = data.get("answers", [])
        
        # Fetch paper if paper_id provided (with retry logic)
        if not paper and paper_id and papers_collection is not None:
            def fetch_paper():
                return papers_collection.find_one({"_id": paper_id}, {"_id": 0})
            
            try:
                paper = mongo_operation_with_retry(fetch_paper, max_retries=2, retry_delay=1)
                if not paper:
                    return jsonify({"error": "paper_id not found"}), 404
            except Exception as e:
                print(f"⚠️ Failed to fetch paper from DB: {e}")
                return jsonify({"error": f"Database connection error: {str(e)}. Please try again."}), 500
        
        if not paper:
            return jsonify({"error": "No paper provided or found."}), 400
        
        questions = paper.get("questions", [])
        if not questions or len(questions) == 0:
            return jsonify({"error": "Paper has no questions"}), 400
        
        if not answers or len(answers) == 0:
            return jsonify({"error": "No answers provided"}), 400
        
        total_marks = paper.get("total_marks", sum([q.get("marks", 0) for q in questions]))
        
        # Build answer map safely - handle missing or invalid q_index
        answer_map = {}
        for a in answers:
            try:
                q_idx = int(a.get("q_index", 0))
                if q_idx > 0:
                    answer_map[q_idx] = a.get("student_answer", "")
            except (ValueError, TypeError):
                continue
        
        subj_texts = []
        subj_q_indices = []
        details = []
        
        for idx, q in enumerate(questions, start=1):
            q_type = str(q.get("type", "Short")).lower()
            correct_ans = q.get("answer") or q.get("correct_answer") or ""
            marks = q.get("marks", 0)
            student_ans = answer_map.get(idx, "")
            
            detail = {
                "q_index": idx,
                "question": q.get("question"),
                "type": q.get("type"),
                "marks": marks,
                "student_answer": student_ans,
                "correct_answer": correct_ans,
                "score_awarded": 0,
                "feedback": "",
                "similarity": None
            }
            
            if q_type in ["mcq", "multiple", "choice"]:
                if not student_ans or not correct_ans:
                    score, feedback = 0, "Answer missing."
                else:
                    s = str(student_ans).strip().lower()
                    c = str(correct_ans).strip().lower()
                    if len(s) == 1 and len(c) == 1:
                        score, feedback = (1, "Correct") if s == c else (0, "Incorrect")
                    else:
                        score, feedback = (1, "Correct") if s == c else (0, "Incorrect")
                
                detail["score_awarded"] = score * marks
                detail["feedback"] = feedback
            else:
                subj_texts.append(str(student_ans))
                subj_texts.append(str(correct_ans))
                subj_q_indices.append(idx)
            
            details.append(detail)
        
        # Evaluate subjective questions in batch
        if subj_texts:
            try:
                # Use longer timeout for batch embeddings (50 seconds for large batches)
                batch_timeout = min(50, 20 + len(subj_texts) * 2)  # Scale timeout with batch size
                embeddings = get_embeddings_batch(subj_texts, timeout=batch_timeout)
                for i, q_idx in enumerate(subj_q_indices):
                    student_emb = embeddings[2 * i] if 2 * i < len(embeddings) else None
                    correct_emb = embeddings[2 * i + 1] if (2 * i + 1) < len(embeddings) else None
                    
                    detail = next((d for d in details if d["q_index"] == q_idx), None)
                    if not detail:
                        continue
                    
                    if student_emb is None or correct_emb is None:
                        # Fallback: simple keyword matching if embeddings fail
                        student_ans = str(detail.get("student_answer", "")).lower()
                        correct_ans = str(detail.get("correct_answer", "")).lower()
                        
                        if not student_ans:
                            detail["score_awarded"] = 0
                            detail["feedback"] = "No answer provided"
                        else:
                            # Simple keyword-based scoring as fallback
                            student_words = set(student_ans.split())
                            correct_words = set(correct_ans.split())
                            if len(correct_words) > 0:
                                overlap = len(student_words & correct_words) / len(correct_words)
                                if overlap >= 0.6:
                                    detail["score_awarded"] = round(detail["marks"] * 0.7, 2)
                                    detail["feedback"] = "Partially correct (evaluated without AI)"
                                elif overlap >= 0.3:
                                    detail["score_awarded"] = round(detail["marks"] * 0.4, 2)
                                    detail["feedback"] = "Attempted (evaluated without AI)"
                                else:
                                    detail["score_awarded"] = round(detail["marks"] * 0.1, 2)
                                    detail["feedback"] = "Insufficient (evaluated without AI)"
                            else:
                                detail["score_awarded"] = 0
                                detail["feedback"] = "Could not evaluate"
                        continue
                    
                    sim = cosine_similarity(student_emb, correct_emb)
                    detail["similarity"] = round(sim, 3)
                    
                    if sim >= 0.85:
                        awarded = detail["marks"]
                        feedback = "Excellent"
                    elif sim >= 0.7:
                        awarded = round(detail["marks"] * 0.6, 2)
                        feedback = "Partially correct"
                    elif sim >= 0.55:
                        awarded = round(detail["marks"] * 0.3, 2)
                        feedback = "Attempted but insufficient"
                    else:
                        awarded = 0
                        feedback = "Incorrect / off-topic"
                    
                    detail["score_awarded"] = awarded
                    detail["feedback"] = feedback
            except Exception as emb_error:
                print(f"⚠️ Embedding evaluation failed, using fallback: {emb_error}")
                # Fallback evaluation for all subjective questions
                for q_idx in subj_q_indices:
                    detail = next((d for d in details if d["q_index"] == q_idx), None)
                    if detail:
                        student_ans = str(detail.get("student_answer", "")).lower()
                        correct_ans = str(detail.get("correct_answer", "")).lower()
                        
                        if not student_ans:
                            detail["score_awarded"] = 0
                            detail["feedback"] = "No answer provided"
                        else:
                            # Simple keyword-based scoring
                            student_words = set(student_ans.split())
                            correct_words = set(correct_ans.split())
                            if len(correct_words) > 0:
                                overlap = len(student_words & correct_words) / len(correct_words)
                                if overlap >= 0.6:
                                    detail["score_awarded"] = round(detail["marks"] * 0.7, 2)
                                    detail["feedback"] = "Partially correct (fallback evaluation)"
                                elif overlap >= 0.3:
                                    detail["score_awarded"] = round(detail["marks"] * 0.4, 2)
                                    detail["feedback"] = "Attempted (fallback evaluation)"
                                else:
                                    detail["score_awarded"] = round(detail["marks"] * 0.1, 2)
                                    detail["feedback"] = "Insufficient (fallback evaluation)"
                            else:
                                detail["score_awarded"] = 0
                                detail["feedback"] = "Could not evaluate"
        
        total_score = sum([d.get("score_awarded", 0) for d in details])
        percentage = round((total_score / total_marks) * 100, 2) if total_marks else 0.0
        
        eval_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        evaluation_doc = {
            "eval_id": eval_id,
            "student_id": student_id,
            "paper_id": paper_id,
            "paper_title": paper.get("title", "Untitled"),
            "timestamp": timestamp,
            "total_marks": total_marks,
            "total_score": total_score,
            "percentage": percentage,
            "details": details
        }
        
        # Save to DB with retry logic
        if evaluations_collection is not None:
            def save_evaluation():
                evaluations_collection.insert_one(evaluation_doc)
                print(f"✅ Evaluation saved: {eval_id}")
            
            try:
                mongo_operation_with_retry(save_evaluation, max_retries=3, retry_delay=1)
            except Exception as db_error:
                print(f"⚠️ Failed to save evaluation to DB (non-critical): {db_error}")
                # Continue even if DB save fails - evaluation is still returned
        
        return jsonify({"status": "success", "eval_id": eval_id, "evaluation": evaluation_doc}), 200
    
    except Exception as e:
        error_msg = str(e)
        import traceback
        traceback.print_exc()  # Print full traceback for debugging
        print(f"❌ Error in evaluate_student: {error_msg}")
        
        # Provide more helpful error messages
        if "timeout" in error_msg.lower() or "connection" in error_msg.lower():
            return jsonify({
                "error": "Evaluation service timeout. Please try again in a moment.",
                "details": "The AI evaluation service is taking too long to respond."
            }), 500
        elif "openai" in error_msg.lower() or "api" in error_msg.lower():
            return jsonify({
                "error": "AI service unavailable. Using fallback evaluation.",
                "details": "The AI evaluation service is temporarily unavailable."
            }), 500
        else:
            return jsonify({
                "error": f"Evaluation failed: {error_msg}",
                "details": "Please check your answers and try again."
            }), 500

# ---------------------------
# 6. TEACHER ASSISTANT ROUTES
# ---------------------------

@app.route("/api/generate_paper", methods=['POST'])
def generate_paper():
    """Generate question paper for teachers"""
    try:
        data = request.get_json()
        subject = data.get("subject", "")
        exam_type = data.get("exam_type", "")
        num_questions = int(data.get("num_questions", 5))
        marks_distribution = data.get("marks_distribution", [2, 5])
        difficulty = data.get("difficulty", "Medium")
        
        print(f"📩 Generating paper for: {subject} ({exam_type})")
        
        prompt = f"""
        You are an experienced exam setter.
        Generate {num_questions} unique, plagiarism-free questions for the subject "{subject}".
        The exam type is "{exam_type}" with difficulty level "{difficulty}".
        Use marks distribution {marks_distribution}.
        
        - Ensure **no duplicate or repeated questions**.
        - Each question should be original and rephrased naturally.
        - Include a mix of 'Short' and 'Long' questions.
        - Return only valid JSON output in the format below:
        
        {{
          "title": "{subject} - {exam_type}",
          "questions": [
            {{"question": "Explain the concept of data normalization.", "marks": 2, "type": "Short", "answer": "Data normalization is..."}},
            {{"question": "Describe how 3NF eliminates transitive dependencies.", "marks": 5, "type": "Long", "answer": "Third Normal Form..."}}
          ]
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a precise educational AI that writes original and plagiarism-free exam questions."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6
        )
        
        raw_output = response.choices[0].message.content
        paper = clean_json(raw_output)
        
        # Remove duplicates
        seen = set()
        unique_questions = []
        for q in paper.get("questions", []):
            text = q.get("question", "").strip().lower()
            if text not in seen:
                seen.add(text)
                unique_questions.append(q)
        paper["questions"] = unique_questions
        
        # Calculate total marks
        total_marks = sum([q.get("marks", 0) for q in paper.get("questions", [])])
        paper["total_marks"] = total_marks
        
        paper_id = str(uuid.uuid4())
        paper["_id"] = paper_id
        paper["created_at"] = datetime.now().isoformat()
        
        if papers_collection is not None:
            papers_collection.insert_one(paper)
            print(f"✅ Saved paper in MongoDB with ID: {paper_id}")
        
        return jsonify({"status": "success", "paper_id": paper_id, "paper": paper}), 200
    
    except Exception as e:
        print("❌ Error in /generate_paper:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/api/list_papers", methods=["GET"])
def list_papers():
    """List all generated papers"""
    try:
        if papers_collection is not None:
            papers = list(papers_collection.find({}, {"_id": 1, "title": 1, "total_marks": 1, "questions": 1, "created_at": 1}).sort("_id", -1).limit(50))
            # Add question count and format date to each paper
            for paper in papers:
                paper["question_count"] = len(paper.get("questions", []))
                # Convert ObjectId to string for JSON serialization
                if "_id" in paper:
                    paper["_id"] = str(paper["_id"])
        else:
            papers = []
        return jsonify({"papers": papers}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/get_paper/<paper_id>", methods=["GET"])
def get_paper(paper_id):
    """Get a specific paper by ID"""
    try:
        if papers_collection is not None:
            # Try to find by string ID first, then by ObjectId
            paper = papers_collection.find_one({"_id": paper_id}, {"_id": 0})
            if not paper:
                # Try with ObjectId conversion
                from bson import ObjectId
                try:
                    paper = papers_collection.find_one({"_id": ObjectId(paper_id)}, {"_id": 0})
                except:
                    paper = None
        else:
            paper = None
        
        if not paper:
            return jsonify({"error": "Paper not found"}), 404
        
        return jsonify({"paper": paper}), 200
    except Exception as e:
        print(f"❌ Error getting paper: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/download_paper/<paper_id>", methods=["GET"])
def download_paper(paper_id):
    """Download a question paper as PDF"""
    try:
        if papers_collection is not None:
            # Try to find by string ID first, then by ObjectId
            paper = papers_collection.find_one({"_id": paper_id}, {"_id": 0})
            if not paper:
                # Try with ObjectId conversion
                from bson import ObjectId
                try:
                    paper = papers_collection.find_one({"_id": ObjectId(paper_id)}, {"_id": 0})
                except:
                    paper = None
        else:
            paper = None
        
        if not paper:
            return jsonify({"error": "Paper not found"}), 404
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = []
        
        # Header
        title = paper.get("title", "Question Paper")
        elements.append(Paragraph(f"<b>{title}</b>", styles["Title"]))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles["Normal"]))
        elements.append(Paragraph(f"Total Marks: {paper.get('total_marks', 0)}", styles["Normal"]))
        elements.append(Spacer(1, 20))
        
        # Questions
        questions = paper.get("questions", [])
        for idx, q in enumerate(questions, 1):
            question_text = q.get("question", "")
            marks = q.get("marks", 0)
            qtype = q.get("type", "Short")
            
            elements.append(Paragraph(f"<b>Q{idx}.</b> {question_text}", styles["Normal"]))
            elements.append(Paragraph(f"<i>Type:</i> {qtype} | <i>Marks:</i> {marks}", styles["Normal"]))
            
            # Add options if MCQ
            if q.get("options") and isinstance(q.get("options"), list):
                for opt_idx, option in enumerate(q.get("options"), 1):
                    elements.append(Paragraph(f"   {chr(96 + opt_idx)}) {option}", styles["Normal"]))
            
            elements.append(Spacer(1, 12))
        
        # Footer
        elements.append(Spacer(1, 20))
        elements.append(Paragraph(f"<b>Total Marks:</b> {paper.get('total_marks', 0)}", styles["Normal"]))
        
        doc.build(elements)
        buffer.seek(0)
        
        # Return PDF
        filename = f"{title.replace(' ', '_')}.pdf"
        return Response(
            buffer.getvalue(),
            mimetype='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        print(f"❌ Error generating paper PDF: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ---------------------------
# 7. INTERVIEW BOT ROUTES
# ---------------------------

@app.route("/api/interview/start", methods=["POST"])
def start_interview():
    """Start a new interview session"""
    try:
        data = request.get_json(force=True)
        subject = data.get("subject", "General")
        difficulty = data.get("difficulty", "Medium")
        
        sid = str(uuid.uuid4())
        INTERVIEW_SESSIONS[sid] = {
            "subject": subject,
            "difficulty": difficulty,
            "last_question": None,
            "history": [],
            "created_at": datetime.now().isoformat()
        }
        
        prompt = f"""
        You are an experienced interviewer for the subject "{subject}".
        Generate one clear interview question appropriate for a {difficulty} level (Short/Medium/Hard).
        Return only the question text (no JSON wrappers).
        """
        
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You generate concise interview questions."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        q_text = resp.choices[0].message.content.strip()
        INTERVIEW_SESSIONS[sid]["last_question"] = q_text
        
        return jsonify({"session_id": sid, "question": q_text}), 200
    
    except Exception as e:
        print("Error in start_interview:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/api/interview/submit", methods=["POST"])
def submit_interview():
    """Submit answer to interview question"""
    try:
        if request.is_json:
            data = request.get_json(force=True)
            session_id = data.get("session_id")
            student_text = data.get("student_answer", "")
        else:
            session_id = request.form.get("session_id")
            student_text = ""
            if "file" in request.files:
                audio = request.files["file"]
                tmp_path = f"/tmp/{uuid.uuid4().hex}_{audio.filename}"
                audio.save(tmp_path)
                try:
                    student_text = transcribe_audio(tmp_path)
                finally:
                    try:
                        os.remove(tmp_path)
                    except:
                        pass
        
        if not session_id or session_id not in INTERVIEW_SESSIONS:
            return jsonify({"error": "Invalid or missing session_id"}), 400
        
        if not student_text:
            return jsonify({"error": "No text answer provided or transcription failed."}), 400
        
        session = INTERVIEW_SESSIONS[session_id]
        last_q = session.get("last_question", "")
        
        prompt = f"""
        You are an expert interviewer and evaluator in the relevant subject.
        The candidate answered the question: "{last_q}" with:
        \"\"\"{student_text}\"\"\"
        
        Give:
        1) A short feedback (1-2 sentences) pointing strengths and missing points.
        2) A suggested score between 0 and 1 (float), where 1 is perfect.
        3) A single follow-up question to probe deeper on the missing concept (or next question).
        
        Respond in strict JSON:
        {{ "feedback": "text", "score": 0.0, "next_question": "text" }}
        Keep feedback concise.
        """
        
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert instructor and evaluator."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )
        raw = resp.choices[0].message.content.strip()
        
        cleaned = raw
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        try:
            parsed = json.loads(cleaned)
            feedback = parsed.get("feedback", "")
            score = float(parsed.get("score", 0.0))
            next_q = parsed.get("next_question", "")
        except Exception:
            feedback = raw
            score = 0.0
            next_q = ""
        
        if not next_q:
            next_q = f"Can you elaborate on one key aspect of: {last_q}?"
        
        entry = {
            "question": last_q,
            "student_answer": student_text,
            "feedback": feedback,
            "score": score,
            "timestamp": datetime.now().isoformat()
        }
        session["history"].append(entry)
        session["last_question"] = next_q
        
        return jsonify({
            "feedback": feedback,
            "score": score,
            "next_question": next_q,
            "transcript": student_text
        }), 200
    
    except Exception as e:
        print("Error in submit_interview:", e)
        return jsonify({"error": str(e)}), 500

# ---------------------------
# 8. ANALYTICS & PROGRESS TRACKER ROUTES
# ---------------------------

@app.route("/api/save_progress", methods=["POST"])
def save_progress():
    """Save student progress - non-blocking, returns quickly"""
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Prepare data
        student_id = data.get("student_id") or data.get("studentId")
        if not student_id:
            return jsonify({"error": "student_id is required"}), 400
        
        progress_data = {
            "student_id": student_id,
            "mock_test_id": data.get("mock_test_id") or data.get("mockTestId") or "assignment",
            "percentage": data.get("percentage", 0),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "date": datetime.now().strftime("%Y-%m-%d")
        }
        
        # Add optional fields
        if "topic" in data:
            progress_data["topic"] = data["topic"]
        if "type" in data:
            progress_data["type"] = data["type"]
        if "exam_type" in data:
            progress_data["exam_type"] = data["exam_type"]
        if "difficulty" in data:
            progress_data["difficulty"] = data["difficulty"]
        if "paper_title" in data:
            progress_data["paper_title"] = data["paper_title"]
        if "assignment_id" in data:
            progress_data["assignment_id"] = data["assignment_id"]
        if "paper_id" in data:
            progress_data["paper_id"] = data["paper_id"]
        
        # Calculate bonus points (10 points per correct answer)
        bonus_points = 0
        evaluation = data.get("evaluation", [])
        if isinstance(evaluation, list):
            for item in evaluation:
                if isinstance(item, dict):
                    if item.get("is_correct", False):
                        bonus_points += 10
                    elif item.get("score_awarded", 0) > 0 or item.get("score", 0) >= 1:
                        bonus_points += 10
        elif isinstance(evaluation, dict):
            # Handle evaluation object with question_results
            question_results = evaluation.get("question_results") or evaluation.get("details", [])
            if isinstance(question_results, list):
                for item in question_results:
                    if isinstance(item, dict) and (item.get("is_correct", False) or item.get("score_awarded", 0) > 0):
                        bonus_points += 10
        
        progress_data["bonus_points"] = bonus_points
        progress_data["evaluation"] = evaluation  # Store full evaluation
        
        # Save to DB (non-blocking - return immediately, don't wait for confirmation)
        # Return success immediately, save happens in background
        if progress_collection is not None:
            try:
                # Insert - catch errors but don't block
                progress_collection.insert_one(progress_data)
                print(f"✅ Progress saved for student {student_id} with {bonus_points} bonus points")
            except Exception as db_error:
                # Silently fail - progress is non-critical, don't block response
                print(f"⚠️ Failed to save progress (non-critical): {db_error}")
        else:
            print(f"⚠️ Progress collection not available, skipping save")
        
        # Return immediately - don't wait for DB confirmation
        return jsonify({"message": "Progress saved successfully", "bonus_points": bonus_points}), 200
    except Exception as e:
        print(f"❌ Error saving progress: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/get_progress/<student_id>", methods=["GET"])
def get_progress(student_id):
    """Get student progress with comprehensive analytics"""
    try:
        if progress_collection is not None:
            records = list(progress_collection.find({"student_id": student_id}, {"_id": 0}).sort("timestamp", -1))
        else:
            records = []
        
        if not records:
            return jsonify({
                "student_id": student_id,
                "total_tests": 0,
                "total_points": 0,
                "bonus_points": 0,
                "study_streak": 0,
                "topics_completed": 0,
                "analytics": {
                    "average_score": 0,
                    "trend": "Needs Improvement",
                    "weak_topics": [],
                    "study_streak": 0
                },
                "records": [],
                "recent_activities": [],
                "topics": []
            }), 200
        
        # Calculate statistics
        scores = [d.get("percentage", 0) for d in records]
        avg_score = np.mean(scores) if scores else 0
        trend = "Improving" if len(scores) > 1 and scores[-1] > np.mean(scores[:-1]) else "Needs Improvement"
        
        # Calculate total points and bonus points
        total_points = sum([d.get("bonus_points", 0) for d in records])
        total_bonus = total_points
        
        # Calculate study streak (consecutive days with activity)
        dates = sorted(set([d.get("date", d.get("timestamp", "").split()[0]) for d in records if d.get("date") or d.get("timestamp")]))
        study_streak = 0
        if dates:
            from datetime import datetime, timedelta
            today = datetime.now().date()
            streak_date = today
            for date_str in reversed(dates):
                try:
                    record_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                    if record_date == streak_date or record_date == streak_date - timedelta(days=1):
                        if record_date == streak_date - timedelta(days=1):
                            study_streak += 1
                            streak_date = record_date
                        elif record_date == today:
                            study_streak = 1
                            streak_date = record_date
                    else:
                        break
                except:
                    pass
        
        # Extract topics and weak topics
        topics_completed = set()
        weak_topics = []
        all_topics = []
        topic_performance = {}  # Track topic performance
        
        for record in records:
            # Prefer paper_title, then topic, then mock_test_id
            topic = record.get("paper_title") or record.get("topic") or record.get("mock_test_id", "Unknown")
            if topic and topic != "Unknown":
                topics_completed.add(topic)
                all_topics.append({
                    "name": topic,
                    "percentage": record.get("percentage", 0),
                    "timestamp": record.get("timestamp", ""),
                    "completed": True
                })
            
            # Analyze evaluation for weak topics
            evaluation = record.get("evaluation", [])
            if isinstance(evaluation, list):
                record_topic = topic if topic and topic != "Unknown" else "General"
                weak_questions_in_topic = 0
                total_questions_in_topic = 0
                
                for q in evaluation:
                    if isinstance(q, dict):
                        total_questions_in_topic += 1
                        # Check if question is weak (score < 50% of marks OR is_correct is False)
                        is_weak = False
                        if q.get("is_correct") is False:
                            is_weak = True
                        elif q.get("score", 0) < (q.get("marks", 1) * 0.5):
                            is_weak = True
                        
                        if is_weak:
                            weak_questions_in_topic += 1
                
                # If more than 50% of questions in a topic are weak, mark topic as weak
                if total_questions_in_topic > 0:
                    if record_topic not in topic_performance:
                        topic_performance[record_topic] = {"weak": 0, "total": 0}
                    topic_performance[record_topic]["weak"] += weak_questions_in_topic
                    topic_performance[record_topic]["total"] += total_questions_in_topic
        
        # Identify weak topics (topics where >50% of questions are weak)
        for topic_name, perf in topic_performance.items():
            if perf["total"] > 0 and (perf["weak"] / perf["total"]) > 0.5:
                weak_topics.append(topic_name)
        
        # Also check overall record performance - if a record has low percentage, mark its topic as weak
        for record in records:
            topic = record.get("topic") or record.get("mock_test_id", "Unknown")
            if topic and topic != "Unknown":
                percentage = record.get("percentage", 0)
                if percentage < 50 and topic not in weak_topics:
                    weak_topics.append(topic)
        
        weak_topics = list(set(weak_topics))
        topics_completed_count = len(topics_completed)
        
        # Recent activities (last 10 records)
        recent_activities = records[:10]
        
        analytics = {
            "average_score": round(avg_score, 2),
            "trend": trend,
            "weak_topics": weak_topics,
            "study_streak": study_streak,
            "topics_completed": topics_completed_count
        }
        
        return jsonify({
            "student_id": student_id,
            "total_tests": len(records),
            "total_points": total_points,
            "bonus_points": total_bonus,
            "study_streak": study_streak,
            "topics_completed": topics_completed_count,
            "analytics": analytics,
            "records": records,
            "recent_activities": recent_activities,
            "topics": all_topics
        }), 200
    
    except Exception as e:
        print(f"❌ Error getting progress: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ---------------------------
# 9. ADAPTIVE LEARNING ROUTES
# ---------------------------

@app.route("/api/adaptive/analyze", methods=['POST'])
def analyze_learning():
    """Analyze learning and provide adaptive recommendations"""
    try:
        data = request.get_json()
        student_name = data.get("student_name", "Unknown Student")
        history = data.get("test_history", [])
        
        if not history:
            return jsonify({"error": "No test history provided."}), 400
        
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
        
        weak_topics = [t for t, d in topic_analysis.items() if d["status"] == "weak"]
        strong_topics = [t for t, d in topic_analysis.items() if d["status"] == "strong"]
        
        next_difficulty = "Easy" if len(weak_topics) > len(strong_topics) else "Medium"
        if all(d["status"] == "strong" for d in topic_analysis.values()):
            next_difficulty = "Hard"
        
        recommended_topics = weak_topics if weak_topics else list(topic_analysis.keys())[:2]
        
        action_plan = []
        for topic in recommended_topics:
            action_plan.append({
                "topic": topic,
                "suggestion": f"Revise {topic} and attempt more {next_difficulty.lower()}-level questions."
            })
        
        recommendations = {
            "recommended_topics": recommended_topics,
            "next_difficulty": next_difficulty,
            "action_plan": action_plan
        }
        
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

# ---------------------------
# 10. RECOMMENDATION ENGINE ROUTES
# ---------------------------

@app.route("/api/recommend/<student_id>", methods=["GET"])
def recommend(student_id):
    """Recommend resources based on weak topics"""
    try:
        if progress_collection is not None:
            records = list(progress_collection.find({"student_id": student_id}, {"_id": 0}))
        else:
            records = []
        
        if not records:
            return jsonify({
                "student_id": student_id,
                "weak_topics": [],
                "recommendations": []
            }), 200
        
        weak_topics = []
        topic_performance = {}  # Track topic performance
        
        for record in records:
            topic = record.get("topic") or record.get("mock_test_id", "Unknown")
            record_topic = topic if topic and topic != "Unknown" else "General"
            
            # Analyze evaluation for weak topics
            evaluation = record.get("evaluation", [])
            if isinstance(evaluation, list):
                weak_questions_in_topic = 0
                total_questions_in_topic = 0
                
                for q in evaluation:
                    if isinstance(q, dict):
                        total_questions_in_topic += 1
                        # Check if question is weak (score < 50% of marks OR is_correct is False)
                        is_weak = False
                        if q.get("is_correct") is False:
                            is_weak = True
                        elif q.get("score", 0) < (q.get("marks", 1) * 0.5):
                            is_weak = True
                        
                        if is_weak:
                            weak_questions_in_topic += 1
                
                # Track topic performance
                if total_questions_in_topic > 0:
                    if record_topic not in topic_performance:
                        topic_performance[record_topic] = {"weak": 0, "total": 0}
                    topic_performance[record_topic]["weak"] += weak_questions_in_topic
                    topic_performance[record_topic]["total"] += total_questions_in_topic
            
            # Also check overall record performance
            percentage = record.get("percentage", 0)
            if percentage < 50 and record_topic not in weak_topics:
                weak_topics.append(record_topic)
        
        # Identify weak topics (topics where >50% of questions are weak)
        for topic_name, perf in topic_performance.items():
            if perf["total"] > 0 and (perf["weak"] / perf["total"]) > 0.5:
                if topic_name not in weak_topics:
                    weak_topics.append(topic_name)
        
        weak_topics = list(set(weak_topics))
        
        recommendations = []
        for topic in weak_topics:
            if topic in RESOURCE_MAP:
                recommendations.extend(RESOURCE_MAP[topic])
        
        # If no weak topics, provide general recommendations
        if not recommendations:
            recommendations = [
                {"title": "General Study Guide", "url": "https://www.khanacademy.org/", "type": "General"},
                {"title": "Practice Tests", "url": "https://www.coursera.org/", "type": "Practice"}
            ]
        
        return jsonify({
            "student_id": student_id,
            "weak_topics": weak_topics,
            "recommendations": recommendations
        }), 200
    except Exception as e:
        print(f"❌ Error in recommendations: {e}")
        return jsonify({"error": str(e)}), 500

# ---------------------------
# 11. REPORT GENERATOR ROUTES
# ---------------------------

@app.route("/api/report/<student_id>", methods=["GET"])
def download_report(student_id):
    """Generate and download student report PDF"""
    try:
        if progress_collection is not None:
            records = list(progress_collection.find({"student_id": student_id}, {"_id": 0}).sort("timestamp", -1))
        else:
            records = []
        
        if not records:
            return jsonify({"error": "Student not found or no records available"}), 404
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = []
        
        # Header
        elements.append(Paragraph(f"Student Progress Report", styles["Title"]))
        elements.append(Paragraph(f"Student ID: {student_id}", styles["Normal"]))
        elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles["Normal"]))
        elements.append(Spacer(1, 20))
        
        # Summary statistics
        total_tests = len(records)
        avg_score = sum([r.get("percentage", 0) for r in records]) / total_tests if total_tests > 0 else 0
        total_points = sum([r.get("bonus_points", 0) for r in records])
        
        elements.append(Paragraph(f"<b>Summary</b>", styles["Heading2"]))
        elements.append(Paragraph(f"Total Tests: {total_tests}", styles["Normal"]))
        elements.append(Paragraph(f"Average Score: {avg_score:.2f}%", styles["Normal"]))
        elements.append(Paragraph(f"Total Points: {total_points}", styles["Normal"]))
        elements.append(Spacer(1, 20))
        
        # Test details
        elements.append(Paragraph(f"<b>Test History</b>", styles["Heading2"]))
        elements.append(Spacer(1, 12))
        
        for i, r in enumerate(records, 1):
            test_name = r.get('topic') or r.get('mock_test_id') or f'Test {i}'
            percentage = r.get('percentage', 0)
            timestamp = r.get('timestamp', 'Unknown date')
            test_type = r.get('type', 'Mock Test')
            
            elements.append(Paragraph(f"<b>Test {i}: {test_name}</b>", styles["Heading4"]))
            elements.append(Paragraph(f"Type: {test_type}", styles["Normal"]))
            elements.append(Paragraph(f"Score: {percentage}%", styles["Normal"]))
            elements.append(Paragraph(f"Date: {timestamp}", styles["Normal"]))
            
            # Evaluation details
            evaluation = r.get("evaluation", [])
            if evaluation and isinstance(evaluation, list) and len(evaluation) > 0:
                elements.append(Paragraph(f"<b>Question Results:</b>", styles["Normal"]))
                for q_idx, q in enumerate(evaluation[:10], 1):  # Limit to first 10 questions
                    if isinstance(q, dict):
                        q_id = q.get('id', q_idx)
                        q_type = q.get('type', 'Unknown')
                        score = q.get('score', 0)
                        marks = q.get('marks', 1)
                        is_correct = q.get('is_correct', False)
                        status = "✓" if is_correct else "✗"
                        
                        elements.append(Paragraph(
                            f"  Q{q_id} ({q_type}): {score}/{marks} marks {status}",
                            styles["Normal"]
                        ))
                if len(evaluation) > 10:
                    elements.append(Paragraph(f"  ... and {len(evaluation) - 10} more questions", styles["Normal"]))
            
            if r.get('bonus_points', 0) > 0:
                elements.append(Paragraph(f"Bonus Points: {r.get('bonus_points')}", styles["Normal"]))
            
            elements.append(Spacer(1, 12))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        
        # Return PDF as response
        return Response(
            buffer.getvalue(),
            mimetype='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename="{student_id}_report.pdf"'
            }
        )
    except Exception as e:
        print(f"❌ Error generating PDF report: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ---------------------------
# 12. TEACHER DASHBOARD ROUTES
# ---------------------------

@app.route("/api/teacher/dashboard", methods=["GET", "POST"])
def teacher_dashboard():
    """Get teacher dashboard analytics (optionally filtered by student_ids)"""
    try:
        # Get student_ids from request (POST) or query params (GET)
        student_ids = []
        if request.method == 'POST':
            data = request.get_json() or {}
            student_ids = data.get("student_ids", [])
        else:
            student_ids = request.args.getlist("student_ids") or []
        
        # Build query filter
        query_filter = {}
        if student_ids:
            query_filter["student_id"] = {"$in": student_ids}
        
        if progress_collection is not None:
            records = list(progress_collection.find(query_filter, {"_id": 0}))
        else:
            records = []
        
        # If no records, return empty data
        if not records:
            return jsonify({
                "class_average": 0,
                "weak_topics": [],
                "top_students": [],
                "total_students": 0,
                "total_submissions": 0,
                "recent_submissions": []
            }), 200
        
        from statistics import mean
        
        # Calculate class average safely
        percentages = [r.get("percentage", 0) for r in records if r.get("percentage") is not None]
        class_avg = mean(percentages) if percentages else 0
        
        weak_topic_counts = {}
        student_scores = {}
        student_submissions = {}  # Track all submissions per student
        
        for r in records:
            try:
                sid = r.get("student_id")
                if not sid:  # Skip records without student_id
                    continue
                    
                percentage = r.get("percentage", 0)
                if percentage is None:
                    percentage = 0
                
                # Track student scores (average across all their tests)
                if sid not in student_submissions:
                    student_submissions[sid] = []
                student_submissions[sid].append(percentage)
                
                # Calculate mean safely
                if student_submissions[sid]:
                    student_scores[sid] = mean(student_submissions[sid])
                else:
                    student_scores[sid] = percentage
                
                # Track weak topics - handle evaluation field safely
                evaluation = r.get("evaluation", [])
                if evaluation and isinstance(evaluation, list):
                    for q in evaluation:
                        if not isinstance(q, dict):
                            continue
                        topic = q.get("topic") or q.get("topic_name") or "Unknown"
                        score = q.get("score", 0)
                        if score is None:
                            score = 0
                        
                        if topic not in weak_topic_counts:
                            weak_topic_counts[topic] = {"attempts": 0, "low_scores": 0}
                        weak_topic_counts[topic]["attempts"] += 1
                        if score < 1:
                            weak_topic_counts[topic]["low_scores"] += 1
            except Exception as e:
                print(f"⚠️ Error processing record: {e}")
                continue
        
        # Build weak topics list safely
        weak_topics = []
        for k, v in weak_topic_counts.items():
            if v["attempts"] > 0:
                weakness_rate = v["low_scores"] / v["attempts"]
                weak_topics.append({"topic": k, "weakness_rate": weakness_rate})
        
        weak_topics = sorted(weak_topics, key=lambda x: x["weakness_rate"], reverse=True)[:5]
        
        # Build top students list safely
        top_students = []
        for sid, avg_score in student_scores.items():
            if avg_score is not None:
                top_students.append([str(sid), float(avg_score)])
        
        top_students = sorted(top_students, key=lambda x: x[1], reverse=True)[:5]
        
        # Get recent submissions - handle missing timestamps
        def get_timestamp(r):
            ts = r.get("timestamp", "")
            if not ts:
                return "1970-01-01"  # Default for sorting
            return str(ts)
        
        recent_submissions = sorted(records, key=get_timestamp, reverse=True)[:5]
        # Clean up recent submissions for JSON serialization
        for sub in recent_submissions:
            if "_id" in sub:
                del sub["_id"]
        
        return jsonify({
            "class_average": round(class_avg, 2) if class_avg else 0,
            "weak_topics": weak_topics,
            "top_students": top_students,
            "total_students": len(student_scores),
            "total_submissions": len(records),
            "recent_submissions": recent_submissions
        })
    except Exception as e:
        print(f"❌ Error in teacher dashboard: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/teacher/assistant", methods=["POST"])
def teaching_assistant():
    """AI Teaching Assistant - answers teaching-related questions"""
    try:
        data = request.get_json()
        query = data.get("query", "")
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        prompt = f"""
        You are an experienced educational consultant and teaching assistant.
        A teacher has asked: "{query}"
        
        Provide helpful, practical, and actionable advice. Include:
        - Teaching strategies
        - Activity suggestions
        - Best practices
        - Examples if relevant
        
        Keep the response concise but comprehensive (2-4 paragraphs).
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert educational consultant with years of teaching experience. Provide practical, actionable advice."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        assistant_response = response.choices[0].message.content.strip()
        
        return jsonify({
            "response": assistant_response,
            "query": query
        }), 200
    
    except Exception as e:
        print(f"❌ Error in teaching assistant: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/check_plagiarism", methods=["POST"])
def check_plagiarism():
    """Check for plagiarism in student answers or generated content"""
    try:
        data = request.get_json()
        text = data.get("text", "")
        reference_texts = data.get("reference_texts", [])  # Optional: compare against known sources
        
        if not text:
            return jsonify({"error": "Text is required"}), 400
        
        # Use embeddings to check similarity with reference texts if provided
        similarity_scores = []
        if reference_texts:
            texts_to_compare = [text] + reference_texts
            embeddings = get_embeddings_batch(texts_to_compare)
            
            if embeddings[0]:
                for i, ref_emb in enumerate(embeddings[1:], 1):
                    if ref_emb:
                        sim = cosine_similarity(embeddings[0], ref_emb)
                        similarity_scores.append({
                            "reference_index": i,
                            "similarity": round(sim, 3)
                        })
        
        # Use AI to analyze originality
        prompt = f"""
        Analyze the following text for originality and potential plagiarism indicators.
        Text: "{text[:1000]}"
        
        Provide:
        1. Originality assessment (0-100%)
        2. Potential concerns (if any)
        3. Suggestions for improvement
        
        Respond in JSON format:
        {{
            "originality_score": 0-100,
            "concerns": ["list of concerns if any"],
            "suggestions": "suggestions for improvement"
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an academic integrity expert. Analyze texts for originality."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        analysis_text = response.choices[0].message.content.strip()
        analysis = clean_json(analysis_text)
        
        # Determine plagiarism risk
        originality = analysis.get("originality_score", 100)
        if isinstance(originality, str):
            try:
                originality = float(originality.replace("%", ""))
            except:
                originality = 100
        
        risk_level = "Low"
        if originality < 50:
            risk_level = "High"
        elif originality < 75:
            risk_level = "Medium"
        
        return jsonify({
            "originality_score": round(originality, 1),
            "risk_level": risk_level,
            "similarity_scores": similarity_scores,
            "analysis": analysis,
            "text_length": len(text)
        }), 200
    
    except Exception as e:
        print(f"❌ Error checking plagiarism: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ---------------------------
# 13. TEST ASSIGNMENT & SHARING ROUTES
# ---------------------------

@app.route("/api/assign_test", methods=["POST"])
def assign_test():
    """Assign a test/paper to students"""
    try:
        data = request.get_json()
        paper_id = data.get("paper_id")
        student_ids = data.get("student_ids", [])  # List of student IDs
        due_date = data.get("due_date")  # Optional due date
        teacher_id = data.get("teacher_id", "teacher")
        
        if not paper_id:
            return jsonify({"error": "paper_id is required"}), 400
        
        # Get paper details
        if papers_collection is not None:
            paper = papers_collection.find_one({"_id": paper_id}, {"_id": 0})
        else:
            paper = None
        
        if not paper:
            return jsonify({"error": "Paper not found"}), 404
        
        assignment_id = str(uuid.uuid4())
        assignment = {
            "_id": assignment_id,
            "paper_id": paper_id,
            "paper_title": paper.get("title", "Untitled Paper"),
            "teacher_id": teacher_id,
            "student_ids": student_ids,
            "due_date": due_date,
            "status": "active",
            "created_at": datetime.now().isoformat(),
            "submissions": []
        }
        
        if assignments_collection is not None:
            assignments_collection.insert_one(assignment)
            print(f"✅ Test assigned: {assignment_id} to {len(student_ids)} students")
        
        return jsonify({
            "status": "success",
            "assignment_id": assignment_id,
            "assignment": assignment
        }), 200
    
    except Exception as e:
        print(f"❌ Error assigning test: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/get_assignments", methods=["GET"])
def get_assignments():
    """Get assignments for a teacher or student"""
    try:
        teacher_id = request.args.get("teacher_id")
        student_id = request.args.get("student_id")
        
        if assignments_collection is not None:
            query = {}
            if teacher_id:
                query["teacher_id"] = teacher_id
            elif student_id:
                # Get assignments where student is in student_ids
                query["student_ids"] = {"$in": [student_id]}
            
            assignments = list(assignments_collection.find(
                query,
                {"_id": 1, "paper_id": 1, "paper_title": 1, "student_ids": 1, "due_date": 1, "status": 1, "created_at": 1, "submissions": 1, "teacher_id": 1}
            ).sort("created_at", -1))
            
            # Convert ObjectId to string
            for assignment in assignments:
                assignment["_id"] = str(assignment["_id"])
                assignment["total_students"] = len(assignment.get("student_ids", []))
                assignment["submitted_count"] = len(assignment.get("submissions", []))
        else:
            assignments = []
        
        return jsonify({"assignments": assignments}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/submit_assignment", methods=["POST"])
def submit_assignment():
    """Submit an assignment/test - optimized for speed, returns immediately"""
    try:
        data = request.get_json()
        assignment_id = data.get("assignment_id")
        student_id = data.get("student_id")
        answers = data.get("answers", [])
        evaluation = data.get("evaluation", {})
        percentage = data.get("percentage", 0)
        submitted_at = data.get("submitted_at", datetime.now().isoformat())
        
        if not assignment_id or not student_id:
            return jsonify({"error": "assignment_id and student_id are required"}), 400
        
        if assignments_collection is None:
            return jsonify({"error": "Assignments collection not available"}), 500
        
        # Convert assignment_id to ObjectId if it's a string (try both formats)
        from bson import ObjectId
        original_assignment_id = assignment_id
        try:
            if isinstance(assignment_id, str):
                # Try to convert to ObjectId if it's a valid ObjectId string
                try:
                    assignment_id = ObjectId(assignment_id)
                except:
                    # If conversion fails, it might be a string UUID - use as-is
                    assignment_id = original_assignment_id
        except Exception as e:
            return jsonify({"error": f"Invalid assignment_id format: {str(e)}"}), 400
        
        # Try to find assignment - first with converted ID, then with original string (with retry logic)
        def find_assignment(assignment_id_to_use):
            return assignments_collection.find_one(
                {"_id": assignment_id_to_use},
                {"submissions": 1, "_id": 1, "teacher_id": 1, "paper_title": 1}  # Get teacher_id for WebSocket
            )
        
        try:
            assignment = mongo_operation_with_retry(
                lambda: find_assignment(assignment_id), 
                max_retries=2, 
                retry_delay=1
            )
            db_assignment_id = assignment_id  # Track which ID was used to find the assignment
            
            if not assignment and original_assignment_id != assignment_id:
                # Try with original string ID if ObjectId conversion was attempted
                try:
                    assignment = mongo_operation_with_retry(
                        lambda: find_assignment(original_assignment_id),
                        max_retries=2,
                        retry_delay=1
                    )
                    if assignment:
                        db_assignment_id = original_assignment_id  # Use the ID that worked
                except:
                    pass
        except Exception as e:
            print(f"❌ Failed to find assignment after retries: {e}")
            return jsonify({"error": f"Database connection error: {str(e)}. Please try again."}), 500
        
        if not assignment:
            return jsonify({"error": "Assignment not found"}), 404
        
        teacher_id = assignment.get("teacher_id")
        paper_title = assignment.get("paper_title", "Assignment")
        
        # Prepare submission data (minimize size - don't store full evaluation if large)
        submission = {
            "student_id": str(student_id),
            "answers": answers,
            "evaluation": evaluation,  # Store evaluation for teacher review
            "percentage": float(percentage) if percentage else 0.0,
            "submitted_at": submitted_at
        }
        
        # Check if student already submitted (quick check)
        existing_submission = None
        submissions_list = assignment.get("submissions", [])
        for s in submissions_list:
            if str(s.get("student_id")) == str(student_id):
                existing_submission = s
                break
        
        # Prepare response data
        response_data = {
            "status": "success",
            "message": "Assignment submitted successfully",
            "assignment_id": str(db_assignment_id),  # Return the ID that was used
            "teacher_id": teacher_id,
            "paper_title": paper_title
        }
        
        # Save to DB synchronously (but quickly) - we need to ensure data is saved before WebSocket emit
        # Use the ID that successfully found the assignment
        def save_submission():
            if existing_submission:
                return assignments_collection.update_one(
                    {"_id": db_assignment_id, "submissions.student_id": str(student_id)},
                    {"$set": {"submissions.$": submission}},
                    upsert=False
                )
            else:
                return assignments_collection.update_one(
                    {"_id": db_assignment_id},
                    {"$push": {"submissions": submission}},
                    upsert=False
                )
        
        try:
            result = mongo_operation_with_retry(save_submission, max_retries=3, retry_delay=1)
            
            if result.modified_count > 0 or result.matched_count > 0:
                print(f"✅ Assignment submitted: {assignment_id} by student {student_id}")
            else:
                print(f"⚠️ Assignment submission may not have been saved: {assignment_id}")
        except Exception as db_error:
            print(f"❌ MongoDB error after retries: {db_error}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Failed to save submission after retries: {str(db_error)}. Please try again."}), 500
        
        # Return response after DB save completes (ensures data is persisted before WebSocket)
        return jsonify(response_data), 200
    
    except Exception as e:
        print(f"❌ Error submitting assignment: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/update_submission_evaluation", methods=["POST"])
def update_submission_evaluation():
    """Update teacher evaluation/feedback for a submission"""
    try:
        data = request.get_json()
        assignment_id = data.get("assignment_id")
        student_id = data.get("student_id")
        teacher_feedback = data.get("teacher_feedback", "")
        updated_percentage = data.get("updated_percentage")
        updated_evaluation = data.get("updated_evaluation")
        
        if not assignment_id or not student_id:
            return jsonify({"error": "assignment_id and student_id are required"}), 400
        
        if assignments_collection is None:
            return jsonify({"error": "Assignments collection not available"}), 500
        
        # Convert assignment_id to ObjectId if it's a string
        from bson import ObjectId
        original_assignment_id = assignment_id
        try:
            if isinstance(assignment_id, str):
                try:
                    assignment_id = ObjectId(assignment_id)
                except:
                    assignment_id = original_assignment_id
        except Exception as e:
            return jsonify({"error": f"Invalid assignment_id format: {str(e)}"}), 400
        
        # Find assignment
        assignment = assignments_collection.find_one({"_id": assignment_id})
        if not assignment and original_assignment_id != assignment_id:
            assignment = assignments_collection.find_one({"_id": original_assignment_id})
        
        if not assignment:
            return jsonify({"error": "Assignment not found"}), 404
        
        # Find and update the submission
        submissions = assignment.get("submissions", [])
        submission_found = False
        updated_submission = None
        
        for sub in submissions:
            if str(sub.get("student_id")) == str(student_id):
                # Update submission with teacher feedback and evaluation
                if teacher_feedback:
                    sub["teacher_feedback"] = teacher_feedback
                if updated_percentage is not None:
                    sub["percentage"] = updated_percentage
                if updated_evaluation:
                    sub["evaluation"] = updated_evaluation
                sub["teacher_evaluated_at"] = datetime.now().isoformat()
                updated_submission = sub
                submission_found = True
                break
        
        if not submission_found:
            return jsonify({"error": "Submission not found"}), 404
        
        # Update assignment in database
        assignments_collection.update_one(
            {"_id": assignment_id},
            {"$set": {"submissions": submissions}}
        )
        
        return jsonify({
            "success": True,
            "message": "Evaluation updated successfully",
            "submission": {
                "student_id": student_id,
                "percentage": updated_submission.get("percentage"),
                "teacher_feedback": updated_submission.get("teacher_feedback", "")
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error updating submission evaluation: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/get_assignment_submissions/<assignment_id>", methods=["GET"])
def get_assignment_submissions(assignment_id):
    """Get all submissions for a specific assignment"""
    try:
        if assignments_collection is None:
            return jsonify({"error": "Assignments collection not available"}), 500
        
        # Convert assignment_id to ObjectId if it's a string (try both formats)
        from bson import ObjectId
        original_assignment_id = assignment_id
        try:
            if isinstance(assignment_id, str):
                # Try to convert to ObjectId if it's a valid ObjectId string
                try:
                    assignment_id = ObjectId(assignment_id)
                except:
                    # If conversion fails, it might be a string UUID - use as-is
                    assignment_id = original_assignment_id
        except Exception as e:
            return jsonify({"error": f"Invalid assignment_id format: {str(e)}"}), 400
        
        # Try to find assignment - first with converted ID, then with original string
        assignment = assignments_collection.find_one({"_id": assignment_id})
        if not assignment and original_assignment_id != assignment_id:
            # Try with original string ID if ObjectId conversion was attempted
            assignment = assignments_collection.find_one({"_id": original_assignment_id})
        
        if not assignment:
            return jsonify({"error": "Assignment not found"}), 404
        
        submissions = assignment.get("submissions", [])
        
        # Submissions already contain evaluation data from submit_assignment
        # Just format them nicely
        detailed_submissions = []
        for sub in submissions:
            # Extract evaluation details if available
            evaluation = sub.get("evaluation", {})
            if not isinstance(evaluation, dict):
                evaluation = {}
            
            # Handle both "details" and "question_results" formats
            question_results = evaluation.get("question_results") or evaluation.get("details", [])
            if not isinstance(question_results, list):
                question_results = []
            
            # Calculate correct count - check for is_correct or score_awarded > 0
            correct_count = 0
            for q in question_results:
                if q.get("is_correct") or (q.get("score_awarded", 0) > 0 and q.get("marks", 0) > 0):
                    # Consider correct if explicitly marked or if got partial/full marks
                    if q.get("is_correct") or (q.get("score_awarded", 0) >= q.get("marks", 0) * 0.5):
                        correct_count += 1
            
            detailed_submissions.append({
                "student_id": sub.get("student_id"),
                "percentage": sub.get("percentage", 0),
                "submitted_at": sub.get("submitted_at"),
                "answers": sub.get("answers", []),
                "evaluation": evaluation,
                "question_results": question_results,
                "correct_count": correct_count,
                "total_questions": len(question_results) if question_results else 0
            })
        
        return jsonify({
            "assignment_id": assignment_id,
            "paper_title": assignment.get("paper_title", "Unknown"),
            "submissions": detailed_submissions,
            "total_assigned": len(assignment.get("student_ids", [])),
            "total_submitted": len(submissions)
        }), 200
    
    except Exception as e:
        print(f"❌ Error getting submissions: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/share_paper/<paper_id>", methods=["POST"])
def share_paper(paper_id):
    """Create a shareable link for a paper"""
    try:
        if papers_collection is not None:
            paper = papers_collection.find_one({"_id": paper_id}, {"_id": 0})
        else:
            paper = None
        
        if not paper:
            return jsonify({"error": "Paper not found"}), 404
        
        # Create a share token
        share_token = str(uuid.uuid4())
        
        # Store shareable paper (could use a separate collection, but for now we'll return the token)
        shareable_link = f"/student/test/{share_token}"
        
        return jsonify({
            "share_token": share_token,
            "shareable_link": shareable_link,
            "paper_id": paper_id,
            "paper_title": paper.get("title", "Untitled Paper")
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/get_student_analytics", methods=["GET", "POST"])
def get_student_analytics():
    """Get detailed analytics for students (optionally filtered by student_ids)"""
    try:
        # Get student_ids from request (POST) or query params (GET)
        student_ids = []
        if request.method == 'POST':
            data = request.get_json() or {}
            student_ids = data.get("student_ids", [])
        else:
            student_ids = request.args.getlist("student_ids") or []
        
        # Build query filter
        query_filter = {}
        if student_ids:
            query_filter["student_id"] = {"$in": student_ids}
        
        if progress_collection is not None:
            records = list(progress_collection.find(query_filter, {"_id": 0}))
        else:
            records = []
        
        # Group by student
        student_data = {}
        for record in records:
            student_id = record.get("student_id")
            # Only include if in student_ids list (if provided)
            if student_ids and student_id not in student_ids:
                continue
            if student_id not in student_data:
                student_data[student_id] = {
                    "student_id": student_id,
                    "tests_taken": 0,
                    "total_score": 0,
                    "average_score": 0,
                    "submissions": []
                }
            
            student_data[student_id]["tests_taken"] += 1
            student_data[student_id]["total_score"] += record.get("percentage", 0)
            student_data[student_id]["submissions"].append({
                "topic": record.get("topic", "Unknown"),
                "percentage": record.get("percentage", 0),
                "timestamp": record.get("timestamp", ""),
                "type": record.get("type", "test")
            })
        
        # Calculate averages
        for student_id, data in student_data.items():
            if data["tests_taken"] > 0:
                data["average_score"] = round(data["total_score"] / data["tests_taken"], 2)
        
        # Sort by average score
        students_list = sorted(
            list(student_data.values()),
            key=lambda x: x["average_score"],
            reverse=True
        )
        
        return jsonify({
            "students": students_list,
            "total_students": len(students_list),
            "total_tests": len(records)
        }), 200
    
    except Exception as e:
        print(f"❌ Error getting student analytics: {e}")
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Health Check
# ---------------------------

@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Unified EdTech AI Service",
        "models": [
            "syllabus_parser",
            "question_generator",
            "answer_generator",
            "mock_test_evaluator",
            "smart_evaluator",
            "teacher_assistant",
            "interview_bot",
            "analytics",
            "adaptive_learning",
            "recommendation_engine",
            "report_generator",
            "teacher_dashboard"
        ]
    }), 200

# ---------------------------
# Run Server
# ---------------------------

if __name__ == "__main__":
    import sys
    port = int(os.getenv("PYTHON_SERVICE_PORT", 5001))
    
    print("🚀 Starting Unified EdTech AI Service...")
    print("✅ All models integrated and ready!")
    print(f"📡 Service running on http://localhost:{port}")
    print("📚 API Documentation:")
    print("   - POST /api/parse_syllabus - Parse syllabus from PDF/text/voice")
    print("   - POST /api/generate_questions - Generate questions")
    print("   - POST /api/generate_answer - Generate answers")
    print("   - POST /api/evaluate_mock - Evaluate mock tests")
    print("   - POST /api/evaluate_student - Smart evaluation")
    print("   - POST /api/generate_paper - Generate question papers")
    print("   - POST /api/interview/start - Start interview")
    print("   - POST /api/interview/submit - Submit interview answer")
    print("   - POST /api/save_progress - Save progress")
    print("   - GET /api/get_progress/<student_id> - Get progress")
    print("   - POST /api/adaptive/analyze - Adaptive learning")
    print("   - GET /api/recommend/<student_id> - Get recommendations")
    print("   - GET /api/report/<student_id> - Download report")
    print("   - GET /api/teacher/dashboard - Teacher dashboard")
    print("   - GET /api/health - Health check")
    app.run(host="0.0.0.0", port=port, debug=True)

