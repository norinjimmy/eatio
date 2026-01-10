# MealPlanner App

## Overview

A mobile-friendly meal planning application built with React and Express. The app helps families plan weekly meals, manage recipes, and generate grocery lists. It features bilingual support (Swedish/English), with Swedish as the default language. The application uses a PostgreSQL database for persistent storage and follows a full-stack architecture with a React frontend and Express backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: React Context API via custom `StoreProvider` for global state (meals, recipes, grocery items)
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming, supporting dark mode
- **Internationalization**: Custom i18n implementation with `LanguageProvider` context supporting Swedish and English

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schema validation
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (connection via `DATABASE_URL` environment variable)

### Data Models
The application manages three primary entities defined in `shared/schema.ts`:
1. **Recipes**: Name, URL, ingredients array, instructions, favorite status, usage count
2. **Meals**: Day of week, meal type (lunch/dinner), name, optional notes, optional recipe link
3. **Grocery Items**: Name, bought status, custom flag (manually added vs generated)

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components including Shadcn components
    pages/        # Route pages (Home, WeeklyPlan, Recipes, GroceryList, Favorites)
    lib/          # Utilities, store context, i18n, query client
    hooks/        # Custom React hooks
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route handlers
  storage.ts      # Database storage layer
  db.ts           # Database connection
shared/           # Shared code between frontend and backend
  schema.ts       # Drizzle database schema and Zod validation
  routes.ts       # API route definitions with types
```

### Build System
- Development: `tsx` for running TypeScript directly
- Production: Custom build script using Vite for frontend and esbuild for backend bundling
- Database migrations: Drizzle Kit with `db:push` command

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database toolkit with type-safe queries
- **connect-pg-simple**: Session store for Express (available but sessions not currently implemented)

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **Radix UI**: Headless UI component primitives (dialog, dropdown, toast, etc.)
- **Tailwind CSS**: Utility-first CSS framework
- **lucide-react**: Icon library
- **uuid**: Generating unique identifiers
- **date-fns**: Date manipulation utilities
- **embla-carousel-react**: Carousel component
- **react-day-picker**: Calendar date picker

### Backend Libraries
- **Express**: HTTP server framework
- **Zod**: Runtime schema validation
- **drizzle-zod**: Integration between Drizzle and Zod for schema generation

### Development Tools
- **Vite**: Frontend build tool with HMR
- **TypeScript**: Type checking across the full stack
- **@replit/vite-plugin-***: Replit-specific development plugins