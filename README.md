## Toy Quantum Machine

A browser-based playground for experimenting with quantum circuits via a matrix-oriented XZ-calculus engine. Students can drag classical Pauli / Clifford gates, inspect the evolving state vector, and measure qubits step by step—all without leaving the browser.

### Highlights

- **XZ-Calulus simulation engine** implemented with typed arrays, supporting X, Z, H, S, T, CNOT, and SWAP gates (up to 6 qubits).
- **PixiJS circuit canvas** renders wires, gate blocks, and execution markers with drag-and-drop placement powered by `@dnd-kit/core`.
- **State inspector** surfaces amplitudes and probability histograms for every basis state.
- **Measurement workflow** shows per-outcome probabilities and collapses the circuit state accordingly.
- **Persistence & sharing** – export/import JSON, quick-save to `localStorage`, and share circuits via URL query strings.

### Tech Stack

- Vite + React + TypeScript
- Material UI 6 theme with Space Grotesk / IBM Plex Mono typography
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

| Command | Description |
| --- | --- |
| `npm run dev` | Launch Vite dev server with HMR |
| `npm run build` | Type-check and produce optimized production bundle |
| `npm run lint` | Run ESLint across the workspace |
| `npm run test` | Execute Vitest unit suite once |
| `npm run test:watch` | Continuous Vitest watcher |

### Testing & Quality

- Unit tests cover the quantum engine (gate application, measurement, normalization).
- ESLint enforces modern TS/React rules, and Vitest uses `jsdom` for component testing hooks.

### Project Structure (selected)

```
src/
  components/         # UI building blocks (canvas, palette, inspector)
  simulation/         # Gate matrices, linear algebra helpers, engine + tests
  store/              # Zustand circuit store + actions
  utils/              # Persistence helpers, formatting utilities
  theme/              # MUI theme definition
```

### Sharing & Persistence

- **Save JSON** downloads the full circuit definition, while **Load JSON** imports a previously exported file.
- **Share URL** copies a permalink (`?circuit=...`) encoding the current qubit count and gate list so learners can bookmark or send their circuits.
- **Restore last** pulls the latest snapshot from browser storage.

### Next Steps

- Add controlled execution playback and keyboard navigation for gate placement.
- Layer in Cypress integration tests and CI workflow.
- Optional backend endpoints (`/api/circuit`) for remote storage as described in the specification.
