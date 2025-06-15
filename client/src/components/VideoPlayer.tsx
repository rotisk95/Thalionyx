import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX,
  Download,
  Sparkles,
  Eye
} from 'lucide-react';
import { VideoFragment, FilterType } from '@/types/reflection';
import { VideoFilterProcessor, filterConfigs } from '@/lib/videoFilters';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  fragment: VideoFragment;
  variation?: string; // variation ID to play
  showControls?: boolean;
  autoPlay?: boolean;
  onFilterApplied?: (filterType: FilterType, blob: Blob) => void;
  className?: string;
}

export function VideoPlayer({ 
  fragment, 
  variation, 
  showControls = true, 
  autoPlay = false,
  onFilterApplied,
  className 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const filterProcessorRef = useRef<VideoFilterProcessor | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType | 'none'>('none');
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  // Get the video blob to play
  useEffect(() => {
    if (variation) {
      const foundVariation = fragment.variations.find(v => v.id === variation);
      setVideoBlob(foundVariation?.blob || fragment.blob);
    } else {
      setVideoBlob(fragment.blob);
    }
  }, [fragment, variation]);

  // Initialize video when blob changes
  useEffect(() => {
    if (videoBlob && videoRef.current) {
      const url = URL.createObjectURL(videoBlob);
      videoRef.current.src = url;
      
      if (autoPlay) {
        videoRef.current.play();
      }

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [videoBlob, autoPlay]);

  // Initialize filter processor
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      filterProcessorRef.current = new VideoFilterProcessor(
        video.videoWidth || 1280,
        video.videoHeight || 720
      );
    }

    return () => {
      if (filterProcessorRef.current) {
        filterProcessorRef.current.dispose();
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    const newTime = value[0];
    if (Number.isFinite(newTime)) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const restart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const applyFilter = async () => {
    if (!videoRef.current || !filterProcessorRef.current || selectedFilter === 'none') {
      return;
    }

    setIsApplyingFilter(true);

    try {
      const video = videoRef.current;
      const processor = filterProcessorRef.current;
      
      // Pause video during processing
      const wasPlaying = !video.paused;
      video.pause();

      // Apply filter to current frame
      const filteredCanvas = await processor.applyFilter(video, selectedFilter as FilterType);
      
      // Convert canvas to video blob (this would need a more complex implementation for real video processing)
      // For demo purposes, we'll create a still image
      const filteredBlob = await new Promise<Blob>((resolve) => {
        filteredCanvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/webp', 0.8);
      });

      // In a real implementation, you'd process the entire video
      // For now, we'll simulate this by creating a short video from the filtered frame
      const simulatedVideoBlob = new Blob([filteredBlob], { type: 'video/webm' });

      if (onFilterApplied) {
        onFilterApplied(selectedFilter as FilterType, simulatedVideoBlob);
      }

      if (wasPlaying) {
        video.play();
      }

    } catch (error) {
      console.error('Error applying filter:', error);
    } finally {
      setIsApplyingFilter(false);
    }
  };

  const downloadVideo = () => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fragment-${fragment.id}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!videoBlob) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
            <p className="text-muted-foreground">Loading video...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showControls && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Video Fragment</CardTitle>
            <div className="flex items-center gap-2">
              {fragment.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag.emotion}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={cn("p-6", !showControls && "p-0")}>
        <div className="space-y-4">
          {/* Video Display */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onClick={handlePlayPause}
            />
            
            {/* Play/Pause Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full w-16 h-16"
                onClick={handlePlayPause}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </Button>
            </div>
          </div>

          {showControls && (
            <>
              {/* Progress Bar */}
              <div className="space-y-2">
                <Slider
                  value={[currentTime]}
                  max={duration}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handlePlayPause}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  
                  <Button size="sm" variant="outline" onClick={restart}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={toggleMute}>
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    
                    <div className="w-20">
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        max={1}
                        step={0.1}
                        onValueChange={handleVolumeChange}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={downloadVideo}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Filter Controls */}
              {onFilterApplied && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Apply Filter:</span>
                    </div>
                    
                    <Select value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as FilterType | 'none')}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Choose a filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Filter</SelectItem>
                        {Object.entries(filterConfigs).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button 
                      size="sm" 
                      onClick={applyFilter} 
                      disabled={selectedFilter === 'none' || isApplyingFilter}
                      className="flex items-center gap-2"
                    >
                      {isApplyingFilter ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      {isApplyingFilter ? 'Processing...' : 'Create Variation'}
                    </Button>
                  </div>
                  
                  {selectedFilter !== 'none' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {filterConfigs[selectedFilter as FilterType]?.description}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
