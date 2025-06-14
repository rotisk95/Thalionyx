import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { 
  VideoFragment, 
  ReflectionSession, 
  PatternInsight, 
  RecommendationMatch,
  EmotionTag,
  MoodType,
  FilterType
} from "@/types/reflection";
import { dbManager } from "@/lib/indexedDB";
import { patternEngine } from "@/lib/patternRecognition";

interface ReflectionState {
  // Current state
  isRecording: boolean;
  currentFragment: VideoFragment | null;
  selectedFragment: VideoFragment | null;
  currentSession: ReflectionSession | null;
  
  // Data
  fragments: VideoFragment[];
  patterns: PatternInsight[];
  recommendations: RecommendationMatch[];
  
  // UI state
  currentView: 'record' | 'library' | 'reflect' | 'patterns';
  isLoading: boolean;
  error: string | null;
  
  // Actions
  startRecording: () => void;
  stopRecording: (blob: Blob, duration: number) => void;
  saveFragment: (fragment: VideoFragment) => Promise<void>;
  loadFragments: () => Promise<void>;
  selectFragment: (fragment: VideoFragment | null) => void;
  addFragmentTag: (fragmentId: string, tag: EmotionTag) => Promise<void>;
  rateFragment: (fragmentId: string, helpful: boolean, resonance: number, context?: string) => Promise<void>;
  createVariation: (fragmentId: string, filterType: FilterType, blob: Blob) => Promise<void>;
  addResponse: (fragmentId: string, blob: Blob, responseType: 'answer' | 'continuation' | 'challenge', notes?: string) => Promise<void>;
  startSession: (theme?: string) => void;
  endSession: (insights: string[]) => Promise<void>;
  analyzePatterns: () => Promise<void>;
  generateRecommendations: (currentMood: string) => Promise<void>;
  setCurrentView: (view: 'record' | 'library' | 'reflect' | 'patterns') => void;
  deleteFragment: (fragmentId: string) => Promise<void>;
  clearError: () => void;
}

export const useReflection = create<ReflectionState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isRecording: false,
    currentFragment: null,
    selectedFragment: null,
    currentSession: null,
    fragments: [],
    patterns: [],
    recommendations: [],
    currentView: 'record',
    isLoading: false,
    error: null,

    startRecording: () => {
      set({ isRecording: true, error: null });
    },

    stopRecording: (blob: Blob, duration: number) => {
      const fragment: VideoFragment = {
        id: `fragment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        duration,
        blob,
        tags: [],
        variations: [],
        responses: [],
        ratings: [],
        metadata: {
          mood: 'reflective',
          energy: 5,
          clarity: 5,
          keywords: []
        }
      };

      set({ 
        isRecording: false, 
        currentFragment: fragment 
      });
    },

    saveFragment: async (fragment: VideoFragment) => {
      set({ isLoading: true, error: null });
      
      try {
        await dbManager.saveFragment(fragment);
        
        set(state => ({
          fragments: [...state.fragments, fragment],
          currentFragment: null,
          isLoading: false
        }));

        // Add to current session if active
        const { currentSession } = get();
        if (currentSession) {
          const updatedSession = {
            ...currentSession,
            fragments: [...currentSession.fragments, fragment.id]
          };
          await dbManager.saveSession(updatedSession);
          set({ currentSession: updatedSession });
        }

      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to save fragment',
          isLoading: false 
        });
      }
    },

    loadFragments: async () => {
      set({ isLoading: true, error: null });
      
      try {
        await dbManager.init();
        const fragments = await dbManager.getAllFragments();
        set({ fragments, isLoading: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load fragments',
          isLoading: false 
        });
      }
    },

    selectFragment: (fragment: VideoFragment | null) => {
      set({ selectedFragment: fragment });
    },

    addFragmentTag: async (fragmentId: string, tag: EmotionTag) => {
      set({ isLoading: true, error: null });
      
      try {
        const { fragments } = get();
        const fragmentIndex = fragments.findIndex(f => f.id === fragmentId);
        
        if (fragmentIndex === -1) {
          throw new Error('Fragment not found');
        }

        const updatedFragment = {
          ...fragments[fragmentIndex],
          tags: [...fragments[fragmentIndex].tags, tag]
        };

        await dbManager.saveFragment(updatedFragment);

        set(state => ({
          fragments: state.fragments.map((f, i) => 
            i === fragmentIndex ? updatedFragment : f
          ),
          isLoading: false
        }));

      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to add tag',
          isLoading: false 
        });
      }
    },

    rateFragment: async (fragmentId: string, helpful: boolean, resonance: number, context?: string) => {
      set({ isLoading: true, error: null });
      
      try {
        const { fragments } = get();
        const fragmentIndex = fragments.findIndex(f => f.id === fragmentId);
        
        if (fragmentIndex === -1) {
          throw new Error('Fragment not found');
        }

        const rating = {
          id: `rating-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fragmentId,
          helpful,
          resonance,
          timestamp: Date.now(),
          context
        };

        const updatedFragment = {
          ...fragments[fragmentIndex],
          ratings: [...fragments[fragmentIndex].ratings, rating]
        };

        await dbManager.saveFragment(updatedFragment);

        set(state => ({
          fragments: state.fragments.map((f, i) => 
            i === fragmentIndex ? updatedFragment : f
          ),
          isLoading: false
        }));

      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to rate fragment',
          isLoading: false 
        });
      }
    },

    createVariation: async (fragmentId: string, filterType: FilterType, blob: Blob) => {
      set({ isLoading: true, error: null });
      
      try {
        const { fragments } = get();
        const fragmentIndex = fragments.findIndex(f => f.id === fragmentId);
        
        if (fragmentIndex === -1) {
          throw new Error('Fragment not found');
        }

        const variation = {
          id: `variation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          parentId: fragmentId,
          filterType,
          filterSettings: {},
          blob,
          timestamp: Date.now()
        };

        const updatedFragment = {
          ...fragments[fragmentIndex],
          variations: [...fragments[fragmentIndex].variations, variation]
        };

        await dbManager.saveFragment(updatedFragment);

        set(state => ({
          fragments: state.fragments.map((f, i) => 
            i === fragmentIndex ? updatedFragment : f
          ),
          isLoading: false
        }));

      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create variation',
          isLoading: false 
        });
      }
    },

    addResponse: async (fragmentId: string, blob: Blob, responseType: 'answer' | 'continuation' | 'challenge', notes?: string) => {
      set({ isLoading: true, error: null });
      
      try {
        const { fragments } = get();
        const fragmentIndex = fragments.findIndex(f => f.id === fragmentId);
        
        if (fragmentIndex === -1) {
          throw new Error('Fragment not found');
        }

        const response = {
          id: `response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          parentId: fragmentId,
          blob,
          timestamp: Date.now(),
          responseType,
          notes
        };

        const updatedFragment = {
          ...fragments[fragmentIndex],
          responses: [...fragments[fragmentIndex].responses, response]
        };

        await dbManager.saveFragment(updatedFragment);

        set(state => ({
          fragments: state.fragments.map((f, i) => 
            i === fragmentIndex ? updatedFragment : f
          ),
          isLoading: false
        }));

      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to add response',
          isLoading: false 
        });
      }
    },

    startSession: (theme?: string) => {
      const session: ReflectionSession = {
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startTime: Date.now(),
        fragments: [],
        theme,
        insights: [],
        patterns: []
      };

      set({ currentSession: session });
    },

    endSession: async (insights: string[]) => {
      const { currentSession } = get();
      if (!currentSession) return;

      set({ isLoading: true, error: null });
      
      try {
        const completedSession = {
          ...currentSession,
          endTime: Date.now(),
          insights
        };

        await dbManager.saveSession(completedSession);
        set({ currentSession: null, isLoading: false });

      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to end session',
          isLoading: false 
        });
      }
    },

    analyzePatterns: async () => {
      set({ isLoading: true, error: null });
      
      try {
        const { fragments } = get();
        const insights = patternEngine.analyzeEmotionalPatterns(fragments);
        
        // Save patterns to database
        await Promise.all(insights.map(insight => dbManager.savePattern(insight)));
        
        set({ patterns: insights, isLoading: false });

      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to analyze patterns',
          isLoading: false 
        });
      }
    },

    generateRecommendations: async (currentMood: string) => {
      set({ isLoading: true, error: null });
      
      try {
        const { fragments, patterns } = get();
        const recommendations = patternEngine.generateRecommendations(currentMood, fragments, patterns);
        
        set({ recommendations, isLoading: false });

      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to generate recommendations',
          isLoading: false 
        });
      }
    },

    setCurrentView: (view: 'record' | 'library' | 'reflect' | 'patterns') => {
      set({ currentView: view });
    },

    deleteFragment: async (fragmentId: string) => {
      set({ isLoading: true, error: null });
      
      try {
        await dbManager.deleteFragment(fragmentId);
        
        set(state => ({
          fragments: state.fragments.filter(f => f.id !== fragmentId),
          selectedFragment: state.selectedFragment?.id === fragmentId ? null : state.selectedFragment,
          isLoading: false
        }));

      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete fragment',
          isLoading: false 
        });
      }
    },

    clearError: () => {
      set({ error: null });
    }
  }))
);

// Initialize the store by loading fragments on first use
let initialized = false;
export const initializeReflectionStore = async () => {
  if (!initialized) {
    initialized = true;
    await useReflection.getState().loadFragments();
  }
};
