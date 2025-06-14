import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square, RotateCcw, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onCancel?: () => void;
}

export function VideoRecorder({ onRecordingComplete, onCancel }: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera();
    return () => {
      cleanupCamera();
    };
  }, []);

  // Update duration timer
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isRecording) {
      intervalId = setInterval(() => {
        setDuration(Date.now() - startTimeRef.current);
      }, 100);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRecording]);

  const initializeCamera = async () => {
    try {
      setError(null);
      setIsInitializing(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Prevent feedback
      }
      
      setIsInitializing(false);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions and try again.');
      setIsInitializing(false);
    }
  };

  const cleanupCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = () => {
    if (!streamRef.current) {
      setError('Camera not available');
      return;
    }

    try {
      chunksRef.current = [];
      
      // Configure MediaRecorder
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        setIsPreviewing(true);
        
        // Create preview URL
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = URL.createObjectURL(blob);
          videoRef.current.muted = false;
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setError(null);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const retryRecording = () => {
    setIsPreviewing(false);
    setRecordedBlob(null);
    setDuration(0);
    
    // Revoke previous blob URL
    if (videoRef.current?.src) {
      URL.revokeObjectURL(videoRef.current.src);
    }
    
    // Restart camera
    initializeCamera();
  };

  const saveRecording = () => {
    if (recordedBlob && duration > 0) {
      onRecordingComplete(recordedBlob, duration);
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isInitializing) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Initializing camera...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <X className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={initializeCamera} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Video Display */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <Badge variant="destructive" className="text-xs">
                  REC {formatDuration(duration)}
                </Badge>
              </div>
            )}
            
            {/* Preview Indicator */}
            {isPreviewing && (
              <div className="absolute top-4 left-4">
                <Badge variant="secondary" className="text-xs">
                  Preview ({formatDuration(duration)})
                </Badge>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isRecording && !isPreviewing && (
              <Button
                onClick={startRecording}
                size="lg"
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
              >
                <div className="w-4 h-4 bg-white rounded-full"></div>
                Start Recording
              </Button>
            )}

            {isRecording && (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Stop Recording
              </Button>
            )}

            {isPreviewing && (
              <>
                <Button
                  onClick={retryRecording}
                  size="lg"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Record Again
                </Button>
                
                <Button
                  onClick={saveRecording}
                  size="lg"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4" />
                  Save Fragment
                </Button>
              </>
            )}

            {onCancel && (
              <Button
                onClick={onCancel}
                variant="ghost"
                size="lg"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            )}
          </div>

          {/* Recording Tips */}
          {!isRecording && !isPreviewing && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium text-sm mb-2">Recording Tips</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Speak naturally about your thoughts, feelings, or questions</li>
                <li>Good lighting helps create better visual connection</li>
                <li>Keep recordings 30 seconds to 2 minutes for best results</li>
                <li>Express yourself authentically - this is for your growth</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
