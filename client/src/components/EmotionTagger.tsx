import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, X, Heart, Brain, Zap, Target } from 'lucide-react';
import { EmotionTag, EmotionType, MoodType, VideoFragment } from '@/types/reflection';
import { cn } from '@/lib/utils';

interface EmotionTaggerProps {
  fragment: VideoFragment;
  onTagAdded: (tag: EmotionTag) => void;
  onMetadataUpdated: (metadata: Partial<VideoFragment['metadata']>) => void;
  className?: string;
}

const emotionOptions: { value: EmotionType; label: string; color: string; icon: string }[] = [
  { value: 'calm', label: 'Calm', color: 'bg-blue-100 text-blue-800', icon: '🧘' },
  { value: 'anxious', label: 'Anxious', color: 'bg-orange-100 text-orange-800', icon: '😰' },
  { value: 'happy', label: 'Happy', color: 'bg-yellow-100 text-yellow-800', icon: '😊' },
  { value: 'sad', label: 'Sad', color: 'bg-purple-100 text-purple-800', icon: '😢' },
  { value: 'angry', label: 'Angry', color: 'bg-red-100 text-red-800', icon: '😠' },
  { value: 'confused', label: 'Confused', color: 'bg-gray-100 text-gray-800', icon: '🤔' },
  { value: 'motivated', label: 'Motivated', color: 'bg-green-100 text-green-800', icon: '💪' },
  { value: 'tired', label: 'Tired', color: 'bg-slate-100 text-slate-800', icon: '😴' },
  { value: 'hopeful', label: 'Hopeful', color: 'bg-emerald-100 text-emerald-800', icon: '🌟' },
  { value: 'frustrated', label: 'Frustrated', color: 'bg-rose-100 text-rose-800', icon: '😤' },
  { value: 'peaceful', label: 'Peaceful', color: 'bg-teal-100 text-teal-800', icon: '☮️' },
  { value: 'overwhelmed', label: 'Overwhelmed', color: 'bg-indigo-100 text-indigo-800', icon: '🌊' },
  { value: 'confident', label: 'Confident', color: 'bg-amber-100 text-amber-800', icon: '💫' },
  { value: 'uncertain', label: 'Uncertain', color: 'bg-stone-100 text-stone-800', icon: '❓' },
  { value: 'grateful', label: 'Grateful', color: 'bg-pink-100 text-pink-800', icon: '🙏' },
  { value: 'lonely', label: 'Lonely', color: 'bg-violet-100 text-violet-800', icon: '😔' },
];

const moodOptions: { value: MoodType; label: string; description: string }[] = [
  { value: 'reflective', label: 'Reflective', description: 'Deep contemplation and self-examination' },
  { value: 'questioning', label: 'Questioning', description: 'Seeking answers and exploring possibilities' },
  { value: 'affirmative', label: 'Affirmative', description: 'Confident and declarative statements' },
  { value: 'exploratory', label: 'Exploratory', description: 'Open-minded investigation of ideas' },
  { value: 'supportive', label: 'Supportive', description: 'Encouraging and nurturing tone' },
  { value: 'challenging', label: 'Challenging', description: 'Pushing boundaries and questioning beliefs' },
  { value: 'nurturing', label: 'Nurturing', description: 'Caring and compassionate approach' },
  { value: 'analytical', label: 'Analytical', description: 'Logical and systematic thinking' },
];

export function EmotionTagger({ 
  fragment, 
  onTagAdded, 
  onMetadataUpdated, 
  className 
}: EmotionTaggerProps) {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType>('calm');
  const [intensity, setIntensity] = useState<number[]>([5]);
  const [confidence, setConfidence] = useState<number[]>([0.8]);
  const [selectedMood, setSelectedMood] = useState<MoodType>(fragment.metadata.mood);
  const [energy, setEnergy] = useState<number[]>([fragment.metadata.energy]);
  const [clarity, setClarity] = useState<number[]>([fragment.metadata.clarity]);
  const [keywords, setKeywords] = useState<string>(fragment.metadata.keywords.join(', '));
  const [notes, setNotes] = useState<string>(fragment.notes || '');

  const addEmotionTag = () => {
    const tag: EmotionTag = {
      emotion: selectedEmotion,
      intensity: intensity[0],
      confidence: confidence[0],
      timestamp: Date.now()
    };
    
    onTagAdded(tag);
  };

  const removeTag = (index: number) => {
    // This would need to be implemented in the parent component
    // For now, we'll show existing tags as read-only
  };

  const updateMetadata = () => {
    const updatedMetadata = {
      mood: selectedMood,
      energy: energy[0],
      clarity: clarity[0],
      keywords: keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
    };
    
    onMetadataUpdated(updatedMetadata);
  };

  const getEmotionConfig = (emotion: EmotionType) => {
    return emotionOptions.find(opt => opt.value === emotion);
  };

  const getMoodConfig = (mood: MoodType) => {
    return moodOptions.find(opt => opt.value === mood);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Emotional Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Existing Tags */}
        {fragment.tags.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Current Emotions</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {fragment.tags.map((tag, index) => {
                const config = getEmotionConfig(tag.emotion);
                return (
                  <Badge key={index} className={cn("text-xs", config?.color)}>
                    <span className="mr-1">{config?.icon}</span>
                    {config?.label} ({tag.intensity}/10)
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Add New Emotion */}
        <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="w-4 h-4" />
            <Label className="font-medium">Add Emotion</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Emotion</Label>
              <Select value={selectedEmotion} onValueChange={(value) => setSelectedEmotion(value as EmotionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {emotionOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Intensity: {intensity[0]}/10</Label>
              <Slider
                value={intensity}
                onValueChange={setIntensity}
                max={10}
                min={1}
                step={1}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm">Confidence: {Math.round(confidence[0] * 100)}%</Label>
            <Slider
              value={confidence}
              onValueChange={setConfidence}
              max={1}
              min={0.1}
              step={0.1}
              className="mt-2"
            />
          </div>

          <Button onClick={addEmotionTag} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Emotion Tag
          </Button>
        </div>

        {/* Metadata */}
        <div className="space-y-4 border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4" />
            <Label className="font-medium">Fragment Metadata</Label>
          </div>
          
          <div>
            <Label className="text-sm">Overall Mood</Label>
            <Select value={selectedMood} onValueChange={(value) => setSelectedMood(value as MoodType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {moodOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Energy Level: {energy[0]}/10
              </Label>
              <Slider
                value={energy}
                onValueChange={setEnergy}
                max={10}
                min={1}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-sm flex items-center gap-1">
                <Heart className="w-3 h-3" />
                Clarity: {clarity[0]}/10
              </Label>
              <Slider
                value={clarity}
                onValueChange={setClarity}
                max={10}
                min={1}
                step={1}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm">Keywords (comma-separated)</Label>
            <Textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="self-reflection, growth, clarity, challenge..."
              className="mt-2"
              rows={2}
            />
          </div>

          <div>
            <Label className="text-sm">Personal Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional thoughts or context about this fragment..."
              className="mt-2"
              rows={3}
            />
          </div>

          <Button onClick={updateMetadata} variant="outline" className="w-full">
            Update Metadata
          </Button>
        </div>

        {/* Quick Emotion Buttons */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Add Common Emotions</Label>
          <div className="grid grid-cols-3 gap-2">
            {['calm', 'happy', 'confused', 'motivated', 'peaceful', 'grateful'].map(emotion => {
              const config = getEmotionConfig(emotion as EmotionType);
              return (
                <Button
                  key={emotion}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedEmotion(emotion as EmotionType);
                    setIntensity([6]);
                    setConfidence([0.8]);
                    addEmotionTag();
                  }}
                  className="text-xs"
                >
                  <span className="mr-1">{config?.icon}</span>
                  {config?.label}
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
