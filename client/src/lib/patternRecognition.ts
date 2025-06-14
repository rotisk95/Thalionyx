import { VideoFragment, EmotionTag, PatternInsight, RecommendationMatch } from '@/types/reflection';

export class PatternRecognitionEngine {
  
  /**
   * Analyze emotional patterns across fragments
   */
  analyzeEmotionalPatterns(fragments: VideoFragment[]): PatternInsight[] {
    const insights: PatternInsight[] = [];
    
    // Sort fragments by timestamp
    const sortedFragments = [...fragments].sort((a, b) => a.timestamp - b.timestamp);
    
    // Detect emotional cycles
    const cyclicPatterns = this.detectEmotionalCycles(sortedFragments);
    insights.push(...cyclicPatterns);
    
    // Detect trigger patterns
    const triggerPatterns = this.detectTriggerPatterns(sortedFragments);
    insights.push(...triggerPatterns);
    
    // Detect growth trends
    const growthTrends = this.detectGrowthTrends(sortedFragments);
    insights.push(...growthTrends);
    
    // Detect resonance clusters
    const resonanceClusters = this.detectResonanceClusters(fragments);
    insights.push(...resonanceClusters);
    
    return insights;
  }

  private detectEmotionalCycles(fragments: VideoFragment[]): PatternInsight[] {
    const insights: PatternInsight[] = [];
    const emotionSequences: Array<{emotion: string, timestamp: number, fragmentId: string}> = [];
    
    // Extract dominant emotions from each fragment
    fragments.forEach(fragment => {
      if (fragment.tags.length > 0) {
        const dominantEmotion = fragment.tags.reduce((max, tag) => 
          tag.intensity > max.intensity ? tag : max
        );
        emotionSequences.push({
          emotion: dominantEmotion.emotion,
          timestamp: fragment.timestamp,
          fragmentId: fragment.id
        });
      }
    });
    
    // Look for repeating patterns (minimum 3 occurrences)
    const emotionCycles = new Map<string, number>();
    const patternLength = 3;
    
    for (let i = 0; i <= emotionSequences.length - patternLength; i++) {
      const pattern = emotionSequences
        .slice(i, i + patternLength)
        .map(seq => seq.emotion)
        .join('-');
      
      emotionCycles.set(pattern, (emotionCycles.get(pattern) || 0) + 1);
    }
    
    // Identify significant cycles (appearing more than twice)
    emotionCycles.forEach((count, pattern) => {
      if (count >= 2) {
        const relatedFragments = emotionSequences
          .filter(seq => pattern.includes(seq.emotion))
          .map(seq => seq.fragmentId);
        
        insights.push({
          id: `cycle-${Date.now()}-${Math.random()}`,
          type: 'emotional_cycle',
          description: `Recurring emotional pattern: ${pattern.replace(/-/g, ' → ')}`,
          confidence: Math.min(count / fragments.length, 0.9),
          relatedFragments,
          timestamp: Date.now()
        });
      }
    });
    
    return insights;
  }

  private detectTriggerPatterns(fragments: VideoFragment[]): PatternInsight[] {
    const insights: PatternInsight[] = [];
    const emotionTransitions: Array<{
      from: string,
      to: string,
      timeDiff: number,
      fragmentIds: [string, string]
    }> = [];
    
    // Analyze emotion transitions between consecutive fragments
    for (let i = 0; i < fragments.length - 1; i++) {
      const current = fragments[i];
      const next = fragments[i + 1];
      
      if (current.tags.length > 0 && next.tags.length > 0) {
        const currentEmotion = current.tags.reduce((max, tag) => 
          tag.intensity > max.intensity ? tag : max
        );
        const nextEmotion = next.tags.reduce((max, tag) => 
          tag.intensity > max.intensity ? tag : max
        );
        
        if (currentEmotion.emotion !== nextEmotion.emotion) {
          emotionTransitions.push({
            from: currentEmotion.emotion,
            to: nextEmotion.emotion,
            timeDiff: next.timestamp - current.timestamp,
            fragmentIds: [current.id, next.id]
          });
        }
      }
    }
    
    // Group similar transitions
    const transitionGroups = new Map<string, typeof emotionTransitions>();
    emotionTransitions.forEach(transition => {
      const key = `${transition.from}->${transition.to}`;
      if (!transitionGroups.has(key)) {
        transitionGroups.set(key, []);
      }
      transitionGroups.get(key)!.push(transition);
    });
    
    // Identify frequent triggers
    transitionGroups.forEach((transitions, key) => {
      if (transitions.length >= 2) {
        const avgTimeDiff = transitions.reduce((sum, t) => sum + t.timeDiff, 0) / transitions.length;
        const relatedFragments = transitions.flatMap(t => t.fragmentIds);
        
        insights.push({
          id: `trigger-${Date.now()}-${Math.random()}`,
          type: 'trigger_pattern',
          description: `Frequent emotional shift: ${key} (avg ${Math.round(avgTimeDiff / 60000)} minutes apart)`,
          confidence: Math.min(transitions.length / 5, 0.8),
          relatedFragments,
          timestamp: Date.now()
        });
      }
    });
    
    return insights;
  }

  private detectGrowthTrends(fragments: VideoFragment[]): PatternInsight[] {
    const insights: PatternInsight[] = [];
    
    if (fragments.length < 5) return insights; // Need sufficient data
    
    // Analyze clarity and energy trends over time
    const clarityTrend = this.calculateTrend(fragments.map(f => f.metadata.clarity));
    const energyTrend = this.calculateTrend(fragments.map(f => f.metadata.energy));
    
    if (clarityTrend.slope > 0.1) {
      insights.push({
        id: `growth-clarity-${Date.now()}`,
        type: 'growth_trend',
        description: `Increasing self-clarity over time (${clarityTrend.slope.toFixed(2)} improvement rate)`,
        confidence: clarityTrend.correlation,
        relatedFragments: fragments.map(f => f.id),
        timestamp: Date.now()
      });
    }
    
    if (energyTrend.slope > 0.1) {
      insights.push({
        id: `growth-energy-${Date.now()}`,
        type: 'growth_trend',
        description: `Increasing energy levels over time (${energyTrend.slope.toFixed(2)} improvement rate)`,
        confidence: energyTrend.correlation,
        relatedFragments: fragments.map(f => f.id),
        timestamp: Date.now()
      });
    }
    
    return insights;
  }

  private calculateTrend(values: number[]): { slope: number, correlation: number } {
    if (values.length < 2) return { slope: 0, correlation: 0 };
    
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = values.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denominatorX = 0;
    let denominatorY = 0;
    
    for (let i = 0; i < n; i++) {
      const deltaX = x[i] - meanX;
      const deltaY = values[i] - meanY;
      numerator += deltaX * deltaY;
      denominatorX += deltaX * deltaX;
      denominatorY += deltaY * deltaY;
    }
    
    const slope = denominatorX !== 0 ? numerator / denominatorX : 0;
    const correlation = Math.abs(numerator / Math.sqrt(denominatorX * denominatorY)) || 0;
    
    return { slope, correlation };
  }

  private detectResonanceClusters(fragments: VideoFragment[]): PatternInsight[] {
    const insights: PatternInsight[] = [];
    
    // Group fragments by high ratings (4-5 stars)
    const highRatedFragments = fragments.filter(fragment => {
      const avgRating = fragment.ratings.length > 0 
        ? fragment.ratings.reduce((sum, r) => sum + r.resonance, 0) / fragment.ratings.length
        : 0;
      return avgRating >= 4;
    });
    
    if (highRatedFragments.length >= 3) {
      // Find common themes in high-rated fragments
      const commonEmotions = this.findCommonEmotions(highRatedFragments);
      const commonMoods = this.findCommonMoods(highRatedFragments);
      
      if (commonEmotions.length > 0) {
        insights.push({
          id: `resonance-emotions-${Date.now()}`,
          type: 'resonance_cluster',
          description: `Strong resonance with ${commonEmotions.join(', ')} emotional states`,
          confidence: 0.8,
          relatedFragments: highRatedFragments.map(f => f.id),
          timestamp: Date.now()
        });
      }
      
      if (commonMoods.length > 0) {
        insights.push({
          id: `resonance-moods-${Date.now()}`,
          type: 'resonance_cluster',
          description: `Consistent positive response to ${commonMoods.join(', ')} moods`,
          confidence: 0.7,
          relatedFragments: highRatedFragments.map(f => f.id),
          timestamp: Date.now()
        });
      }
    }
    
    return insights;
  }

  private findCommonEmotions(fragments: VideoFragment[]): string[] {
    const emotionCounts = new Map<string, number>();
    
    fragments.forEach(fragment => {
      fragment.tags.forEach(tag => {
        emotionCounts.set(tag.emotion, (emotionCounts.get(tag.emotion) || 0) + 1);
      });
    });
    
    const threshold = Math.ceil(fragments.length * 0.6); // Appear in 60% of fragments
    return Array.from(emotionCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([emotion, _]) => emotion);
  }

  private findCommonMoods(fragments: VideoFragment[]): string[] {
    const moodCounts = new Map<string, number>();
    
    fragments.forEach(fragment => {
      const mood = fragment.metadata.mood;
      moodCounts.set(mood, (moodCounts.get(mood) || 0) + 1);
    });
    
    const threshold = Math.ceil(fragments.length * 0.5); // Appear in 50% of fragments
    return Array.from(moodCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([mood, _]) => mood);
  }

  /**
   * Generate recommendations based on current mood and past patterns
   */
  generateRecommendations(
    currentMood: string,
    fragments: VideoFragment[],
    patterns: PatternInsight[]
  ): RecommendationMatch[] {
    const recommendations: RecommendationMatch[] = [];
    
    // Mood-based matching
    const moodMatches = fragments
      .filter(f => f.metadata.mood === currentMood && f.ratings.some(r => r.helpful))
      .map(f => ({
        fragmentId: f.id,
        score: this.calculateMoodScore(f),
        reason: `Matches your current ${currentMood} mood and has been helpful before`,
        type: 'mood_match' as const
      }));
    
    recommendations.push(...moodMatches);
    
    // Pattern completion recommendations
    const patternMatches = this.findPatternCompletions(currentMood, fragments, patterns);
    recommendations.push(...patternMatches);
    
    // Contrast learning (opposite emotions that have been helpful)
    const contrastMatches = this.findContrastLearning(currentMood, fragments);
    recommendations.push(...contrastMatches);
    
    // Growth opportunity recommendations
    const growthMatches = this.findGrowthOpportunities(fragments, patterns);
    recommendations.push(...growthMatches);
    
    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private calculateMoodScore(fragment: VideoFragment): number {
    const avgRating = fragment.ratings.length > 0
      ? fragment.ratings.reduce((sum, r) => sum + r.resonance, 0) / fragment.ratings.length
      : 3;
    
    const helpfulCount = fragment.ratings.filter(r => r.helpful).length;
    const recency = Math.max(0, 1 - (Date.now() - fragment.timestamp) / (30 * 24 * 60 * 60 * 1000)); // Decay over 30 days
    
    return (avgRating / 5) * 0.4 + (helpfulCount / Math.max(fragment.ratings.length, 1)) * 0.4 + recency * 0.2;
  }

  private findPatternCompletions(
    currentMood: string,
    fragments: VideoFragment[],
    patterns: PatternInsight[]
  ): RecommendationMatch[] {
    const matches: RecommendationMatch[] = [];
    
    patterns.forEach(pattern => {
      if (pattern.type === 'emotional_cycle' && pattern.confidence > 0.6) {
        // Find fragments that typically follow the current state in this pattern
        const relatedFragments = fragments.filter(f => 
          pattern.relatedFragments.includes(f.id) && 
          f.ratings.some(r => r.helpful)
        );
        
        relatedFragments.forEach(fragment => {
          matches.push({
            fragmentId: fragment.id,
            score: pattern.confidence * 0.8,
            reason: `Part of a recognized emotional pattern: ${pattern.description}`,
            type: 'pattern_completion'
          });
        });
      }
    });
    
    return matches;
  }

  private findContrastLearning(currentMood: string, fragments: VideoFragment[]): RecommendationMatch[] {
    const emotionOpposites: Record<string, string[]> = {
      'anxious': ['calm', 'peaceful'],
      'sad': ['happy', 'hopeful'],
      'angry': ['calm', 'peaceful'],
      'confused': ['confident', 'clear'],
      'overwhelmed': ['calm', 'focused'],
      'frustrated': ['patient', 'understanding'],
      'lonely': ['connected', 'grateful']
    };
    
    const oppositeEmotions = emotionOpposites[currentMood] || [];
    if (oppositeEmotions.length === 0) return [];
    
    return fragments
      .filter(f => {
        const hasOppositeEmotion = f.tags.some(tag => 
          oppositeEmotions.includes(tag.emotion) && tag.intensity >= 6
        );
        const hasPositiveRating = f.ratings.some(r => r.helpful && r.resonance >= 4);
        return hasOppositeEmotion && hasPositiveRating;
      })
      .map(f => ({
        fragmentId: f.id,
        score: 0.7,
        reason: `Offers a contrasting perspective that has been helpful in the past`,
        type: 'contrast_learning' as const
      }));
  }

  private findGrowthOpportunities(
    fragments: VideoFragment[],
    patterns: PatternInsight[]
  ): RecommendationMatch[] {
    const matches: RecommendationMatch[] = [];
    
    // Find fragments with high clarity or energy that could inspire growth
    const inspirationalFragments = fragments
      .filter(f => 
        (f.metadata.clarity >= 8 || f.metadata.energy >= 8) &&
        f.ratings.some(r => r.helpful)
      )
      .sort((a, b) => (b.metadata.clarity + b.metadata.energy) - (a.metadata.clarity + a.metadata.energy))
      .slice(0, 3);
    
    inspirationalFragments.forEach(fragment => {
      matches.push({
        fragmentId: fragment.id,
        score: 0.6,
        reason: `High clarity/energy fragment that could inspire growth`,
        type: 'growth_opportunity'
      });
    });
    
    return matches;
  }

  /**
   * Analyze the effectiveness of recommendations based on user feedback
   */
  analyzeRecommendationEffectiveness(
    recommendations: RecommendationMatch[],
    userFeedback: Array<{ fragmentId: string, helpful: boolean, resonance: number }>
  ): void {
    // This would be used to improve the recommendation algorithm over time
    // For now, we'll just log the effectiveness
    const effectiveness = userFeedback.reduce((acc, feedback) => {
      const recommendation = recommendations.find(r => r.fragmentId === feedback.fragmentId);
      if (recommendation) {
        acc[recommendation.type] = acc[recommendation.type] || { helpful: 0, total: 0 };
        acc[recommendation.type].total++;
        if (feedback.helpful) {
          acc[recommendation.type].helpful++;
        }
      }
      return acc;
    }, {} as Record<string, { helpful: number, total: number }>);
    
    console.log('Recommendation effectiveness:', effectiveness);
  }
}

export const patternEngine = new PatternRecognitionEngine();
