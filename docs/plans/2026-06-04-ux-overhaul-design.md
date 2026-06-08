# UX and Responsiveness Overhaul Design

## 1. Overview
The goal of this redesign is to elevate the "Activities Control" application to a "premium SaaS" standard, heavily improving usability, responsiveness, and reading layout while retaining the core visual identity (brand-red, violet, and dark mode support).

## 2. Navigation Architecture (Hybrid Sidebar + Bottom Bar)
- **Desktop/Tablet:** 
  - A persistent left sidebar that can be toggled between "expanded" (icons + labels) and "collapsed" (icons only).
  - This optimizes horizontal screen real estate for complex data views.
- **Mobile (< 768px):** 
  - The sidebar is completely hidden.
  - A Bottom Navigation Bar is introduced, fixing the main tabs (Areas, Systems, Metrics, Ideas) to the bottom of the screen.
  - This allows single-handed operation, matching modern app UX patterns.

## 3. Main Content Layout
- **Max-Width Container:** 
  - To prevent eye strain on ultra-wide monitors, the main dashboard content will be constrained to a `max-w-7xl` container, centered horizontally.
  - Cards and tables will fill this container, preventing excessively long text lines.
- **Sticky Top Bar:** 
  - The header, containing the global search and filters, will stick to the top of the viewport during scrolling.
  - Ensures users always have context and filter control without scrolling back up.

## 4. Editing Experience (Side-Drawer / Split-Pane)
- **Desktop:** 
  - Replacing center-screen blocking modals with a slide-out Side-Drawer on the right side.
  - This allows the user to still view the task list while editing a specific item.
- **Mobile:** 
  - The drawer will slide up from the bottom (Bottom Sheet) or occupy full screen, depending on the height, for an optimal touch experience.

## 5. Visual Aesthetics & Micro-interactions
- **Clean Backgrounds:** Use `slate-50` for light mode backgrounds, ensuring high contrast with stark white cards.
- **Subtle Elevation:** Soft, modern shadows (`shadow-sm`, `shadow-md`) and rounded corners (`rounded-xl`, `rounded-2xl`).
- **Strategic Accent Colors:** The brand colors (`brand-red` and `violet`) will be used sparingly for primary buttons, active states, and focus rings to keep the UI clean and professional.
- **Micro-animations:** Smooth transitions using Tailwind's `transition-all` and Framer Motion for drawer opening, sidebar collapsing, and tab switching.
