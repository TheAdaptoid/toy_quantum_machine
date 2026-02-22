## Toy Quantum Machine

A browser-based quantum circuit playground with a matrix-oriented XZ-calculus engine and a cosmic, glassmorphism-inspired UI. Learners can drag Pauli / Clifford gates onto a circuit, step simulation forward and backward, and inspect the evolving state vector without leaving the browser.

### Highlights

- **XZ-calculus simulation engine** implemented with typed arrays, supporting X, Z, H, S, T, CNOT, SWAP and TOFFOLI gates (up to 6 qubits).
- **PixiJS circuit canvas** renders wires, qubit labels, column numbers, and gate blocks with drag-and-drop placement powered by `@dnd-kit/core`.
- **Bottom dock layout** – a horizontal gate palette, execution controls, and a one-click shortcut to the state inspector, all within short drag distance of the canvas.
- **State inspector drawer** – slide-up panel with amplitudes table, probability histogram, and a toggle to hide ~zero states.
- **Keyboard navigation** – use arrow keys (← →) to step through circuit execution.
- **Touch-optimized** – native touch support with 44px minimum touch targets on all interactive elements.
- **Accessible design** – ARIA labels, focus indicators, and screen reader-friendly copy throughout.
- **Measurement workflow** shows per-outcome probabilities and collapses the circuit state accordingly.
- **Persistence & sharing** – export/import JSON, quick-save to `localStorage`, and share circuits via URL query strings.
- **Error boundary** – graceful error handling with fallback UI and recovery options.

### Tech Stack

- Vite + React + TypeScript
- Material UI 7 theme with Outfit / JetBrains Mono typography
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

### How to Use

#### 1. Single-qubit experiment (Hadamard on |0⟩)

1. In the **bottom gate dock**, drag the **H** gate onto the first column of the top wire (q0).
2. Use the **step controls** in the dock (slider or → arrow key) to advance to step 1.
3. Click **Measure** in the top bar and measure qubit 0.
4. Open the **State Inspector** drawer from the dock – you should see ~50% probability on |0⟩ and |1⟩.

This demonstrates creating a superposition from |0⟩ using a single Hadamard gate.

#### 2. Simple entanglement (Bell pair)

1. Set the register to **2 qubits** using the qubit selector in the top bar.
2. Drag **H** onto wire q0, column 0.
3. Drag **CNOT ×2** from the multi-qubit section of the dock onto column 1, targeting control q0 and target q1 when prompted.
4. Step the circuit forward to the last column.
5. Open the **State Inspector** drawer – you should see most probability concentrated on |00⟩ and |11⟩.

This builds a standard Bell state using H followed by CNOT.

#### 3. Saving, loading, and sharing

- Use **Save JSON** in the top bar to download the current circuit.
- Use **Load JSON** to import a previously exported file.
- Use **Share URL** to copy a permalink (`?circuit=...`) to your clipboard; anyone opening that URL will see the same circuit.
- Use **Restore last** to pull the previous circuit snapshot from `localStorage`.

### Features & Usability

#### Layout & Interaction Model

- **Cosmic canvas** – The main view is a PixiJS-powered circuit canvas framed by a deep-space background and aurora gradients.
- **Bottom dock** – Gates, execution controls, and the inspector shortcut live in a fixed dock at the bottom of the screen so drag distances stay short and predictable.
- **Responsive behavior** – The layout scales from small laptop screens to large monitors without hiding core controls.

#### Circuit Canvas

- **Qubit labels** – Each wire displays its ket notation (|q0⟩, |q1⟩, …) on the left edge.
- **Column numbers** – Reference circuit structure with numbered columns along the top.
- **Visual feedback** – Drop zones highlight on hover; the execution marker shows the currently simulated column.
- **Gate tooltips** – Hover over placed gates to see their type and target qubits.
- **Touch-friendly delete** – 44px+ touch targets on gate removal buttons.

#### Gate Palette (Bottom Dock)

- **Horizontal gate chips** – Single-qubit gates appear first, followed by a subtle divider and multi-qubit gates.
- **Arity badges** – Multi-qubit gates show an ×N badge (e.g., ×2 for CNOT) instead of verbose labels.
- **Drag-and-drop** – Drag a gate from the dock onto any valid cell in the circuit canvas; multi-qubit gates open a target-selection dialog when needed.
- **ARIA labels** – Each gate chip announces its behavior and arity to assistive technologies.

#### Execution Controls

- **Keyboard shortcuts** – Press ← / → arrow keys to step backward/forward through the circuit.
- **Step slider** – Jump directly to any step using the mini slider in the dock.
- **Disabled state hints** – Tooltips explain why buttons are disabled at the start or end of the timeline.

#### State Inspector

- **Slide-up drawer** – Click the dock inspector button to open a bottom drawer with full state information.
- **Zero filtering** – Toggle to hide basis states with negligible probability (≈ 0) for dense systems.
- **Responsive chart height** – Bar chart height adapts to the number of qubits.
- **Tabular detail** – Amplitudes and probabilities are listed in a monospace table with hover highlighting.

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
    ErrorBoundary.tsx # Error boundary for graceful error handling
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
