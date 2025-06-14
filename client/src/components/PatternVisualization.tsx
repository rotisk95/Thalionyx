import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Brain,
  Heart,
  Zap,
  Target,
  ArrowRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { VideoFragment, PatternInsight, EmotionType } from '@/types/reflection';
import { cn } from '@/lib/utils';

interface PatternVisualizationProps {
  fragments: VideoFragment[];
  patterns: PatternInsight[];
  onAnalyzePatterns: () => Promise<void>;
  className?: string;
}

interface EmotionTrend {
  emotion: EmotionType;
  count: number;
  avgIntensity: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

interface TimeSeriesData {
  date: string;
  clarity: number;
  energy: number;
  fragmentCount: number;
}

export function PatternVisualization({
  fragments,
  patterns,
  onAnalyzePatterns,
  className
}: PatternVisualizationProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<PatternInsight | null>(null);

  // Calculate emotion trends
  const emotionTrends = useMemo((): EmotionTrend[] => {
    const emotionMap = new Map<EmotionType, { count: number; totalIntensity: number; recent: number; older: number }>();

    fragments.forEach((fragment, index) => {
      const isRecent = index >= Math.floor(fragments.length * 0.7); // Last 30% of fragments
      
      fragment.tags.forEach(tag => {
        const current = emotionMap.get(tag.emotion) || { count: 0, totalIntensity: 0, recent: 0, older: 0 };
        emotionMap.set(tag.emotion, {
          count: current.count + 1,
          totalIntensity: current.totalIntensity + tag.intensity,
          recent: isRecent ? current.recent + 1 : current.recent,
          older: !isRecent ? current.older + 1 : current.older
        });
      });
    });

    const emotionColors: Record<string, string> = {
      calm: 'bg-blue-500',
      happy: 'bg-yellow-500',
      anxious: 'bg-orange-500',
      sad: 'bg-purple-500',
      angry: 'bg-red-500',
      motivated: 'bg-green-500',
      peaceful: 'bg-teal-500',
      confused: 'bg-gray-500',
      grateful: 'bg-pink-500',
      tired: 'bg-slate-500'
    };

    return Array.from(emotionMap.entries())
      .map(([emotion, data]) => {
        const avgIntensity = data.totalIntensity / data.count;
        const recentRate = data.recent / Math.max(1, Math.floor(fragments.length * 0.3));
        const olderRate = data.older / Math.max(1, Math.floor(fragments.length * 0.7));
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (recentRate > olderRate * 1.2) trend = 'up';
        else if (recentRate < olderRate * 0.8) trend = 'down';

        return {
          emotion,
          count: data.count,
          avgIntensity,
          trend,
          color: emotionColors[emotion] || 'bg-gray-500'
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [fragments]);

  // Calculate time series data
  const timeSeriesData = useMemo((): TimeSeriesData[] => {
    if (fragments.length === 0) return [];

    const groupedByDay = new Map<string, VideoFragment[]>();
    
    fragments.forEach(fragment => {
      const date = new Date(fragment.timestamp).toISOString().split('T')[0];
      const existing = groupedByDay.get(date) || [];
      groupedByDay.set(date, [...existing, fragment]);
    });

    return Array.from(groupedByDay.entries())
      .map(([date, dayFragments]) => ({
        date,
        clarity: dayFragments.reduce((sum, f) => sum + f.metadata.clarity, 0) / dayFragments.length,
        energy: dayFragments.reduce((sum, f) => sum + f.metadata.energy, 0) / dayFragments.length,
        fragmentCount: dayFragments.length
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [fragments]);

  // Calculate overall metrics
  const metrics = useMemo(() => {
    if (fragments.length === 0) {
      return {
        avgClarity: 0,
        avgEnergy: 0,
        totalReflectionTime: 0,
        mostCommonEmotion: 'None',
        clarityTrend: 0,
        energyTrend: 0
      };
    }

    const avgClarity = fragments.reduce((sum, f) => sum + f.metadata.clarity, 0) / fragments.length;
    const avgEnergy = fragments.reduce((sum, f) => sum + f.metadata.energy, 0) / fragments.length;
    const totalReflectionTime = fragments.reduce((sum, f) => sum + f.duration, 0);

    // Calculate trends (recent vs older fragments)
    const recentFragments = fragments.slice(-Math.floor(fragments.length / 3));
    const olderFragments = fragments.slice(0, Math.floor(fragments.length / 3));

    const recentClarity = recentFragments.length > 0 
      ? recentFragments.reduce((sum, f) => sum + f.metadata.clarity, 0) / recentFragments.length 
      : avgClarity;
    const olderClarity = olderFragments.length > 0 
      ? olderFragments.reduce((sum, f) => sum + f.metadata.clarity, 0) / olderFragments.length 
      : avgClarity;

    const recentEnergy = recentFragments.length > 0 
      ? recentFragments.reduce((sum, f) => sum + f.metadata.energy, 0) / recentFragments.length 
      : avgEnergy;
    const olderEnergy = olderFragments.length > 0 
      ? olderFragments.reduce((sum, f) => sum + f.metadata.energy, 0) / olderFragments.length 
      : avgEnergy;

    return {
      avgClarity: Math.round(avgClarity * 10) / 10,
      avgEnergy: Math.round(avgEnergy * 10) / 10,
      totalReflectionTime,
      mostCommonEmotion: emotionTrends[0]?.emotion || 'None',
      clarityTrend: recentClarity - olderClarity,
      energyTrend: recentEnergy - olderEnergy
    };
  }, [fragments, emotionTrends]);

  const handleAnalyzePatterns = async () => {
    setIsAnalyzing(true);
    try {
      await onAnalyzePatterns();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (fragments.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="text-center">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Patterns Yet</h3>
            <p className="text-muted-foreground">
              Record at least 3 reflection fragments to start seeing emotional patterns and insights.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pattern Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Insights from {fragments.length} reflection fragments
          </p>
        </div>
        
        <Button 
          onClick={handleAnalyzePatterns} 
          disabled={isAnalyzing}
          variant="outline"
          size="sm"
        >
          {isAnalyzing ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Brain className="w-4 h-4 mr-2" />
          )}
          {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
        </Button>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Avg Clarity</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{metrics.avgClarity}</span>
              <span className="text-xs text-muted-foreground">/10</span>
              {metrics.clarityTrend !== 0 && (
                <div className={cn(
                  "flex items-center text-xs",
                  metrics.clarityTrend > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {metrics.clarityTrend > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(metrics.clarityTrend).toFixed(1)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Avg Energy</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{metrics.avgEnergy}</span>
              <span className="text-xs text-muted-foreground">/10</span>
              {metrics.energyTrend !== 0 && (
                <div className={cn(
                  "flex items-center text-xs",
                  metrics.energyTrend > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {metrics.energyTrend > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(metrics.energyTrend).toFixed(1)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Reflection Time</span>
            </div>
            <span className="text-2xl font-bold">
              {formatDuration(metrics.totalReflectionTime)}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-medium">Top Emotion</span>
            </div>
            <span className="text-lg font-bold capitalize">
              {metrics.mostCommonEmotion}
            </span>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="emotions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="emotions">Emotion Trends</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="emotions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Emotional Landscape
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emotionTrends.slice(0, 8).map((trend) => (
                  <div key={trend.emotion} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <div className={cn("w-3 h-3 rounded-full", trend.color)} />
                      <span className="text-sm font-medium capitalize">
                        {trend.emotion}
                      </span>
                      {trend.trend === 'up' && (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      )}
                      {trend.trend === 'down' && (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">
                          {trend.count} occurrences
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Avg intensity: {trend.avgIntensity.toFixed(1)}/10
                        </span>
                      </div>
                      <Progress 
                        value={(trend.count / fragments.length) * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Clarity & Energy Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeSeriesData.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span>Clarity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <span>Energy</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {timeSeriesData.slice(-14).map((data, index) => (
                      <div key={data.date} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{formatDate(data.date)}</span>
                          <span className="text-muted-foreground">
                            {data.fragmentCount} fragment{data.fragmentCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Clarity</span>
                              <span className="text-xs font-medium">{data.clarity.toFixed(1)}</span>
                            </div>
                            <Progress value={data.clarity * 10} className="h-1" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Energy</span>
                              <span className="text-xs font-medium">{data.energy.toFixed(1)}</span>
                            </div>
                            <Progress value={data.energy * 10} className="h-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No timeline data available yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {patterns.length > 0 ? (
            <div className="space-y-4">
              {patterns.map((pattern) => (
                <Card 
                  key={pattern.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md",
                    selectedPattern?.id === pattern.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedPattern(
                    selectedPattern?.id === pattern.id ? null : pattern
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {pattern.type === 'emotional_cycle' && (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <ArrowRight className="w-4 h-4 text-blue-600" />
                          </div>
                        )}
                        {pattern.type === 'trigger_pattern' && (
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <Zap className="w-4 h-4 text-orange-600" />
                          </div>
                        )}
                        {pattern.type === 'growth_trend' && (
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                        {pattern.type === 'resonance_cluster' && (
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{pattern.description}</h4>
                          <Badge variant="outline" className="text-xs ml-2">
                            {Math.round(pattern.confidence * 100)}% confident
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="capitalize">
                            {pattern.type.replace('_', ' ')}
                          </span>
                          <span>
                            {pattern.relatedFragments.length} fragments involved
                          </span>
                          <span>
                            {new Date(pattern.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {selectedPattern?.id === pattern.id && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-muted-foreground">
                              This pattern was identified by analyzing your reflection fragments.
                              Consider how this insight might guide your future self-reflection practice.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Discovering Patterns</h3>
                  <p className="text-muted-foreground mb-4">
                    Continue adding reflection fragments to unlock deeper insights about your emotional patterns and growth trends.
                  </p>
                  <Button onClick={handleAnalyzePatterns} disabled={isAnalyzing}>
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
