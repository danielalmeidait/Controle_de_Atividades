# UX and Responsiveness Overhaul Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement a responsive hybrid navigation, max-width layout with sticky topbar, and a side-drawer for editing.

**Architecture:** Modifying the monolithic `App.tsx` to wrap the content in a new layout structure (`flex-col` on mobile, `flex-row` on desktop). Sidebars and Bottom navigation will manage the `activeTab` state. Modals will be converted to sliding drawers.

**Tech Stack:** React, Tailwind CSS v4, Lucide React, Framer Motion

---

### Task 1: Main Layout & Navigation Structure

**Files:**
- Modify: `src/App.tsx`

**Step 1: Implement responsive navigation wrapper**
Modify `App.tsx` to render a left sidebar on `md:` breakpoints, and a fixed bottom navigation bar on mobile. 

**Step 2: Add Max-Width Container & Sticky Topbar**
Modify the content container to use `max-w-7xl mx-auto w-full`. Extract search/filters into a `sticky top-0 z-40` header area.

**Step 3: Run app to verify**
Run: `npm run dev`
Expected: UI shows the new navigation (Sidebar on desktop, Bottom bar on mobile) and sticky header.

**Step 4: Commit**
```bash
git add src/App.tsx
git commit -m "feat(ui): implement responsive layout and navigation"
```

### Task 2: Modals to Side Drawers

**Files:**
- Modify: `src/App.tsx`

**Step 1: Update TaskModal and IdeaModal**
Change the container classes from centered modals (`items-center justify-center`) to side drawers (`justify-end`). Update Framer Motion animations to slide from right.

**Step 2: Verify Drawers**
Run: `npm run dev`
Expected: Clicking on a task opens a side drawer on the right instead of a center modal. On mobile, it should still be usable (slide up or full screen).

**Step 3: Commit**
```bash
git add src/App.tsx
git commit -m "feat(ui): convert modals to side drawers"
```

### Task 3: Visual Polish (Colors, Shadows, Spacing)

**Files:**
- Modify: `src/App.tsx`

**Step 1: Refine colors and borders**
Update background classes (use `slate-50`/`slate-900` globally). Enhance cards with `shadow-sm hover:shadow-md`, `rounded-2xl`, and refined padding.

**Step 2: Verify aesthetics**
Run: `npm run dev`
Expected: The interface feels premium and matches the design doc.

**Step 3: Commit**
```bash
git add src/App.tsx
git commit -m "style: polish UI spacing, colors, and shadows"
```
