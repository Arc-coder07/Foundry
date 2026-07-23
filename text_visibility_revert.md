# Revert Information for Text Visibility and Background Changes

**Date:** 2026-07-23

## Issue
The hero text was unreadable due to the busy and bright background effect (`PixelDriftBanner`) in dark mode. After attempting to dim it, it still felt awkward, so the background effect was completely removed.

## Changes Made

### 1. File Modified: `src/components/HomeView.tsx`
**Reason for change:** The `PixelDriftBanner` was removed entirely. The hero container styling was updated to use a clean gradient background instead of a transparent overlay over the noise canvas. The text color was previously updated to `text-on-surface/90` for better visibility.

#### Previous Version (with Background Effect)
```tsx
import { PixelDriftBanner } from "./HalftoneGlowBanner";

// ... inside component ...

{/* Hero Section with Pixel Drift Banner Background */}
<section className="relative rounded-2xl border border-outline-variant shadow-2xl overflow-hidden">
  <PixelDriftBanner />

  {/* Content overlaid on banner */}
  <div className="relative z-10 text-center space-y-6 py-20 px-4 md:py-28 md:px-8 bg-gradient-to-b from-transparent to-background/20">
    {/* ... inner content ... */}
    <p className="text-sm md:text-base text-text-muted max-w-xl mx-auto leading-relaxed drop-shadow-sm">
      Foundry is the first place you visit whenever an idea is born. Overcome ambiguity, audit technical assumptions, and orchestrate buildable products.
    </p>
  </div>
</section>
```

#### Current Version (Clean Background)
```tsx
{/* Hero Section */}
<section className="relative rounded-2xl border border-outline-variant shadow-2xl overflow-hidden bg-gradient-to-b from-surface-container-low to-background">
  <div className="relative z-10 text-center space-y-6 py-20 px-4 md:py-28 md:px-8">
    {/* ... inner content ... */}
    <p className="text-sm md:text-base text-on-surface/90 max-w-xl mx-auto leading-relaxed drop-shadow-sm">
      Foundry is the first place you visit whenever an idea is born. Overcome ambiguity, audit technical assumptions, and orchestrate buildable products.
    </p>
  </div>
</section>
```

### 2. File Modified: `src/index.css`
**Note:** The previous change (lowering `opacity` to `0.25` on `.pixel-drift-banner__canvas`) remains in the CSS file, but is no longer actively used since the banner component was removed from the homepage.
