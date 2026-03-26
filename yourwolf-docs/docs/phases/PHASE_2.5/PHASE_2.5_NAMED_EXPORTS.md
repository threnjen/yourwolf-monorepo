# Phase 2.5: Named Exports Migration

> **Migrate all React components from default exports to named exports per TypeScript style guide**

## Overview

**Goal**: Refactor frontend codebase to use named exports exclusively, aligning with the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) and the project's [AGENTS.md TypeScript Style](../../../yourwolf-frontend/AGENTS.md) section.

**Duration**: ~1 day

**Prerequisites**: Phase 2 complete

**Deliverables**:
- All 8 files migrated from `export default` to named exports
- All import statements updated to use named imports
- Codebase compiles and all tests pass

---

## Motivation

Named exports provide several advantages over default exports:

1. **Explicit imports**: Import statements clearly show what is being imported (`import { Header } from './Header'`)
2. **Better tooling**: IDE auto-imports and refactoring work more reliably
3. **Tree-shaking**: Bundlers can more effectively eliminate unused code
4. **Consistency**: Single export pattern across the codebase
5. **No naming mismatches**: Default exports can be imported with any name, leading to inconsistencies

---

## Scope

The following 8 files require migration:

| File | Path |
|------|------|
| Header | `src/components/Header.tsx` |
| Sidebar | `src/components/Sidebar.tsx` |
| RoleCard | `src/components/RoleCard.tsx` |
| Layout | `src/components/Layout.tsx` |
| Home | `src/pages/Home.tsx` |
| Roles | `src/pages/Roles.tsx` |
| AppRoutes | `src/routes.tsx` |
| App | `src/App.tsx` |

---

## Migration Pattern

### Export Change

**Before:**
```tsx
function Header() {
  return <header>...</header>;
}

export default Header;
```

**After:**
```tsx
export function Header() {
  return <header>...</header>;
}
```

### Import Change

**Before:**
```tsx
import Header from './components/Header';
```

**After:**
```tsx
import { Header } from './components/Header';
```

---

## File-by-File Checklist

Migrate in dependency order (leaf components first) to avoid intermediate breakage:

### Batch 1: Leaf Components (no internal dependencies)
- [ ] `src/components/Header.tsx` - Convert to named export
- [ ] `src/components/Sidebar.tsx` - Convert to named export
- [ ] `src/components/RoleCard.tsx` - Convert to named export

### Batch 2: Layout (imports Header, Sidebar)
- [ ] `src/components/Layout.tsx` - Convert to named export
- [ ] Update imports of Header and Sidebar in Layout.tsx

### Batch 3: Pages (import components)
- [ ] `src/pages/Home.tsx` - Convert to named export
- [ ] `src/pages/Roles.tsx` - Convert to named export
- [ ] Update imports of RoleCard in pages

### Batch 4: Routes (imports pages)
- [ ] `src/routes.tsx` - Convert to named export
- [ ] Update imports of Home and Roles in routes.tsx

### Batch 5: App (imports routes)
- [ ] `src/App.tsx` - Convert to named export
- [ ] Update import of AppRoutes in App.tsx
- [ ] Update import of App in `src/main.tsx`

---

## Testing

After completing all migrations:

1. **Compile check**: Run `npm run build` - should complete with no errors
2. **Dev server**: Run `npm run dev` - app should load and render correctly
3. **Test suite**: Run `npm run test` - all tests should pass
4. **Manual verification**: Navigate through all pages to ensure routing works

---

## Success Criteria

- [ ] No `export default` statements remain in `src/**/*.tsx`
- [ ] All imports use named import syntax `{ Component }`
- [ ] `npm run build` succeeds
- [ ] `npm run test` passes
- [ ] App renders correctly in browser
