# Self-Mirroring System

## Overview

This is a comprehensive self-reflection application that enables users to record video fragments, analyze patterns, and gain insights through an interactive mirroring system. The application combines video recording capabilities with 3D visualizations, emotion tagging, pattern recognition, and AI-powered recommendations to create a personal growth platform.

## System Architecture

The application follows a full-stack architecture with clear separation between client and server components:

- **Frontend**: React + TypeScript with Vite for development
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **3D Graphics**: Three.js via React Three Fiber
- **UI Components**: Radix UI with Tailwind CSS
- **State Management**: Zustand for client-side state
- **Data Storage**: IndexedDB for local video storage

## Key Components

### Frontend Architecture

The client-side application is built with modern React patterns:

- **Component Structure**: Modular components in `client/src/components/`
- **State Management**: Zustand stores for game state, audio, and reflection data
- **3D Rendering**: React Three Fiber for WebGL-based visualizations
- **Video Processing**: Custom video recording and filtering system
- **Local Storage**: IndexedDB for offline-first video fragment storage

### Backend Architecture

The server provides a minimal API layer:

- **Express Server**: Lightweight REST API with middleware support
- **Storage Interface**: Abstracted storage layer with in-memory implementation
- **Development Setup**: Vite integration for hot reloading
- **Authentication Ready**: User schema prepared for auth implementation

### Data Models

The application centers around video fragments and user reflection:

- **VideoFragment**: Core entity containing video blob, metadata, emotions, and variations
- **EmotionTag**: Sentiment analysis with intensity and confidence scores
- **PatternInsight**: AI-generated insights from fragment analysis
- **ReflectionSession**: Structured reflection periods with themes and outcomes

## Data Flow

1. **Recording Phase**: User records video fragments via WebRTC
2. **Processing**: Fragments are stored locally with metadata extraction
3. **Tagging**: Emotions and moods are tagged manually or automatically
4. **Analysis**: Pattern recognition engine analyzes emotional trends
5. **Reflection**: AI generates personalized recommendations and insights
6. **Visualization**: 3D components render patterns and growth trends

## External Dependencies

### Core Dependencies
- **React Three Fiber**: 3D scene management and WebGL rendering
- **Radix UI**: Accessible component primitives
- **Drizzle ORM**: Type-safe database operations
- **Zustand**: Lightweight state management
- **TanStack Query**: Server state management

### Database Integration
- **PostgreSQL**: Primary database via Neon serverless
- **Drizzle Kit**: Schema migrations and database tooling

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire stack
- **Tailwind CSS**: Utility-first styling

## Deployment Strategy

The application is configured for Replit deployment:

- **Build Process**: Vite builds client, esbuild bundles server
- **Production Setup**: Node.js server serves static assets
- **Environment Variables**: Database URL required for PostgreSQL connection
- **Port Configuration**: Server runs on port 5000 with external access

### Development Workflow
1. `npm run dev` - Start development server with hot reloading
2. `npm run build` - Build for production
3. `npm run start` - Run production server
4. `npm run db:push` - Apply database schema changes

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 14, 2025. Initial setup
- June 14, 2025. Fixed video recording issues: Added live camera preview during recording, implemented replay functionality for preview playback, and improved video stream management