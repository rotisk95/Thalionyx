import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Heart, 
  Sparkles, 
  MessageSquare, 
  Star, 
  RefreshCw,
  Calendar,
  Lightbulb,
  Target,
  TrendingUp,
  Brain,
  Play,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { VideoFragment, PatternInsight, RecommendationMatch, MoodType, EmotionType } from '@/types/reflection';
import { VideoPlayer } from './VideoPlayer';
import { cn } from '@/lib/utils';

interface ReflectionInterfaceProps {
  fragments: VideoFragment[];
  patterns: PatternInsight[];
  recommendations: RecommendationMatch[];
  onGenerateRecommendations: (currentMood: string) => Promise<void>;
  onRateFragment: (fragmentId: string, helpful: boolean, resonance: number, context?: string) => Promise<void>;
  onCreateResponse: (fragment: VideoFragment) => void;
  className?: string;
}

const moodOptions: { value: MoodType | EmotionType; label: string; icon: string; description: string }[] = [
  { value: 'calm', label: 'Calm', icon: '🧘', description: 'Feeling peaceful and centered' },
  { value: 'anxious', label: 'Anxious', icon: '😰', description: 'Feeling worried or stressed' },
  { value: 'happy', label: 'Happy', icon: '😊', description: 'Feeling joyful and positive' },
  { value: 'sad', label: 'Sad', icon: '😢', description: 'Feeling down or melancholy' },
  { value: 'confused', label: 'Confused', icon: '🤔', description: 'Feeling uncertain or puzzled' },
  { value: 'motivated', label: 'Motivated', icon: '💪', description: 'Feeling driven and energized' },
  { value: 'overwhelmed', label: 'Overwhelmed', icon: '🌊', description: 'Feeling like there\'s too much to handle' },
  { value: 'grateful', label: 'Grateful', icon: '🙏', description: 'Feeling thankful and appreciative' },
  { value: 'lonely', label: 'Lonely', icon: '😔', description: 'Feeling isolated or disconnected' },
  { value: 'reflective', label: 'Reflective', icon: '🤲', description: 'In a contemplative mood' }
];

const reflectionPrompts = [
  "What am I feeling right now, and why?",
  "What challenged me today, and how did I respond?",
  "What am I grateful for in this moment?",
  "What patterns do I notice in my recent thoughts?",
  "How have I grown since my last reflection?",
  "What do I need to hear from myself today?",
  "What wisdom would I share with my past self?",
  "What small step can I take toward my goals?",
  "How can I show myself compassion today?",
  "What would my future self want me to know?"
];

export function ReflectionInterface({
  fragments,
  patterns,
  recommendations,
  onGenerateRecommendations,
  onRateFragment,
  onCreateResponse,
  className
}: ReflectionInterfaceProps) {
  const [currentMood, setCurrentMood] = useState<string>('');
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationMatch | null>(null);
  const [reflectionNote, setReflectionNote] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Auto-generate recommendations when mood changes
  useEffect(() => {
    if (currentMood && fragments.length > 0) {
      handleGenerateRecommendations();
    }
  }, [currentMood]);

  const handleGenerateRecommendations = async () => {
    if (!currentMood) return;
    
    setIsGenerating(true);
    try {
      await onGenerateRecommendations(currentMood);
      setShowRecommendations(true);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRatingSubmit = async (recommendation: RecommendationMatch, helpful: boolean, resonance: number) => {
    try {
      await onRateFragment(
        recommendation.fragmentId, 
        helpful, 
        resonance, 
        `Recommended for ${currentMood} mood - ${recommendation.reason}`
      );
      
      // Update UI to show feedback was submitted
      setSelectedRecommendation(null);
    } catch (error) {
      console.error('Failed to submit rating:', error);
    }
  };

  const getRecommendedFragment = (recommendation: RecommendationMatch): VideoFragment | undefined => {
    return fragments.find(f => f.id === recommendation.fragmentId);
  };

  const getTodaysFragments = (): VideoFragment[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return fragments.filter(fragment => {
      const fragmentDate = new Date(fragment.timestamp);
      return fragmentDate >= today;
    });
  };

  const getRecentInsights = (): PatternInsight[] => {
    return patterns
      .filter(pattern => pattern.confidence > 0.6)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3);
  };

  const formatTimeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const todaysFragments = getTodaysFragments();
  const recentInsights = getRecentInsights();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Daily Reflection</h2>
          </div>
          
          <p className="text-muted-foreground mb-4">
            Welcome back to your self-mirroring practice. How are you feeling today?
          </p>
          
          <div className="flex flex-wrap gap-2">
            {todaysFragments.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {todaysFragments.length} reflection{todaysFragments.length !== 1 ? 's' : ''} today
              </Badge>
            )}
            {patterns.length > 0 && (
              <Badge variant="outline" className="text-sm">
                {patterns.length} pattern{patterns.length !== 1 ? 's' : ''} discovered
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Mood & Prompts */}
        <div className="space-y-6">
          {/* Current Mood */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5" />
                How are you feeling?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={currentMood} onValueChange={setCurrentMood}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your current mood..." />
                </SelectTrigger>
                <SelectContent>
                  {moodOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {currentMood && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Feeling {currentMood}:</span> Let me find some helpful reflections for you.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reflection Prompts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="w-5 h-5" />
                Reflection Prompts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">
                Need inspiration? Try reflecting on one of these questions:
              </p>
              
              <div className="space-y-2">
                {reflectionPrompts.slice(0, 3).map((prompt, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full text-left h-auto p-3 justify-start"
                    onClick={() => setSelectedPrompt(prompt)}
                  >
                    <div className="text-sm">{prompt}</div>
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const randomPrompt = reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)];
                  setSelectedPrompt(randomPrompt);
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Get Random Prompt
              </Button>

              {selectedPrompt && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium mb-2">Current Prompt:</p>
                  <p className="text-sm">{selectedPrompt}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Insights */}
          {recentInsights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="w-5 h-5" />
                  Recent Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentInsights.map((insight) => (
                  <div key={insight.id} className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">{insight.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {Math.round(insight.confidence * 100)}% confident
                      </Badge>
                      <span>{formatTimeAgo(insight.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Middle Column - Recommendations */}
        <div className="space-y-6">
          {currentMood && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5" />
                  Recommended for You
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Based on your current {currentMood} mood
                </p>
              </CardHeader>
              <CardContent>
                {isGenerating ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Finding the perfect reflection for you...
                    </p>
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.slice(0, 3).map((recommendation) => {
                      const fragment = getRecommendedFragment(recommendation);
                      if (!fragment) return null;

                      return (
                        <div
                          key={recommendation.fragmentId}
                          className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedRecommendation(recommendation)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-12 bg-black rounded overflow-hidden flex-shrink-0">
                              <video 
                                src={URL.createObjectURL(fragment.blob)}
                                className="w-full h-full object-cover"
                                muted
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-xs">
                                  {recommendation.type.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Score: {Math.round(recommendation.score * 100)}%
                                </span>
                              </div>
                              
                              <p className="text-sm mb-2 line-clamp-2">
                                {recommendation.reason}
                              </p>
                              
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {formatTimeAgo(fragment.timestamp)}
                                
                                {fragment.tags.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{fragment.tags[0].emotion}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : showRecommendations ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No specific recommendations found for your current mood. 
                      Try recording more fragments to get better matches.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Today's Reflections */}
          {todaysFragments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5" />
                  Today's Reflections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todaysFragments.map((fragment) => (
                  <div key={fragment.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="w-12 h-9 bg-black rounded overflow-hidden flex-shrink-0">
                      <video 
                        src={URL.createObjectURL(fragment.blob)}
                        className="w-full h-full object-cover"
                        muted
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {fragment.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag.emotion}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(fragment.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Reflection Notes */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5" />
                Reflection Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Write down your thoughts, insights, or responses to the recommended fragments..."
                value={reflectionNote}
                onChange={(e) => setReflectionNote(e.target.value)}
                rows={6}
                className="resize-none"
              />
              
              <Button className="w-full" disabled={!reflectionNote.trim()}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Save Reflection Note
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Fragments</span>
                <span className="font-semibold">{fragments.length}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Week</span>
                <span className="font-semibold">
                  {fragments.filter(f => 
                    Date.now() - f.timestamp < 7 * 24 * 60 * 60 * 1000
                  ).length}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Patterns Found</span>
                <span className="font-semibold">{patterns.length}</span>
              </div>
              
              {fragments.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Clarity</span>
                  <span className="font-semibold">
                    {(fragments.reduce((sum, f) => sum + f.metadata.clarity, 0) / fragments.length).toFixed(1)}/10
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fragment Player Modal */}
      {selectedRecommendation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recommended Fragment</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedRecommendation(null)}>
                ✕
              </Button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Why this was recommended:</p>
                <p className="text-sm text-muted-foreground">{selectedRecommendation.reason}</p>
              </div>

              {(() => {
                const fragment = getRecommendedFragment(selectedRecommendation);
                return fragment ? (
                  <VideoPlayer 
                    fragment={fragment}
                    showControls={true}
                    autoPlay={true}
                  />
                ) : null;
              })()}

              {/* Rating Section */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3">How was this recommendation?</h3>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleRatingSubmit(selectedRecommendation, true, 4)}
                      >
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        Helpful
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleRatingSubmit(selectedRecommendation, false, 2)}
                      >
                        <ThumbsDown className="w-4 h-4 mr-2" />
                        Not Helpful
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Resonance Level (1-5)</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Button
                            key={rating}
                            variant="outline"
                            size="sm"
                            onClick={() => handleRatingSubmit(selectedRecommendation, true, rating)}
                          >
                            <Star className="w-4 h-4" />
                            {rating}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
