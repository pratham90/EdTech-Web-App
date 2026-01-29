# Frontend Structure

This document describes the React.js frontend structure following best practices.

## Directory Structure

```
src/
├── app/                    # App-level files (if needed)
│   └── main.jsx           # Entry point
├── features/              # Feature-based organization
│   ├── auth/
│   │   ├── components/
│   │   │   └── AuthForm.jsx
│   │   └── index.js
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── StudentDashboard.jsx
│   │   │   └── TeacherDashboard.jsx
│   │   └── index.js
│   ├── assignments/
│   │   ├── components/
│   │   │   ├── Assignments.jsx
│   │   │   ├── AssignmentSubmissions.jsx
│   │   │   ├── StudentAssignments.jsx
│   │   │   ├── TakeTest.jsx
│   │   │   └── TestAssignment.jsx
│   │   └── index.js
│   ├── rooms/
│   │   ├── components/
│   │   │   ├── JoinRoom.jsx
│   │   │   └── RoomManagement.jsx
│   │   └── index.js
│   ├── papers/
│   │   ├── components/
│   │   │   └── PaperGenerator.jsx
│   │   └── index.js
│   ├── questions/
│   │   ├── components/
│   │   │   └── QuestionGenerator.jsx
│   │   └── index.js
│   ├── practice/
│   │   ├── components/
│   │   │   ├── MockTest.jsx
│   │   │   └── MockInterview.jsx
│   │   └── index.js
│   ├── progress/
│   │   ├── components/
│   │   │   └── ProgressTracker.jsx
│   │   └── index.js
│   └── plagiarism/
│       ├── components/
│       │   └── PlagiarismChecker.jsx
│       └── index.js
├── shared/                 # Shared across features
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Layout.jsx
│   │   │   └── index.js
│   │   ├── ui/            # UI component library (shadcn/ui)
│   │   │   └── [all UI components]
│   │   └── common/
│   │       ├── ImageWithFallback.jsx
│   │       └── index.js
│   ├── hooks/             # Shared custom hooks (if any)
│   └── utils/             # Shared utility functions (if any)
├── contexts/              # React contexts
│   └── AuthContext.jsx
├── services/              # API services
│   ├── api.js
│   └── websocket.js
├── styles/                # Global styles
│   ├── index.css
│   └── globals.css
├── types/                  # TypeScript types (if using TS)
│   └── auth.jsx
└── App.tsx                # Root component
```

## Import Patterns

### Feature Imports
```javascript
// Import from feature index
import { StudentDashboard, TeacherDashboard } from './features/dashboard';
import { QuestionGenerator } from './features/questions';
import { JoinRoom } from './features/rooms';
```

### Shared Component Imports
```javascript
// UI components
import { Button, Card } from './shared/components/ui/button';
import { Header, Layout } from './shared/components/layout';

// Common components
import { ImageWithFallback } from './shared/components/common';
```

### Service Imports
```javascript
import api from './services/api';
import websocket from './services/websocket';
```

### Context Imports
```javascript
import { useAuth } from './contexts/AuthContext';
```

## Benefits of This Structure

1. **Feature-based organization**: Related code is grouped together
2. **Easy navigation**: Find features quickly by domain
3. **Scalability**: Easy to add new features without cluttering
4. **Reusability**: Shared components are clearly separated
5. **Maintainability**: Clear separation of concerns
6. **Index files**: Cleaner imports with barrel exports

## Adding New Features

1. Create a new folder in `features/` with your feature name
2. Add a `components/` subfolder
3. Create your component files
4. Create an `index.js` file to export components
5. Import using: `import { YourComponent } from './features/your-feature'`

## Notes

- All UI components (shadcn/ui) are in `shared/components/ui/`
- Layout components are in `shared/components/layout/`
- Each feature has its own folder with components and index file
- Services and contexts are at the root level for easy access

