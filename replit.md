# Photography Studio Management System

## Overview

This is a comprehensive Photography Studio Management System built as a multi-tenant web application. The system allows photography studios to manage events, clients, tasks, payments, and team members through a modern, responsive interface with automatic Google Sheets integration for data synchronization.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom design system using neutral color palette
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **State Management**: TanStack React Query for server state and Context API for authentication
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod schema validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Session-based authentication with role-based access control
- **API Design**: RESTful API endpoints with consistent error handling

### Database Schema Design
- **Multi-tenant Architecture**: Firm-based data isolation
- **Role-based Access**: Admin, Photographer, Videographer, Editor roles
- **Core Entities**: Firms, Users, Clients, Events, Tasks, Payments, Expenses, Activity Logs
- **Relationship Management**: Proper foreign key constraints and data integrity

## Key Components

### Authentication & Authorization
- **Multi-firm PIN-based authentication**: Each studio has a unique PIN for access
- **Role-based permissions**: Granular access control based on user roles
- **Session management**: Secure session handling with proper token management
- **Profile management**: User profiles with firm associations

### Event Management
- **Event creation and tracking**: Comprehensive event lifecycle management
- **Client association**: Events linked to client records
- **Status tracking**: Real-time event status updates
- **Payment integration**: Direct payment recording linked to events

### Task Management
- **Task assignment**: Assign tasks to team members with due dates
- **Status tracking**: Task progress monitoring with completion tracking
- **Event-based tasks**: Tasks can be associated with specific events
- **Priority management**: Task prioritization and deadline management

### Financial Management
- **Payment tracking**: Record and track all incoming payments
- **Expense management**: Track business expenses with categorization
- **Financial reporting**: Real-time calculations for revenue, expenses, and profit
- **Client payment status**: Track pending and completed payments

### Team Management
- **User roles**: Multiple role types with different permissions
- **Activity logging**: Track all user actions and system events
- **Team performance**: Monitor task completion and productivity

## Data Flow

### Request/Response Flow
1. Client requests go through Express middleware for logging and error handling
2. Authentication middleware validates user sessions and firm access
3. Route handlers process requests using Drizzle ORM for database operations
4. Responses include proper error handling and JSON formatting

### State Management Flow
1. React Query manages server state with automatic caching and synchronization
2. Authentication context provides global user and firm state
3. Form state managed by React Hook Form with Zod validation
4. UI state managed by React hooks and context when needed

### Database Operations
1. All database operations use Drizzle ORM with type-safe queries
2. Multi-tenant data isolation enforced at the query level
3. Transaction support for complex operations
4. Automatic timestamp tracking for audit trails

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon
- **drizzle-orm**: Type-safe ORM with excellent TypeScript support
- **@tanstack/react-query**: Powerful data synchronization for React
- **@hookform/resolvers**: React Hook Form integration with Zod
- **date-fns**: Modern date utility library
- **wouter**: Minimalist routing for React

### UI Dependencies
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **cmdk**: Command palette component

### Development Dependencies
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production builds
- **vite**: Modern build tool with HMR support

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Development database with migrations via Drizzle Kit
- **Environment Variables**: DATABASE_URL for database connection

### Production Build
- **Frontend**: Vite builds optimized React application to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Database**: Production PostgreSQL via Neon with connection pooling
- **Deployment**: Single command deployment with `npm run build && npm start`

### Database Management
- **Migrations**: Drizzle Kit handles schema migrations
- **Schema Location**: `shared/schema.ts` for type sharing between frontend and backend
- **Migration Files**: Generated in `./migrations` directory

## Changelog

```
Changelog:
- July 01, 2025. Initial setup
- July 01, 2025. Migrated from Replit Agent to Replit environment
  • Fixed database connection and authentication flow
  • Resolved signup functionality by removing admin PIN requirement
  • Added PostgreSQL database support with proper migrations
  • Fixed authentication endpoints and session management
  • Added explicit /dashboard route for proper navigation
- July 01, 2025. Enhanced with comprehensive feature set
  • Complete Google Sheets integration with automatic spreadsheet creation
  • Master events spreadsheet with all required columns (SR NO, CLIENT ID, NAME, DATE, EVENT types)
  • Pastel color-coded event types (Wedding, Pre-wedding, Engagement, Birthday, Corporate)
  • Storage disk management (Disk A-Z) with pastel color indicators
  • Complete team management with photographer/videographer/editor roles
  • Enhanced quotations system with direct conversion to events
  • Staff dropdowns for all event assignments with role-based filtering
  • Complete navigation system connecting all major sections
  • Real-time payment tracking and Google Sheets synchronization
  • Comprehensive filtering and search capabilities across all modules
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```