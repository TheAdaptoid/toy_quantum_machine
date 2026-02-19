## Toy Quantum Machine

A browser-based playground for experimenting with quantum circuits via a matrix-oriented XZ-calculus engine. Students can drag classical Pauli / Clifford gates, inspect the evolving state vector, and measure qubits step by step—all without leaving the browser.

### Highlights

- **XZ-Calulus simulation engine** implemented with typed arrays, supporting X, Z, H, S, T, CNOT, and SWAP gates (up to 6 qubits).
- **PixiJS circuit canvas** renders wires with qubit labels, column numbers, gate blocks, and execution markers with drag-and-drop placement powered by `@dnd-kit/core`.
- **State inspector** surfaces amplitudes and probability histograms with filtering for zero-probability states and responsive chart sizing.
- **Keyboard navigation** – use arrow keys (← →) to step through circuit execution.
- **Touch-optimized** – native touch support with 44px minimum touch targets on all interactive elements.
- **Accessible design** – comprehensive ARIA labels, focus indicators, and screen reader support.
- **Measurement workflow** shows per-outcome probabilities and collapses the circuit state accordingly.
- **Persistence & sharing** – export/import JSON, quick-save to `localStorage`, and share circuits via URL query strings.
- **Error boundary** – graceful error handling with fallback UI and recovery options.

### Tech Stack

- Vite + React + TypeScript
- Material UI 7 theme with Space Grotesk / IBM Plex Mono typography
- Zustand store + immer middleware for circuit state
- PixiJS renderer, Recharts for histograms, DnD Kit for drag interactions
- Vitest + Testing Library for unit coverage

### Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` and start dragging gates from the palette onto the circuit grid.

### Key Scripts

| Command              | Description                                        |
| -------------------- | -------------------------------------------------- |
| `npm run dev`        | Launch Vite dev server with HMR                    |
| `npm run build`      | Type-check and produce optimized production bundle |
| `npm run lint`       | Run ESLint across the workspace                    |
| `npm run test`       | Execute Vitest unit suite once                     |
| `npm run test:watch` | Continuous Vitest watcher                          |

### Features & Usability

#### Circuit Canvas

- **Qubit labels** – Each wire displays its ket notation (|q0⟩, |q1⟩) on the left edge
- **Column numbers** – Reference circuit structure with numbered columns along the top
- **Visual feedback** – Drop zones highlight on hover; step execution marker shows current position
- **Gate tooltips** – Hover over placed gates to see their type and target qubits
- **Touch-friendly delete** – 44px touch targets on gate removal buttons

#### Gate Palette

- **Organized by category** – Single-qubit and multi-qubit gates grouped with visual separators
- **Arity badges** – Multi-qubit gates show ×2 indicator instead of text suffix
- **ARIA labels** – Each gate chip announces its function to screen readers

#### Execution Controls

- **Keyboard shortcuts** – Press ← / → arrow keys to step backward/forward through the circuit
- **Visual step counter** – Shows current position (e.g., "Step 3 of 12")
- **Disabled state hints** – Tooltips explain why buttons are disabled

#### State Inspector

- **Zero filtering** – Toggle to hide basis states with negligible probability
- **Responsive chart height** – Scales from 220px to 340px based on qubit count
- **Zebra striping** – Alternating row colors improve table readability

#### Safety & Reliability

- **Reset confirmation** – Destructive actions require dialog confirmation
- **Error boundary** – Application crashes show user-friendly recovery UI
- **Validation feedback** – Toast notifications explain why gate placement might fail

### Testing & Quality

- Unit tests cover the quantum engine (gate application, measurement, normalization).
- ESLint enforces modern TS/React rules, and Vitest uses `jsdom` for component testing hooks.
- Accessibility features tested with keyboard-only navigation and screen reader compatibility.

### Project Structure (selected)

```
src/
  components/         # UI building blocks (canvas, palette, inspector, dialogs)
    ErrorBoundary.tsx # Class component for graceful error handling
  simulation/         # Gate matrices, linear algebra helpers, engine + tests
  store/              # Zustand circuit store + actions
  utils/              # Persistence helpers, formatting utilities
  theme/              # MUI theme definition
```

### Sharing & Persistence

- **Save JSON** downloads the full circuit definition, while **Load JSON** imports a previously exported file.
- **Share URL** copies a permalink (`?circuit=...`) encoding the current qubit count and gate list so learners can bookmark or send their circuits.
- **Restore last** pulls the latest snapshot from browser storage.

### Accessibility

This application follows WCAG 2.1 AA guidelines:

- All interactive elements have ARIA labels
- Keyboard navigation supported throughout (arrow keys, tab order)
- High-contrast focus indicators (3px cyan outline)
- Touch targets meet 44×44px minimum size
- Respects `prefers-reduced-motion` user preference

### Next Steps

- Add controlled execution playback and animation speed controls.
- Layer in Cypress integration tests and CI workflow.
- Optional backend endpoints (`/api/circuit`) for remote storage as described in the specification.
- Add tutorial overlay with step-by-step first-run guidance.
