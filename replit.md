# SatStream - Bitcoin Social Media Platform

## Overview

SatStream is a full-stack social media platform that integrates real Bitcoin Lightning Network monetization. Users can create posts, tip content creators with satoshis, stream live content, and manage their Bitcoin Lightning wallets. The platform combines traditional social media features with cryptocurrency microtransactions, enabling a creator economy powered by Bitcoin.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for fast development and building
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: React Context for authentication and socket connections, TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live features like chat and streaming

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **File Handling**: Multer for file uploads (images, videos)
- **Real-time Features**: WebSocket server for live streaming and chat functionality

### Database Design
- **Primary Database**: PostgreSQL using Neon serverless database
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Core Tables**:
  - Users table with wallet information and balance tracking
  - Posts table for content with support for text, images, and videos
  - Reactions table for likes and tips (junction table allowing multiple reactions per user)
  - Transactions table for Lightning Network payments and tips
  - Live streams table for streaming sessions with viewer and tip tracking

### Authentication & Authorization
- **Strategy**: JWT tokens stored in localStorage on client-side
- **Password Security**: Bcrypt hashing with configurable salt rounds
- **Session Management**: Custom authentication middleware with token validation
- **Role-based Access**: Admin user privileges for moderation and analytics
- **Security Features**: User banning system and unauthorized request handling

### Lightning Network Integration
- **SDK**: Breez SDK service layer for Lightning Network operations
- **Wallet Management**: Individual wallet IDs for each user with balance tracking in satoshis
- **Payment Features**: 
  - Tip system allowing users to send satoshis to content creators
  - Lightning invoice generation and payment processing
  - Withdrawal system with admin approval workflow
- **Transaction Tracking**: Complete transaction history with sender/receiver relationships

### File Management
- **Upload Strategy**: Local file storage using Multer with configurable size limits (50MB)
- **Content Types**: Support for images and videos with unique filename generation
- **File Organization**: Dedicated uploads directory with timestamp-based naming

### Real-time Features
- **WebSocket Implementation**: Custom WebSocket server for bidirectional communication
- **Live Streaming**: Real-time viewer count tracking and live chat functionality
- **Live Chat**: Message broadcasting with tip notifications
- **Connection Management**: Automatic reconnection and connection state tracking

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18 with TypeScript, React DOM, and development tools
- **Build Tools**: Vite for development server and production builds, ESBuild for server bundling
- **Database**: Neon Database (PostgreSQL) with Drizzle ORM for type-safe database operations

### UI and Styling
- **Component Library**: Extensive Radix UI component collection for accessible primitives
- **Styling**: Tailwind CSS with PostCSS for processing and custom design system
- **Icons**: Lucide React for consistent iconography
- **Utilities**: Class Variance Authority for component variant management

### Backend Services
- **Server Framework**: Express.js with TypeScript support
- **Authentication**: JSON Web Tokens (jsonwebtoken) and bcrypt for secure authentication
- **File Handling**: Multer for multipart form data and file uploads
- **WebSocket**: ws library for real-time communication features

### Lightning Network
- **Breez SDK**: @neondatabase/serverless for Lightning Network wallet operations
- **Bitcoin Integration**: Custom service layer wrapping Breez SDK for payment processing

### Development Tools
- **TypeScript**: Full TypeScript support with strict configuration
- **Development**: Replit-specific plugins for error handling and development workflow
- **Form Handling**: React Hook Form with Zod validation resolvers
- **State Management**: TanStack React Query for server state and caching

### Database and ORM
- **Database**: PostgreSQL via Neon Database with connection pooling
- **ORM**: Drizzle ORM with Drizzle Kit for schema management and migrations
- **Type Safety**: Generated TypeScript types from database schema

### Real-time Communication
- **WebSocket Server**: Native WebSocket implementation for live features
- **Socket Management**: Custom context providers for connection state management