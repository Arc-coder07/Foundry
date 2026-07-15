# Foundry — Known Issues & Fixes Tracker

---

## 1. Text Selection Disabled Across the App ✅ RESOLVED
**Root Cause:** Tailwind `select-none` class on major container elements.  
**Fix:** Removed `select-none` from content containers in HomeView, App.tsx (header + list view), and Editor sidebar. Kept it only on the navigation Sidebar and CoPilot action footer where disabling selection is intentional.

---

## 2. Thought Blueprints Card Click Immediately Redirects Back to Home ✅ RESOLVED
**Root Cause:** The `server.ts` API writes new items to `data/db.json`. Vite's file watcher (which handles HMR) was watching the entire project directory. When `db.json` changed, Vite detected a change to a non-module file and forced a full browser page reload, wiping the React state and returning the user to the default Home view.  
**Fix:** Added `ignored: ['**/data/**']` to the `watch` configuration in `vite.config.ts` to prevent Vite from reloading the app when the database is updated.

---

## 3. Deleting an MVP Requirement Resets View and Theme ✅ RESOLVED
**Root Cause (theme & view reset):** Similar to Issue #2, deleting an item via the API updated `data/db.json`, which triggered Vite to force a full page reload. When the app remounted, the theme reset because it was hardcoded to `"dark"` on mount, and the view reset to `"home"`.  
**Fix:** 
- Prevented the page reload by ignoring `data/` in `vite.config.ts`.
- Persisted the theme to `localStorage` and read it on initialization.
- Made `toggleTheme` save to localStorage.
- Changed `handleDeleteItem` to navigate to `"ideas"` instead of `"home"` (since the app now stays alive).

---

## 4. Replace Demo User Profile with Real Profile & Profile Page ✅ RESOLVED
**Root Cause:** Hardcoded "Alex Chen" demo profile with stock photo.  
**Fix:**
- Added `UserProfile` type to `types.ts`.
- Created `ProfileView.tsx` — full profile page with editable name, role, bio, and avatar (URL paste + local file upload).
- Profile persisted to `localStorage`.
- Sidebar user card is now clickable → navigates to Profile view.
- Sidebar shows initials as fallback when no avatar is set.

---

> **Total Issues: 4 — All Resolved ✅**


---

## 1. Text Selection Disabled Across the App
**Location:** Multiple components  
**Problem:** Users cannot select or copy any text from the Home page or any other page. The Tailwind `select-none` class is applied to major container elements, disabling text selection globally.  
**Affected Files:**
- `src/components/HomeView.tsx` (line 103)
- `src/App.tsx` (lines 331, 389)
- `src/components/Editor.tsx` (line 368 — sidebar)
- `src/components/Sidebar.tsx` (line 41)
- `src/components/CoPilotDrawer.tsx` (line 155)

**Status:** 🔴 Open

---

## 2. Thought Blueprints Card Click Immediately Redirects Back to Home
**Location:** Home page → Thought Blueprints section  
**Problem:** When clicking on a card/widget in the "Thought Blueprints" section on the Home page, it briefly navigates to the item's detail page but then immediately snaps back to the Home page. The navigation is not being persisted correctly.  
**Affected Files:**
- `src/components/HomeView.tsx` (card click handler)
- `src/App.tsx` (view state management)

**Status:** 🔴 Open

---

## 3. Deleting an MVP Requirement Resets View and Theme
**Location:** Editor → MVP Requirements section  
**Problem:** When deleting an item in the MVP Requirements checklist, the app:
1. Redirects the user back to the Home page (instead of staying on the editor).
2. Reverts the theme from Light mode back to Dark mode.

This suggests the delete action is triggering a full state reset or re-render that wipes out both the current view and the theme preference.  
**Affected Files:**
- `src/components/Editor.tsx` (MVP delete handler)
- `src/App.tsx` (state management for view and theme)

**Status:** 🔴 Open

---

## 4. Replace Demo User Profile with Real Profile & Profile Page
**Location:** Sidebar → User profile section  
**Problem:** The app currently displays a hardcoded demo user profile ("Alex Chen", "Product Lead") with a stock photo. This needs to be replaced with:
1. A real/configurable user profile (remove the demo data).
2. A dedicated Profile page, section, or widget that opens when the user clicks on their profile area in the sidebar.

**Affected Files:**
- `src/components/Sidebar.tsx` (hardcoded profile at bottom)
- New file needed for Profile page/component

**Status:** 🔴 Open

---

> **Total Open Issues: 4**
