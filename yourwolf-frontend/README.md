# YourWolf Frontend

A React + TypeScript + Vite frontend for the YourWolf customizable One Night Ultimate Werewolf game facilitator.

## Prerequisites

- Node.js 20+
- npm or yarn

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run test:ui` - Run tests with UI interface
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── main.tsx               # React entry point
├── App.tsx                # Root component with Router
├── routes.tsx             # Route definitions
├── vite-env.d.ts          # Vite types
├── components/
│   ├── Layout.tsx         # Main layout wrapper
│   ├── Header.tsx         # App header
│   ├── Sidebar.tsx        # Navigation sidebar
│   └── RoleCard.tsx       # Role display card
├── pages/
│   ├── Home.tsx           # Landing page
│   └── Roles.tsx          # Roles list page
├── hooks/
│   └── useRoles.ts        # Role data hook
├── types/
│   └── role.ts            # TypeScript interfaces
├── styles/
│   ├── theme.ts           # Dark theme config
│   ├── index.css          # Global styles
│   └── App.css            # App-specific styles
└── test/
    └── setup.ts           # Test setup
```

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Vitest** - Testing framework

## Docker

Build and run with Docker:

```bash
docker build -t yourwolf-frontend .
docker run -p 3000:3000 yourwolf-frontend
```

## Theme

The app uses a dark werewolf-themed color palette with team-specific colors:

- **Village**: Forest green (`#4a7c59`)
- **Werewolf**: Dark red (`#8b0000`)
- **Vampire**: Indigo (`#4b0082`)
- **Alien**: Sea green (`#2e8b57`)
- **Neutral**: Dim gray (`#696969`)

## Contributing

1. Follow the Google TypeScript Style Guide (see [AGENTS.md](AGENTS.md))
2. Use functional components with hooks
3. Maintain consistent use of theme colors
4. Write tests for new features
