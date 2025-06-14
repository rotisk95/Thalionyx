import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Library, 
  Brain, 
  TrendingUp, 
  Settings,
  Heart,
  Sparkles,
  Moon,
  Sun
} from 'lucide-react';
import { VideoRecorder } from '@/components/VideoRecorder';
import { VideoPlayer } from '@/components/VideoPlayer';
import { EmotionTagger } from '@/components/EmotionTagger';
import { FragmentLibrary } from '@/components/FragmentLibrary';
import { PatternVisualization } from '@/components/PatternVisualization';
import { ReflectionInterface } from '@/components/ReflectionInterface';
import { useReflection, initializeReflectionStore } from '@/lib/stores/useReflection';
import { VideoFragment, EmotionTag, FilterType } from '@/types/reflection';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import '@fontsource/inter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

type ViewType = 'reflect' | 'record' | 'library' | 'patterns';

function AppContent() {
  const {
    fragments,
    selectedFragment,
    currentFragment,
    patterns,
    recommendations,
    currentView,
    isRecording,
    isLoading,
    error,
    startRecording,
    stopRecording,
    saveFragment,
    selectFragment,
    addFragmentTag,
    rateFragment,
    createVariation,
    addResponse,
    analyzePatterns,
    generateRecommendations,
    setCurrentView,
    deleteFragment,
    clearError
  } = useReflection();

  const [isInitialized, setIsInitialized] = useState(false);
  const [showFragmentEditor, setShowFragmentEditor] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize the store on app start
  useEffect(() => {
    const init = async () => {
      try {
        await initializeReflectionStore();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize reflection store:', err);
        toast.error('Failed to initialize app. Please refresh the page.');
      }
    };
    
    init();
  }, []);

  // Show error toasts
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Auto-analyze patterns when fragments change
  useEffect(() => {
    if (fragments.length >= 3 && isInitialized) {
      analyzePatterns();
    }
  }, [fragments.length, isInitialized, analyzePatterns]);

  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    stopRecording(blob, duration);
    setShowFragmentEditor(true);
  };

  const handleSaveFragment = async (fragment: VideoFragment) => {
    try {
      await saveFragment(fragment);
      setShowFragmentEditor(false);
      toast.success('Fragment saved successfully!');
    } catch (err) {
      toast.error('Failed to save fragment');
    }
  };

  const handleFragmentTag = async (fragmentId: string, tag: EmotionTag) => {
    try {
      await addFragmentTag(fragmentId, tag);
      toast.success('Emotion tag added');
    } catch (err) {
      toast.error('Failed to add emotion tag');
    }
  };

  const handleFragmentRating = async (fragmentId: string, helpful: boolean, resonance: number, context?: string) => {
    try {
      await rateFragment(fragmentId, helpful, resonance, context);
      toast.success('Fragment rated');
    } catch (err) {
      toast.error('Failed to rate fragment');
    }
  };

  const handleCreateVariation = async (fragmentId: string, filterType: FilterType, blob: Blob) => {
    try {
      await createVariation(fragmentId, filterType, blob);
      toast.success('Variation created');
    } catch (err) {
      toast.error('Failed to create variation');
    }
  };

  const handleCreateResponse = async (fragment: VideoFragment) => {
    // This would open a recording interface for responses
    toast.info('Response recording coming soon');
  };

  const handleDeleteFragment = async (fragmentId: string) => {
    if (confirm('Are you sure you want to delete this fragment? This action cannot be undone.')) {
      try {
        await deleteFragment(fragmentId);
        toast.success('Fragment deleted');
      } catch (err) {
        toast.error('Failed to delete fragment');
      }
    }
  };

  const navigation = [
    { 
      key: 'reflect' as ViewType, 
      label: 'Reflect', 
      icon: Heart, 
      description: 'Daily reflection and recommendations' 
    },
    { 
      key: 'record' as ViewType, 
      label: 'Record', 
      icon: Video, 
      description: 'Create new reflection fragments' 
    },
    { 
      key: 'library' as ViewType, 
      label: 'Library', 
      icon: Library, 
      description: 'Browse and manage fragments' 
    },
    { 
      key: 'patterns' as ViewType, 
      label: 'Patterns', 
      icon: TrendingUp, 
      description: 'View emotional insights and growth' 
    }
  ];

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold mb-2">Initializing Self-Mirroring System</h2>
            <p className="text-muted-foreground text-sm">Setting up your private reflection space...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-background transition-colors", isDarkMode ? 'dark' : 'light')}>
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Self-Mirroring System</h1>
              </div>
              {fragments.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {fragments.length} fragments
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {patterns.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Brain className="w-3 h-3 mr-1" />
                  {patterns.length} insights
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-73px)]">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-card/30 border-r p-4 hidden md:block">
          <nav className="space-y-2">
            {navigation.map((item) => (
              <Button
                key={item.key}
                variant={currentView === item.key ? "default" : "ghost"}
                className="w-full justify-start h-auto p-3"
                onClick={() => setCurrentView(item.key)}
              >
                <div className="flex items-start gap-3">
                  <item.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </nav>

          {/* Quick Stats */}
          {fragments.length > 0 && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <h3 className="font-medium text-sm mb-3">Your Progress</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fragments</span>
                    <span className="font-medium">{fragments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Insights</span>
                    <span className="font-medium">{patterns.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">This Week</span>
                    <span className="font-medium">
                      {fragments.filter(f => 
                        Date.now() - f.timestamp < 7 * 24 * 60 * 60 * 1000
                      ).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {/* Mobile Navigation */}
          <div className="flex gap-2 mb-6 md:hidden overflow-x-auto pb-2">
            {navigation.map((item) => (
              <Button
                key={item.key}
                variant={currentView === item.key ? "default" : "outline"}
                size="sm"
                className="flex-shrink-0"
                onClick={() => setCurrentView(item.key)}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </div>

          {/* View Content */}
          <div className="max-w-6xl mx-auto">
            {currentView === 'reflect' && (
              <ReflectionInterface
                fragments={fragments}
                patterns={patterns}
                recommendations={recommendations}
                onGenerateRecommendations={generateRecommendations}
                onRateFragment={handleFragmentRating}
                onCreateResponse={handleCreateResponse}
              />
            )}

            {currentView === 'record' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Record Your Reflection</h2>
                  <p className="text-muted-foreground">
                    Capture your thoughts, feelings, and insights in a video fragment
                  </p>
                </div>

                {!showFragmentEditor ? (
                  <VideoRecorder 
                    onRecordingComplete={handleRecordingComplete}
                  />
                ) : currentFragment && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <VideoPlayer 
                      fragment={currentFragment}
                      showControls={true}
                      onFilterApplied={(filterType, blob) => {
                        handleCreateVariation(currentFragment.id, filterType, blob);
                      }}
                    />
                    
                    <EmotionTagger
                      fragment={currentFragment}
                      onTagAdded={(tag) => handleFragmentTag(currentFragment.id, tag)}
                      onMetadataUpdated={(metadata) => {
                        const updatedFragment = {
                          ...currentFragment,
                          metadata: { ...currentFragment.metadata, ...metadata }
                        };
                        handleSaveFragment(updatedFragment);
                      }}
                    />
                  </div>
                )}

                {showFragmentEditor && currentFragment && (
                  <div className="flex justify-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowFragmentEditor(false)}
                    >
                      Record Another
                    </Button>
                    <Button
                      onClick={() => handleSaveFragment(currentFragment)}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save Fragment'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {currentView === 'library' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Fragment Library</h2>
                  <p className="text-muted-foreground">
                    Browse, organize, and interact with your reflection fragments
                  </p>
                </div>

                <FragmentLibrary
                  fragments={fragments}
                  selectedFragment={selectedFragment}
                  onFragmentSelect={selectFragment}
                  onFragmentDelete={handleDeleteFragment}
                  onCreateResponse={handleCreateResponse}
                  onCreateVariation={(fragment) => {
                    toast.info('Select a filter in the video player to create variations');
                    selectFragment(fragment);
                  }}
                />
              </div>
            )}

            {currentView === 'patterns' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Pattern Analysis</h2>
                  <p className="text-muted-foreground">
                    Discover insights and growth patterns from your reflections
                  </p>
                </div>

                <PatternVisualization
                  fragments={fragments}
                  patterns={patterns}
                  onAnalyzePatterns={analyzePatterns}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
