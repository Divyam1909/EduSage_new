import React, { useState } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { analyzeAudioResponse } from '@/utils/audioTranscription';

interface AudioRecorderProps {
  question: string;
  onRecordingComplete: (analysis: any) => void;
  onTranscriptReceived?: (transcript: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  question, 
  onRecordingComplete,
  onTranscriptReceived 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    onStop: (blobUrl, blob) => {
      handleRecordingComplete(blobUrl, blob);
    },
  });

  const handleStartRecording = () => {
    startRecording();
    // Start a timer to track recording duration
    const timer = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    setTimerId(timer);
  };

  const handleStopRecording = () => {
    stopRecording();
    // Clear the timer when recording stops
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
  };

  const handleRecordingComplete = async (blobUrl: string, blob: Blob) => {
    try {
      setIsAnalyzing(true);
      
      // Convert blob to base64
      const audioBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          resolve(base64data);
        };
        reader.onerror = reject;
      });
      
      // First analyze and transcribe the audio
      const analysis = await analyzeAudioResponse(audioBase64, question);
      
      // Extract the transcript part
      const audioTranscript = analysis.transcript || "No transcript available";
      setTranscript(audioTranscript);
      if (onTranscriptReceived) {
        onTranscriptReceived(audioTranscript);
      }
      
      // Pass the complete analysis to the parent component
      onRecordingComplete(analysis);
    } catch (error) {
      console.error("Error analyzing audio:", error);
      // Handle error case
    } finally {
      setIsAnalyzing(false);
      setRecordingTime(0);
    }
  };

  // Format seconds into MM:SS format
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-purple-50 rounded-lg">
      <div className="flex justify-center space-x-4">
        {status !== 'recording' ? (
          <Button 
            onClick={handleStartRecording} 
            className="bg-purple-600 hover:bg-purple-700 text-white"
            size="lg"
          >
            <Mic className="mr-2 h-5 w-5" />
            Start Recording
          </Button>
        ) : (
          <Button 
            onClick={handleStopRecording}
            className="bg-red-500 hover:bg-red-600 text-white"
            size="lg"
          >
            <Square className="mr-2 h-5 w-5" />
            Stop Recording ({formatTime(recordingTime)})
          </Button>
        )}
      </div>

      {status === 'recording' && (
        <div className="flex items-center justify-center mt-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-ping mr-2"></div>
          <p className="text-sm text-gray-600">Recording in progress...</p>
        </div>
      )}

      {isAnalyzing && (
        <div className="flex items-center justify-center mt-2">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-purple-600" />
          <p className="text-sm text-gray-600">Analyzing your response...</p>
        </div>
      )}

      {transcript && !isAnalyzing && (
        <div className="mt-4 w-full">
          <h3 className="text-md font-medium text-purple-800 mb-2">Transcript:</h3>
          <div className="bg-white p-3 rounded border border-gray-200 max-h-32 overflow-y-auto">
            <p className="text-sm text-gray-700">{transcript}</p>
          </div>
        </div>
      )}

      {mediaBlobUrl && !isAnalyzing && (
        <div className="mt-2 w-full">
          <h3 className="text-md font-medium text-purple-800 mb-2">Review Recording:</h3>
          <audio src={mediaBlobUrl} controls className="w-full" />
        </div>
      )}
    </div>
  );
};

export default AudioRecorder; 