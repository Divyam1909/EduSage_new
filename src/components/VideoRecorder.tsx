//@ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { Button } from '@/components/ui/button';
import { Video, Square, Loader2 } from 'lucide-react';
import { analyzeVideoResponse } from '@/utils/videoTranscription';

interface VideoRecorderProps {
  question: string;
  onRecordingComplete: (analysis: any) => void;
  onTranscriptReceived?: (transcript: string) => void;
  questionIndex?: number;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ 
  question, 
  onRecordingComplete,
  onTranscriptReceived,
  questionIndex = 0
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl
  } = useReactMediaRecorder({
    video: true,
    audio: true,
    onStop: (blobUrl, blob) => {
      handleRecordingComplete(blobUrl, blob);
    },
  });

  useEffect(() => {
    setIsAnalyzing(false);
    setTranscript('');
    setRecordingTime(0);
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
    
    clearBlobUrl();
    
    if (!cameraStream && videoPreviewRef.current) {
      initCamera();
    }
  }, [question, questionIndex]);

  useEffect(() => {
    initCamera();
    
    return () => {
      console.log("VideoRecorder is unmounting - stopping camera");
      stopCamera();
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
        videoPreviewRef.current.load();
      }
      
      if (timerId) {
        clearInterval(timerId);
        setTimerId(null);
      }
    };
  }, []);

  const initCamera = async () => {
    try {
      stopCamera();
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false
      });
      
      setCameraStream(stream);
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
      });
      setCameraStream(null);
    }
    
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (!isAnalyzing && transcript) {
      clearBlobUrl();
    }
  }, [isAnalyzing, transcript]);

  const handleStartRecording = () => {
    startRecording();
    const timer = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    setTimerId(timer);
  };

  const handleStopRecording = () => {
    stopRecording();
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
  };

  const handleRecordingComplete = async (blobUrl: string, blob: Blob) => {
    try {
      setIsAnalyzing(true);
      
      const videoBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          resolve(base64data);
        };
        reader.onerror = reject;
      });
      
      const analysis = await analyzeVideoResponse(videoBase64, question);
      
      const videoTranscript = analysis.transcript || "No transcript available";
      setTranscript(videoTranscript);
      if (onTranscriptReceived) {
        onTranscriptReceived(videoTranscript);
      }
      
      onRecordingComplete(analysis);
    } catch (error) {
      console.error("Error analyzing video:", error);
    } finally {
      setIsAnalyzing(false);
      setRecordingTime(0);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col space-y-4 p-4 bg-purple-50 rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        <div className="video-preview w-full">
          <video
            ref={videoPreviewRef}
            className="w-full h-auto rounded-lg border border-gray-300 transform -scale-x-100"
            width="100%"
            height="auto"
            autoPlay
            muted
          />
          
          <div className="mt-2 flex justify-center">
            {status !== 'recording' ? (
              <Button 
                onClick={handleStartRecording} 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                <Video className="mr-2 h-4 w-4" />
                Start Recording
              </Button>
            ) : (
              <Button 
                onClick={handleStopRecording}
                className="bg-red-500 hover:bg-red-600 text-white"
                size="sm"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop ({formatTime(recordingTime)})
              </Button>
            )}
          </div>

          {status === 'recording' && (
            <div className="flex items-center justify-center mt-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping mr-2"></div>
              <p className="text-sm text-gray-600">Recording...</p>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-3">
          <div className="bg-white p-3 rounded-lg border border-purple-100 h-full overflow-y-auto">
            <h3 className="text-md font-medium text-purple-800 mb-2">Current Question:</h3>
            <p className="text-gray-800">{question}</p>
          </div>
          
          {isAnalyzing && (
            <div className="flex items-center justify-center mt-2 bg-white p-3 rounded-lg border border-purple-100">
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-purple-600" />
              <p className="text-sm text-gray-600">Analyzing your response...</p>
            </div>
          )}
        </div>
      </div>

      {transcript && !isAnalyzing && (
        <div className="w-full transcript-container">
          <h3 className="text-md font-medium text-purple-800 mb-2">Transcript:</h3>
          <div className="bg-white p-3 rounded border border-gray-200 max-h-32 overflow-y-auto">
            <p className="text-sm text-gray-700">{transcript}</p>
          </div>
        </div>
      )}

      {mediaBlobUrl && !isAnalyzing && (
        <div className="w-full">
          <h3 className="text-md font-medium text-purple-800 mb-2">Review Recording:</h3>
          <video src={mediaBlobUrl} controls className="w-full rounded-lg" />
        </div>
      )}
    </div>
  );
};

export default VideoRecorder; 