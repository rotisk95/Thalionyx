export interface VideoFragment {
  id: string;
  timestamp: number;
  duration: number;
  blob: Blob;
  thumbnail?: string;
  tags: EmotionTag[];
  title?: string;
  notes?: string;
  variations: FragmentVariation[];
  responses: ResponseFragment[];
  ratings: FragmentRating[];
  metadata: FragmentMetadata;
}

export interface FragmentVariation {
  id: string;
  parentId: string;
  filterType: FilterType;
  filterSettings: Record<string, any>;
  blob: Blob;
  timestamp: number;
}

export interface ResponseFragment {
  id: string;
  parentId: string;
  blob: Blob;
  timestamp: number;
  responseType: 'answer' | 'continuation' | 'challenge';
  notes?: string;
}

export interface EmotionTag {
  emotion: EmotionType;
  intensity: number; // 1-10
  confidence: number; // 0-1
  timestamp: number;
}

export interface FragmentRating {
  id: string;
  fragmentId: string;
  helpful: boolean;
  resonance: number; // 1-5
  timestamp: number;
  context?: string;
}

export interface FragmentMetadata {
  mood: MoodType;
  energy: number; // 1-10
  clarity: number; // 1-10
  facialExpression?: string;
  voiceTone?: string;
  keywords: string[];
}

export type EmotionType = 
  | 'calm' | 'anxious' | 'happy' | 'sad' | 'angry' | 'confused'
  | 'motivated' | 'tired' | 'hopeful' | 'frustrated' | 'peaceful'
  | 'overwhelmed' | 'confident' | 'uncertain' | 'grateful' | 'lonely';

export type MoodType = 
  | 'reflective' | 'questioning' | 'affirmative' | 'exploratory'
  | 'supportive' | 'challenging' | 'nurturing' | 'analytical';

export type FilterType = 
  | 'vintage' | 'warm' | 'cool' | 'high_contrast' | 'soft_focus'
  | 'mirror' | 'kaleidoscope' | 'particle_overlay' | 'dreamy'
  | 'crystalline' | 'flowing' | 'geometric';

export interface ReflectionSession {
  id: string;
  startTime: number;
  endTime?: number;
  fragments: string[]; // fragment IDs
  theme?: string;
  insights: string[];
  patterns: PatternInsight[];
}

export interface PatternInsight {
  id: string;
  type: 'emotional_cycle' | 'trigger_pattern' | 'growth_trend' | 'resonance_cluster';
  description: string;
  confidence: number;
  relatedFragments: string[];
  timestamp: number;
}

export interface RecommendationMatch {
  fragmentId: string;
  score: number;
  reason: string;
  type: 'mood_match' | 'pattern_completion' | 'contrast_learning' | 'growth_opportunity';
}
