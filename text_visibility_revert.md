# Revert Information for Text Visibility Change in HomeView.tsx

**Date:** 2026-07-23
**File Modified:** `src/components/HomeView.tsx`
**Reason for change:** The text was originally using `text-text-muted` which was difficult to read in dark mode. It was updated to `text-on-surface/90` for better visibility.

## Previous Version
```tsx
<p className="text-sm md:text-base text-text-muted max-w-xl mx-auto leading-relaxed drop-shadow-sm">
  Foundry is the first place you visit whenever an idea is born. Overcome ambiguity, audit technical assumptions, and orchestrate buildable products.
</p>
```

## Current Version
```tsx
<p className="text-sm md:text-base text-on-surface/90 max-w-xl mx-auto leading-relaxed drop-shadow-sm">
  Foundry is the first place you visit whenever an idea is born. Overcome ambiguity, audit technical assumptions, and orchestrate buildable products.
</p>
```
