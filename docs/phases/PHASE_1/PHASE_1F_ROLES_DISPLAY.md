# Phase 1F: Roles Display

> Display all official roles in frontend

## Overview

**Goal**: Integrate frontend with backend API to display all 30 official roles in a responsive grid with team-colored cards.

**Status**: ✅ Complete

---

## Success Criteria

- [x] Roles page shows 30 role cards
- [x] Each card displays name, description, team badge
- [x] Team colors match specification
- [x] Loading spinner shown while fetching
- [x] Error message shown if backend unavailable
- [x] Grid is responsive

---

## Key Files

| File | Purpose |
|------|---------|
| `src/api/client.ts` | Axios instance with base URL |
| `src/api/roles.ts` | Role API methods |
| `src/hooks/useRoles.ts` | Data fetching hook |
| `src/components/RoleCard.tsx` | Individual role card |
| `src/pages/Roles.tsx` | Roles grid page |
| `src/types/role.ts` | Role TypeScript types |

---

## API Integration

### Client Configuration

```typescript
// src/api/client.ts
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});
```

### API Methods

| Method | Endpoint | Returns |
|--------|----------|---------|
| `listRoles()` | GET /api/roles | Paginated roles |
| `listOfficialRoles()` | GET /api/roles/official | Official roles array |
| `getRoleById(id)` | GET /api/roles/{id} | Single role |

### useRoles Hook

```typescript
const { roles, loading, error } = useRoles();
```

Returns:
- `roles`: Array of role objects
- `loading`: Boolean for loading state
- `error`: Error message or null

---

## RoleCard Component

### Props

| Prop | Type | Description |
|------|------|-------------|
| `role` | Role | Role object to display |

### Display Elements

- Role name (bold, prominent)
- Description text
- Team badge with color
- Wake order (if applicable)
- Official indicator (⭐)
- Left border in team color

### Team Color Mapping

| Team | Border Color | Badge Background |
|------|--------------|------------------|
| village | `#4a7c59` | Green |
| werewolf | `#8b0000` | Dark Red |
| vampire | `#4b0082` | Indigo |
| alien | `#2e8b57` | Sea Green |
| neutral | `#696969` | Gray |

---

## QA Checklist

### Roles Page Load

- [x] Navigate to `/roles`
- [x] Loading state shown initially
- [x] 30 role cards appear after load
- [x] No console errors during fetch

### Role Cards

- [x] Each card shows role name
- [x] Each card shows description
- [x] Each card shows team badge with correct color
- [x] Official roles show ⭐ indicator
- [x] Wake order displayed for roles that wake
- [x] Left border matches team color

### Team Colors Verification

- [x] Village roles have green indicators
- [x] Werewolf roles have red indicators
- [x] Neutral roles have gray indicators

### Responsive Grid

- [x] Desktop: 3-4 cards per row
- [x] Tablet: 2 cards per row
- [x] Mobile: 1 card per row
- [x] Cards resize without breaking layout

### Error Handling

```bash
# Stop backend
docker compose stop backend
```

- [x] Reload Roles page → error message displayed
- [x] Error message is user-friendly
- [x] Restart backend → roles load successfully

### Loading State

- [x] Loading indicator visible during fetch
- [x] No flash of empty content

### Accessibility

- [x] Keyboard navigation works (Tab through cards)
- [x] Focus indicators visible
- [x] Text has sufficient contrast

---

*Completed: February 2026*
