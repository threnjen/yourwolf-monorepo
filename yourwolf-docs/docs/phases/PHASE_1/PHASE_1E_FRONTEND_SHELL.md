# Phase 1E: Frontend Shell

> React app with routing and dark theme

## Overview

**Goal**: Establish the frontend application shell with Vite, React, TypeScript, routing, and dark theme styling.

**Status**: ✅ Complete

---

## Success Criteria

- [x] `npm run dev` starts frontend on port 3000
- [x] Navigate between Home and Roles pages
- [x] Dark theme applied consistently
- [x] No console errors on page load
- [x] TypeScript compiles without errors

---

## Key Files

| File | Purpose |
|------|---------|
| `src/main.tsx` | React entry point |
| `src/App.tsx` | Root component with Router |
| `src/routes.tsx` | Route definitions |
| `src/components/Layout.tsx` | Page layout wrapper |
| `src/components/Header.tsx` | App header with branding |
| `src/components/Sidebar.tsx` | Navigation sidebar |
| `src/pages/Home.tsx` | Home page |
| `src/pages/Roles.tsx` | Roles listing page |
| `src/styles/theme.ts` | Dark theme configuration |
| `src/types/role.ts` | TypeScript type definitions |

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Vite | 5.x | Build tool and dev server |
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| React Router | 6.x | Client-side routing |
| Axios | 1.x | HTTP client |

---

## Dark Theme

### Colors

| Element | Color | Hex |
|---------|-------|-----|
| Background | Dark | `#0f0f0f` |
| Surface | Slightly lighter | `#1a1a1a` |
| Text Primary | White | `#ffffff` |
| Text Secondary | Gray | `#a0a0a0` |

### Team Colors

| Team | Color | Hex |
|------|-------|-----|
| Village | Green | `#4a7c59` |
| Werewolf | Dark Red | `#8b0000` |
| Vampire | Indigo | `#4b0082` |
| Alien | Sea Green | `#2e8b57` |
| Neutral | Gray | `#696969` |

---

## Routing

| Path | Page | Description |
|------|------|-------------|
| `/` | Home | Welcome page with app info |
| `/roles` | Roles | Official roles listing |

---

## QA Checklist

### Application Startup

```bash
cd yourwolf-frontend
npm install
npm run dev
```

- [x] Dev server starts without errors
- [x] Console shows `Local: http://localhost:3000`
- [x] Navigate to http://localhost:3000

### Initial Load

- [x] App loads without blank screen
- [x] Browser console shows no red errors
- [x] Dark background is applied
- [x] Header displays "YourWolf"

### Navigation

- [x] Sidebar is visible with navigation links
- [x] Click "Home" → navigates to home page
- [x] Click "Roles" → navigates to roles page
- [x] Browser back button works
- [x] Direct URL `/roles` loads correctly

### Home Page

- [x] Welcome content visible
- [x] Link to Roles page works

### TypeScript

```bash
npm run build
```

- [x] Build completes without TypeScript errors

### Theme Consistency

- [x] All pages use dark background
- [x] Text is readable (sufficient contrast)
- [x] Interactive elements have hover states

---

*Completed: February 2026*
