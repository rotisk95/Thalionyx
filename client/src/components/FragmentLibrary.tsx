import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Calendar, 
  Filter, 
  Play, 
  Star, 
  MessageSquare, 
  Palette,
  Trash2,
  MoreVertical,
  Clock
} from 'lucide-react';
import { VideoFragment, EmotionType, MoodType } from '@/types/reflection';
import { VideoPlayer } from './VideoPlayer';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FragmentLibraryProps {
  fragments: VideoFragment[];
  selectedFragment: VideoFragment | null;
  onFragmentSelect: (fragment: VideoFragment) => void;
  onFragmentDelete: (fragmentId: string) => void;
  onCreateResponse: (fragment: VideoFragment) => void;
  onCreateVariation: (fragment: VideoFragment) => void;
  className?: string;
}

type SortOption = 'newest' | 'oldest' | 'rating' | 'duration' | 'emotion';
type FilterOption = 'all' | EmotionType | MoodType;

export function FragmentLibrary({
  fragments,
  selectedFragment,
  onFragmentSelect,
  onFragmentDelete,
  onCreateResponse,
  onCreateVariation,
  className
}: FragmentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort fragments
  const filteredAndSortedFragments = useMemo(() => {
    let filtered = fragments;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = fragments.filter(fragment => 
        fragment.title?.toLowerCase().includes(query) ||
        fragment.notes?.toLowerCase().includes(query) ||
        fragment.metadata.keywords.some(keyword => 
          keyword.toLowerCase().includes(query)
        ) ||
        fragment.tags.some(tag => 
          tag.emotion.toLowerCase().includes(query)
        )
      );
    }

    // Apply emotion/mood filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(fragment => 
        fragment.tags.some(tag => tag.emotion === filterBy) ||
        fragment.metadata.mood === filterBy
      );
    }

    // Sort fragments
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.timestamp - a.timestamp;
        case 'oldest':
          return a.timestamp - b.timestamp;
        case 'rating':
          const avgRatingA = a.ratings.length > 0 
            ? a.ratings.reduce((sum, r) => sum + r.resonance, 0) / a.ratings.length 
            : 0;
          const avgRatingB = b.ratings.length > 0 
            ? b.ratings.reduce((sum, r) => sum + r.resonance, 0) / b.ratings.length 
            : 0;
          return avgRatingB - avgRatingA;
        case 'duration':
          return b.duration - a.duration;
        case 'emotion':
          const emotionA = a.tags.length > 0 ? a.tags[0].emotion : 'zzz';
          const emotionB = b.tags.length > 0 ? b.tags[0].emotion : 'zzz';
          return emotionA.localeCompare(emotionB);
        default:
          return 0;
      }
    });

    return sorted;
  }, [fragments, searchQuery, sortBy, filterBy]);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getAverageRating = (fragment: VideoFragment): number => {
    if (fragment.ratings.length === 0) return 0;
    return fragment.ratings.reduce((sum, r) => sum + r.resonance, 0) / fragment.ratings.length;
  };

  const getDominantEmotion = (fragment: VideoFragment): string => {
    if (fragment.tags.length === 0) return '';
    const dominant = fragment.tags.reduce((max, tag) => 
      tag.intensity > max.intensity ? tag : max
    );
    return dominant.emotion;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Fragment Library ({filteredAndSortedFragments.length})
            </CardTitle>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search fragments by title, notes, keywords, or emotions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-2 block">Sort by</label>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="duration">Longest Duration</SelectItem>
                    <SelectItem value="emotion">By Emotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Filter by</label>
                <Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterOption)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fragments</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="happy">Happy</SelectItem>
                    <SelectItem value="anxious">Anxious</SelectItem>
                    <SelectItem value="sad">Sad</SelectItem>
                    <SelectItem value="motivated">Motivated</SelectItem>
                    <SelectItem value="reflective">Reflective</SelectItem>
                    <SelectItem value="questioning">Questioning</SelectItem>
                    <SelectItem value="supportive">Supportive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fragment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedFragments.map((fragment) => (
          <Card 
            key={fragment.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              selectedFragment?.id === fragment.id && "ring-2 ring-primary"
            )}
            onClick={() => onFragmentSelect(fragment)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <h3 className="font-medium text-sm line-clamp-1">
                    {fragment.title || `Fragment ${fragment.id.slice(-8)}`}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatDate(fragment.timestamp)}
                    
                    <Clock className="w-3 h-3 ml-2" />
                    {formatDuration(fragment.duration)}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onCreateResponse(fragment);
                    }}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Create Response
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onCreateVariation(fragment);
                    }}>
                      <Palette className="w-4 h-4 mr-2" />
                      Create Variation
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        onFragmentDelete(fragment.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Video Preview */}
              <div className="aspect-video bg-black rounded-md overflow-hidden relative group">
                <video 
                  src={URL.createObjectURL(fragment.blob)}
                  className="w-full h-full object-cover"
                  muted
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Fragment Info */}
              <div className="space-y-2">
                {/* Emotions */}
                {fragment.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {fragment.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag.emotion} ({tag.intensity})
                      </Badge>
                    ))}
                    {fragment.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{fragment.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Mood and Rating */}
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="outline" className="text-xs">
                    {fragment.metadata.mood}
                  </Badge>
                  
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span>{getAverageRating(fragment).toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({fragment.ratings.length})
                    </span>
                  </div>
                </div>

                {/* Notes Preview */}
                {fragment.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {fragment.notes}
                  </p>
                )}

                {/* Variations and Responses */}
                {(fragment.variations.length > 0 || fragment.responses.length > 0) && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {fragment.variations.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Palette className="w-3 h-3" />
                        {fragment.variations.length} variations
                      </div>
                    )}
                    {fragment.responses.length > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {fragment.responses.length} responses
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedFragments.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery || filterBy !== 'all' ? 'No fragments found' : 'No fragments yet'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || filterBy !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start by recording your first self-reflection fragment'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Fragment Player */}
      {selectedFragment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {selectedFragment.title || `Fragment ${selectedFragment.id.slice(-8)}`}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => onFragmentSelect(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-4">
              <VideoPlayer 
                fragment={selectedFragment}
                showControls={true}
                onFilterApplied={(filterType, blob) => {
                  console.log('Filter applied:', filterType);
                  // Handle filter application
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
