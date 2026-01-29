import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Label } from '../../../shared/components/ui/label';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Badge } from '../../../shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { RadioGroup, RadioGroupItem } from '../../../shared/components/ui/radio-group';
import { Separator } from '../../../shared/components/ui/separator';
import { Brain, Upload, Mic, MicOff, FileText, Download, Wand2, CheckCircle, AlertCircle, Copy, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api';

export function QuestionGenerator() {
  const [inputMethod, setInputMethod] = useState('text');
  const [topic, setTopic] = useState('');
  const [examType, setExamType] = useState('University Exam');
  const [questionType, setQuestionType] = useState('mixed');
  const [difficulty, setDifficulty] = useState('medium');
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [parsedSyllabus, setParsedSyllabus] = useState(null);
  const fileInputRef = useRef(null);
  const voiceInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      toast.success(`File selected: ${file.name}`);
    }
  };

  const startRecording = async () => {
    try {
      // Prevent multiple recording attempts
      if (isRecording) {
        toast.warning('Recording is already in progress');
        return;
      }

      // Clean up any existing recording first
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn('Error stopping existing recorder:', e);
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Check if MediaRecorder is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Your browser does not support audio recording');
        return;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;
      
      // Determine best mime type
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Use default
          }
        }
      }
      
      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        toast.error('Recording error occurred');
        // Force cleanup
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        mediaRecorderRef.current = null;
      };
      
      mediaRecorder.onstop = () => {
        setIsRecording(false);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        if (chunks.length === 0) {
          toast.error('No audio data recorded');
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          return;
        }
        
        const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Determine file extension based on mime type
        let extension = 'webm';
        if (mimeType.includes('mp4')) extension = 'm4a';
        else if (mimeType.includes('ogg')) extension = 'ogg';
        
        // Convert to File for upload
        const audioFile = new File([blob], `recording.${extension}`, { 
          type: blob.type || 'audio/webm' 
        });
        setSelectedFile(audioFile);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        toast.success('Recording saved successfully');
      };
      
      // Start recording with timeslice for better data collection
      try {
        mediaRecorder.start(1000); // Collect data every second
        setIsRecording(true);
        setRecordingTime(0);
        
        // Start timer
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => {
            // Safety check: stop after 10 minutes
            if (prev >= 600) {
              stopRecording();
              toast.warning('Recording stopped after 10 minutes');
              return prev;
            }
            return prev + 1;
          });
        }, 1000);
        
        toast.success('Recording started - speak now!');
      } catch (startError) {
        console.error('Error starting MediaRecorder:', startError);
        toast.error('Failed to start recording. Please try again.');
        // Cleanup on start failure
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        mediaRecorderRef.current = null;
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsRecording(false);
      let errorMessage = 'Could not access microphone. ';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow microphone access in your browser settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No microphone found.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Microphone is being used by another application.';
      } else {
        errorMessage += error.message || 'Please check permissions.';
      }
      toast.error(errorMessage);
      
      // Cleanup on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const stopRecording = () => {
    try {
      setIsRecording(false);
      
      // Stop timer first
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Stop MediaRecorder if it exists
      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          } else if (mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            mediaRecorderRef.current.stop();
          }
        } catch (e) {
          console.warn('Error stopping MediaRecorder:', e);
        }
      }
      
      // Stop media stream
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
          });
          streamRef.current = null;
        } catch (e) {
          console.warn('Error stopping stream:', e);
        }
      }
      
      toast.success('Recording stopped');
    } catch (error) {
      console.error('Error in stopRecording:', error);
      // Force cleanup even if there's an error
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      mediaRecorderRef.current = null;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setSelectedFile(null);
    setRecordingTime(0);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop recording if active
      if (isRecording) {
        setIsRecording(false);
        if (mediaRecorderRef.current) {
          try {
            if (mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
            }
          } catch (e) {
            console.warn('Error stopping recorder on unmount:', e);
          }
        }
      }
      // Stop media stream
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach(track => track.stop());
        } catch (e) {
          console.warn('Error stopping stream on unmount:', e);
        }
        streamRef.current = null;
      }
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Revoke audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []); // Only run on unmount

  // Stop recording when switching input methods
  useEffect(() => {
    if (inputMethod !== 'voice' && isRecording) {
      stopRecording();
    }
    // Clear recording when switching away from voice
    if (inputMethod !== 'voice') {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setAudioBlob(null);
      setSelectedFile(null);
      setRecordingTime(0);
    }
  }, [inputMethod]);

  // Add keyboard shortcut to stop recording (Escape key)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isRecording) {
        e.preventDefault();
        stopRecording();
        toast.info('Recording stopped via keyboard shortcut');
      }
    };

    if (isRecording) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isRecording]);

  const handleParseSyllabus = async () => {
    if (inputMethod === 'text' && !topic.trim()) {
      toast.error('Please enter topic or syllabus content');
      return;
    }
    if (inputMethod === 'upload' && !selectedFile) {
      toast.error('Please select a file');
      return;
    }
    if (inputMethod === 'voice' && !selectedFile && !audioBlob) {
      toast.error('Please record audio or select a file');
      return;
    }

    setIsGenerating(true);
    try {
      let result;
      if (inputMethod === 'upload') {
        result = await api.parseSyllabus(selectedFile);
      } else if (inputMethod === 'voice') {
        // Use recorded audio or uploaded file
        let fileToSend = selectedFile;
        if (!fileToSend && audioBlob) {
          // Determine proper file extension based on blob type
          let extension = 'webm';
          let mimeType = audioBlob.type || 'audio/webm';
          if (mimeType.includes('mp4') || mimeType.includes('m4a')) {
            extension = 'm4a';
          } else if (mimeType.includes('ogg')) {
            extension = 'ogg';
          } else if (mimeType.includes('wav')) {
            extension = 'wav';
          } else if (mimeType.includes('mp3')) {
            extension = 'mp3';
          }
          fileToSend = new File([audioBlob], `recording.${extension}`, { type: mimeType });
        }
        
        if (fileToSend) {
          console.log('Sending audio file for transcription:', fileToSend.name, fileToSend.type, fileToSend.size);
          result = await api.parseSyllabus(fileToSend);
        } else {
          throw new Error('No audio file available');
        }
      } else {
        result = await api.parseSyllabus(topic);
      }
      
      setParsedSyllabus(result);
      
      // Extract topic from parsed result - handle different response formats
      let extractedTopic = topic;
      if (result.topics && result.topics.main_topics && result.topics.main_topics.length > 0) {
        extractedTopic = result.topics.main_topics[0];
      } else if (result.full_text) {
        // Use full transcription text as topic (first 200 chars)
        extractedTopic = result.full_text.substring(0, 200).trim();
      } else if (result.raw_text_preview) {
        extractedTopic = result.raw_text_preview.substring(0, 200).trim();
      } else if (result.text) {
        // If transcription text is available, use first 200 chars as topic
        extractedTopic = result.text.substring(0, 200).trim();
      } else if (result.transcription) {
        extractedTopic = result.transcription.substring(0, 200).trim();
      } else if (result.content) {
        extractedTopic = result.content.substring(0, 200).trim();
      }
      
      if (extractedTopic && extractedTopic !== topic) {
        setTopic(extractedTopic);
      }
      
      // Check if we actually got text
      if (!extractedTopic || !extractedTopic.trim()) {
        throw new Error('No text could be extracted from the audio. Please try recording again with clearer audio.');
      }
      
      toast.success('Syllabus parsed successfully!');
      
      // Auto-generate questions after successful voice/upload parsing
      if ((inputMethod === 'voice' || inputMethod === 'upload') && extractedTopic) {
        // Small delay to show success message
        setTimeout(() => {
          handleGenerateQuestions(extractedTopic);
        }, 500);
      }
    } catch (error) {
      console.error('Parse syllabus error:', error);
      const errorMessage = error.message || error.error || 'Failed to parse syllabus';
      
      // Provide helpful error messages
      if (errorMessage.includes('Whisper') || errorMessage.includes('transcription')) {
        toast.error('Audio transcription failed. Please ensure the audio is clear and try again, or use text input instead.');
      } else if (errorMessage.includes('No text could be extracted')) {
        toast.error('Could not extract text from audio. The recording might be too short, silent, or unclear. Please try recording again.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateQuestions = async (topicToUse = null) => {
    const finalTopic = topicToUse || topic;
    
    if (!finalTopic || !finalTopic.trim()) {
      toast.error('Please enter a topic or upload syllabus content');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await api.generateQuestions(
        finalTopic.trim(),
        examType,
        difficulty,
        questionType,
        numberOfQuestions
      );

      if (result.questions && Array.isArray(result.questions)) {
        setGeneratedQuestions(result.questions);
        toast.success(`Generated ${result.questions.length} questions successfully!`);
      } else if (result.question_list && Array.isArray(result.question_list)) {
        setGeneratedQuestions(result.question_list);
        toast.success(`Generated ${result.question_list.length} questions successfully!`);
      } else {
        toast.error('Invalid response format');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    // If voice/upload is selected and not yet parsed, parse first
    if ((inputMethod === 'voice' || inputMethod === 'upload') && !parsedSyllabus && (selectedFile || audioBlob)) {
      await handleParseSyllabus();
      return; // handleParseSyllabus will auto-generate after parsing
    }
    
    // For text input or already parsed, generate directly
    handleGenerateQuestions();
  };

  const handleCopyQuestion = (question) => {
    const questionText = `${question.question}\n${question.options ? question.options.map((opt, i) => `${String.fromCharCode(97 + i)}) ${opt}`).join('\n') : ''}`;
    navigator.clipboard.writeText(questionText);
    toast.success('Question copied to clipboard!');
  };

  const handleDownloadQuestions = () => {
    const questionsPaper = generatedQuestions.map((q, i) => 
      `${i + 1}. ${q.question} (${q.marks || 'N/A'} marks)\n${q.options ? q.options.map((opt, j) => `   ${String.fromCharCode(97 + j)}) ${opt}`).join('\n') : ''}\n\n`
    ).join('');
    
    const blob = new Blob([questionsPaper], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions-${topic.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Questions downloaded successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="glass-effect border-white/20 shadow-soft-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span>AI Question Generator</span>
          </CardTitle>
          <CardDescription>
            Generate high-quality questions using AI based on your syllabus content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Method Selection */}
          <div className="space-y-4">
            <Label>Choose Input Method</Label>
            <RadioGroup value={inputMethod} onValueChange={(value) => {
              setInputMethod(value);
              setSelectedFile(null); // Clear selected file when switching methods
            }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-4 border-2 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-200 cursor-pointer group">
                  <RadioGroupItem value="text" id="text-input" />
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="text-input" className="cursor-pointer font-medium">Text Input</Label>
                    <p className="text-xs text-muted-foreground">Type your topic or content</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 border-2 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:border-purple-200 transition-all duration-200 cursor-pointer group">
                  <RadioGroupItem value="upload" id="upload-input" />
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <Upload className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="upload-input" className="cursor-pointer font-medium">File Upload</Label>
                    <p className="text-xs text-muted-foreground">Upload PDF, TXT, or audio</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 border-2 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:border-green-200 transition-all duration-200 cursor-pointer group">
                  <RadioGroupItem value="voice" id="voice-input" />
                  <div className="p-2 bg-gradient-success rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <Mic className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="voice-input" className="cursor-pointer font-medium">Voice Input</Label>
                    <p className="text-xs text-muted-foreground">Upload audio file (MP3/WAV)</p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Content Input */}
          {inputMethod === 'text' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="topic">Topic or Subject Content</Label>
                <Textarea
                  id="topic"
                  placeholder="Enter the topic or paste your syllabus content here..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[120px] bg-white/50 backdrop-blur border-white/30"
                />
              </div>
            </div>
          )}

          {inputMethod === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="mb-2">Upload Syllabus File</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Support for PDF, TXT, MP3, WAV, M4A
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.mp3,.wav,.m4a"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button 
                  className="bg-gradient-primary hover:opacity-90"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedFile ? selectedFile.name : 'Choose File'}
                </Button>
                {selectedFile && (
                  <p className="mt-2 text-sm text-green-600">✓ {selectedFile.name}</p>
                )}
              </div>
            </div>
          )}

          {inputMethod === 'voice' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-green-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors bg-green-50/50">
                <Mic className={`h-12 w-12 mx-auto mb-4 ${isRecording ? 'text-red-600 animate-pulse' : 'text-green-600'}`} />
                <h3 className="mb-2 font-semibold">Record Your Voice</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click the microphone to start recording your syllabus content
                </p>
                
                {/* Recording Controls */}
                <div className="space-y-4">
                  {!isRecording && !audioBlob && (
                    <div className="flex flex-col items-center gap-3">
                      <Button 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white w-full max-w-xs"
                        onClick={startRecording}
                        size="lg"
                      >
                        <Mic className="h-5 w-5 mr-2" />
                        Start Recording
                      </Button>
                      <p className="text-xs text-muted-foreground">Or upload an audio file</p>
                      <input
                        ref={voiceInputRef}
                        type="file"
                        accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button 
                        variant="outline"
                        onClick={() => voiceInputRef.current?.click()}
                        size="sm"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Audio File Instead
                      </Button>
                    </div>
                  )}

                  {isRecording && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                        <span className="text-lg font-semibold text-red-600">
                          Recording: {formatTime(recordingTime)}
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Button 
                          className="bg-red-500 hover:bg-red-600 text-white w-full max-w-xs shadow-lg hover:shadow-xl transition-all"
                          onClick={stopRecording}
                          size="lg"
                        >
                          <MicOff className="h-5 w-5 mr-2" />
                          Stop Recording
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Press <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">ESC</kbd> to stop recording
                        </p>
                      </div>
                    </div>
                  )}

                  {audioBlob && !isRecording && (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <p className="text-sm text-green-700 font-medium mb-2">
                          ✓ Recording completed ({formatTime(recordingTime)})
                        </p>
                        {audioUrl && (
                          <div className="mt-2">
                            <audio controls src={audioUrl} className="w-full">
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button 
                          className="bg-gradient-primary hover:opacity-90 text-white w-full"
                          onClick={handleParseSyllabus}
                          disabled={isGenerating}
                          size="lg"
                        >
                          {isGenerating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Transcribing & Generating...
                            </>
                          ) : (
                            <>
                              <Wand2 className="h-4 w-4 mr-2" />
                              Transcribe & Generate Questions
                            </>
                          )}
                        </Button>
                        <div className="flex gap-2 justify-center flex-wrap">
                          <Button 
                            variant="outline"
                            onClick={clearRecording}
                            size="sm"
                          >
                            <MicOff className="h-4 w-4 mr-2" />
                            Record Again
                          </Button>
                          <input
                            ref={voiceInputRef}
                            type="file"
                            accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <Button 
                            variant="outline"
                            onClick={() => voiceInputRef.current?.click()}
                            size="sm"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Different File
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedFile && !audioBlob && (
                    <div className="mt-4 p-3 bg-green-100 rounded-lg">
                      <p className="text-sm text-green-700 font-medium">✓ Audio file selected: {selectedFile.name}</p>
                      <p className="text-xs text-green-600 mt-1">The audio will be transcribed automatically</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Question Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="exam-type">Exam Type</Label>
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger className="bg-white/50 backdrop-blur border-white/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="School Exam">School Exam</SelectItem>
                  <SelectItem value="University Exam">University Exam</SelectItem>
                  <SelectItem value="Competitive Exam">Competitive Exam</SelectItem>
                  <SelectItem value="Job Interview">Job Interview</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="question-type">Question Type</Label>
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger className="bg-white/50 backdrop-blur border-white/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                  <SelectItem value="short">Short Answer</SelectItem>
                  <SelectItem value="long">Long Answer</SelectItem>
                  <SelectItem value="mixed">Mixed Types</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="bg-white/50 backdrop-blur border-white/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="number-questions">Number of Questions</Label>
              <Select value={numberOfQuestions.toString()} onValueChange={(value) => setNumberOfQuestions(parseInt(value))}>
                <SelectTrigger className="bg-white/50 backdrop-blur border-white/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Questions</SelectItem>
                  <SelectItem value="10">10 Questions</SelectItem>
                  <SelectItem value="15">15 Questions</SelectItem>
                  <SelectItem value="20">20 Questions</SelectItem>
                  <SelectItem value="25">25 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Only show Parse Syllabus button for upload/voice if recording is not completed yet */}
            {(inputMethod === 'upload' || inputMethod === 'voice') && !audioBlob && (
              <Button 
                onClick={handleParseSyllabus}
                disabled={isGenerating || (!selectedFile && !audioBlob && inputMethod !== 'text') || isRecording}
                variant="outline"
                className="flex-1"
              >
                {isGenerating ? 'Parsing...' : 'Parse Syllabus First'}
              </Button>
            )}
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || (inputMethod === 'text' && !topic.trim()) || (inputMethod === 'voice' && !audioBlob && !selectedFile) || (inputMethod === 'upload' && !selectedFile) || isRecording} 
              className={`${(inputMethod === 'upload' || inputMethod === 'voice') && !audioBlob ? 'flex-1' : 'w-full'} bg-gradient-primary hover:opacity-90 shadow-soft transition-all duration-200 hover:shadow-soft-lg`}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Questions...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Questions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parsed Syllabus Topics */}
      {parsedSyllabus && parsedSyllabus.topics && (
        <Card className="glass-effect border-white/20 shadow-soft-lg">
          <CardHeader>
            <CardTitle>Parsed Topics</CardTitle>
            <CardDescription>Topics extracted from your syllabus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <Label className="font-semibold">Main Topics:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {parsedSyllabus.topics.main_topics?.map((topic, idx) => (
                    <Badge key={idx} variant="secondary">{topic}</Badge>
                  ))}
                </div>
              </div>
              {parsedSyllabus.topics.sub_topics && parsedSyllabus.topics.sub_topics.length > 0 && (
                <div>
                  <Label className="font-semibold">Sub Topics:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {parsedSyllabus.topics.sub_topics.slice(0, 10).map((topic, idx) => (
                      <Badge key={idx} variant="outline">{topic}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Questions */}
      {generatedQuestions.length > 0 && (
        <Card className="glass-effect border-white/20 shadow-soft-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-success rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span>Generated Questions</span>
                </CardTitle>
                <CardDescription>
                  {generatedQuestions.length} questions generated for "{topic}"
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleDownloadQuestions}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerate}>
                  <Shuffle className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {generatedQuestions.map((question, index) => (
                <div key={index} className="p-6 rounded-xl bg-gradient-to-r from-white/60 to-indigo-50/60 border border-white/30 hover:shadow-soft transition-all duration-200 group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-gradient-primary text-white">
                        Q{index + 1}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {question.type || 'Mixed'}
                      </Badge>
                      {question.marks && (
                        <Badge variant="secondary">
                          {question.marks} marks
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyQuestion(question)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="font-medium text-lg">{question.question}</p>
                    
                    {question.options && Array.isArray(question.options) && (
                      <div className="ml-4 space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {String.fromCharCode(97 + optIndex)}.)
                            </span>
                            <span className={option === question.answer || question.answer === String.fromCharCode(97 + optIndex) ? 'text-green-600 font-medium' : ''}>
                              {option}
                              {(option === question.answer || question.answer === String.fromCharCode(97 + optIndex)) && (
                                <CheckCircle className="h-4 w-4 inline ml-2 text-green-600" />
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {question.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">Explanation</p>
                            <p className="text-sm text-blue-700">{question.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

