# Agent Guidelines for quiet-ring-web-app

## Project Structure

This is a **React + TypeScript + Vite** video calling application with two separate projects:

- **Root project** (`/`): Main video calling app (React 18, Stream Video SDK, Tailwind CSS)
- **web-call/**: Minimal video call client (React 19, Stream Video SDK only)

## Build/Lint Commands

### Root Project
```bash
# Development server
npm run dev

# Production build
npm run build

# ESLint (lints .js,.jsx,.ts,.tsx files)
npm run lint

# Preview production build
npm run preview
```

### Web-call Subproject
```bash
cd web-call
npm run dev      # Start dev server
npm run build    # Type check and build
npm run lint     # ESLint linting
npm run preview  # Preview build
```

**Note**: No test runner is currently configured in either project.

## Technology Stack

- **Framework**: React 18 (root) / React 19 (web-call)
- **Build Tool**: Vite 5 (root) / Vite 7 (web-call)
- **Language**: TypeScript 5.x with strict mode enabled
- **Styling**: Tailwind CSS 3.4 with custom brand colors
- **Animation**: Framer Motion
- **Routing**: React Router v7
- **HTTP Client**: Axios with interceptors
- **Video SDK**: Stream Video React SDK
- **Icons**: Lucide React

## Code Style Guidelines

### File Naming
- **Components**: PascalCase (e.g., `LobbyScreen.tsx`, `AuthGuard.tsx`)
- **Services**: PascalCase with `Service` suffix (e.g., `AuthService.ts`)
- **Contexts**: PascalCase with `Context` suffix (e.g., `AuthContext.tsx`)
- **Utils**: camelCase (e.g., `jwtGenerator.ts`, `uuid.ts`)
- **Types/Interfaces**: PascalCase (e.g., `AuthContextType`, `LobbyScreenProps`)

### Component Structure
- Use **named exports** for components: `export function ComponentName()`
- Props interface named with `Props` suffix: `interface LobbyScreenProps { ... }`
- Place component files in `src/components/`
- Keep components focused and single-responsibility

### Services Pattern
- Export as objects with methods, NOT classes:
```typescript
export const ServiceName = {
  async methodName(): Promise<ReturnType> { ... }
};
```
- Place service files in `src/services/`
- Services handle API calls and business logic
- Use try/catch with console.error and fallback strategies

### Imports Ordering
1. React imports
2. Third-party library imports (framer-motion, lucide-react, etc.)
3. SDK imports (@stream-io/video-react-sdk)
4. Absolute imports from project (services, contexts, utils)
5. Relative imports (../components/, ./types)

### TypeScript Conventions
- Use strict mode (enabled in tsconfig.json)
- Prefer `interface` over `type` for object shapes
- Use explicit return types on exported functions
- Use `React.FC<Props>` for component typing (older style in codebase)
- Props interfaces should be defined in the component file

### Error Handling
- Wrap API calls in try/catch blocks
- Log errors with `console.error()` including context
- Provide fallback values or graceful degradation
- For auth errors (401), clear localStorage and redirect

### React Patterns
- Use hooks: `useState`, `useEffect`, `useRef`, `useCallback`, `useContext`
- Custom hooks use camelCase (e.g., `useAuth`)
- Context providers wrap the app in main entry point
- Use `AnimatePresence` from framer-motion for route transitions

### Styling Conventions
- Use Tailwind CSS utility classes
- Custom brand colors defined in `tailwind.config.js`:
  - `brand-orange`: #EA592D
  - `brand-coral`: #FF6B4A
  - `brand-blue`: #334295
- Custom shadows: `shadow-glow`, `shadow-card`
- Use `font-sora` for the Sora font family

### State Management
- React Context for global state (AuthContext)
- localStorage for session persistence
- No Redux or other state libraries

### API Client Pattern
- Use axios interceptors for auth tokens
- Base URL from `import.meta.env.VITE_API_BASE_URL`
- Request interceptor adds Bearer token from localStorage
- Response interceptor handles 401 errors

## ESLint Configuration

Root project uses `.eslintrc.cjs`:
- Extends: eslint:recommended, @typescript-eslint/recommended, react-hooks/recommended
- Plugins: react-refresh
- Ignores: dist/, .eslintrc.cjs

Web-call uses `eslint.config.js` (flat config):
- Uses @eslint/js, typescript-eslint
- Extends: recommended configs for JS, TS, react-hooks, react-refresh

## Environment Variables

Required in `.env`:
```
VITE_API_BASE_URL=http://localhost:8080/api
```

## Key Directories

```
src/
  components/     # React components
  contexts/       # React Context providers
  services/       # API and business logic services
  utils/          # Utility functions
  api/            # Axios client configuration
  index.tsx       # App entry point
```

## Notes

- No test framework configured currently
- Stream Video SDK requires API key (hardcoded in App.tsx)
- Session management uses JWT tokens stored in localStorage
- Camera/microphone permissions handled via Stream SDK
