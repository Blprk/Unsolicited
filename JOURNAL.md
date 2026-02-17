# JOURNAL

## 2026-02-17 – Project Initialization

### What happened
- Started the task of modernizing the card display with a carousel treatment.
- Discovered that `TODO.md` and `JOURNAL.md` were missing from the project root.
- Initialized the memory system files.
- Researched `index.html`, `style.css`, and `script.js`.
- Identified that the current implementation uses a CSS Grid for cards.
- Implemented a modern horizontal carousel with scroll-snapping.
- Added glassmorphism navigation buttons and responsive tweaks.
- Elevated design to **Premium** level:
    - Locked Hero to `100dvh` for a "fit-to-window" mobile feel.
    - Added high-quality Unsplash thumbnails to all cards via JS injection.
    - Fixed missing image mapping for "St. Francis" episode.
    - Implemented advanced glassmorphism (blurs, noise, brilliant borders).
    - Synchronized carousel active state with centered scrolling.
    - **Implemented high-performance 3D Depth Stack animation** (hardware accelerated).
    - **Added responsive multi-column Episode Archive** at the bottom.
    - Refined typography (compact titles, tighter line heights).
    - **Implemented Immersive Global Ambient Background**: Moved localized gradients to the `body` with `fixed` attachment, creating a unified, viewport-wide atmosphere.

### What I learned
- CSS scroll-snap is a powerful tool for creating native-feeling carousels with minimal JS.
- Using `flex: 0 0 85%` on mobile provides a great "peek" effect for carousels.
- Premium feel requires visual anchors (images) and strict layout constraints (viewport locking).

### Mistakes / friction
- Initial search for memory files returned no results, requiring manual initialization.
- Occasional friction with CSS matching during file replacement, resolved by viewing larger context.

### Wisdom to carry forward
- Always ensure the execution memory system is in place at the start of a task to maintain continuity.
- Using `requestAnimationFrame` for 3D transforms avoids layout thrashing and ensures 60FPS.
- Normalized slug-based mapping is the only reliable way to handle dynamic asset injection with complex titles.
