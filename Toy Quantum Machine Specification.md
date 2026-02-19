# Toy Quantum Machine Specification

Build a lightweight, browser‑based “toy quantum machine” that lets students experiment with quantum circuits using a *matrix‑based implementation of XZ‑Calculus*. The app should be intuitive enough for beginners yet faithful to the underlying mathematics so users can see how gates transform state vectors.

---

## Overview

| Component | Purpose |
|-----------|---------|
| **Frontend (SPA)** | UI/UX, visualisation of qubits & circuits, user input |
| **Simulation Engine** | Pure‑JS / TS module that implements XZ‑Calculus matrices and evolves the state vector |
| **Optional Backend** | Static file hosting; optional persistence or sharing API |

The simulation runs entirely in the browser (no server‑side quantum processing). The backend is only required for static assets and optional data storage.

---

## Target Audience

* Undergraduate students, hobbyists, or anyone new to quantum computing who wants a hands‑on learning tool.
* No need for high performance; focus on clarity of concepts over speed.

---

## Functional Requirements

| # | Feature | Description |
|---|---------|-------------|
| **FR1** | Create Qubit Register | User selects number of qubits (1–6). The app initializes the state vector to \(|0…0\rangle\). |
| **FR2** | Apply XZ‑Calculus Gates | Support the following gates, each represented by a 2×2 or 4×4 matrix: <br>• Pauli‑X (`σ_x`) <br>• Pauli‑Z (`σ_z`) <br>• Hadamard (`H`) <br>• Phase (`S`, `T`) <br>• Controlled‑NOT (CNOT) <br>• SWAP |
| **FR3** | Build Circuits Visually | Drag‑and‑drop gate icons onto qubit wires; support multi‑qubit gates via a “gate block” that spans selected qubits. |
| **FR4** | Step‑by‑Step Execution | User can step forward/backward through the circuit, seeing the state vector after each gate. |
| **FR5** | Measurement | Choose one or more qubits to measure; display probabilities and collapse the state accordingly. |
| **FR6** | State Inspector | Text view of the complex amplitude list; visual histogram of measurement outcomes. |
| **FR7** | Reset / Clear | Reinitialize the register to \(|0…0\rangle\). |
| **FR8** | Save & Load Circuits | Export/import JSON representations of a circuit (qubit count, gate sequence). |
| **FR9** | Share via URL | Encode the circuit in the query string so users can share or bookmark. |

---

## Non‑Functional Requirements

| # | Requirement | Details |
|---|-------------|---------|
| **NFR1** | Performance | All operations must complete within <50 ms for up to 6 qubits on a typical laptop. |
| **NFR2** | Usability | UI should follow Material‑UI guidelines; include tooltips and brief explanations for each gate. |
| **NFR3** | Accessibility | WCAG 2.1 AA compliance, keyboard navigation, screen‑reader friendly labels. |
| **NFR4** | Security | No user data is transmitted to a third party; all code runs client‑side. |
| **NFR5** | Extensibility | Architecture should allow adding new gates or moving to a server‑based backend later. |

---

## System Architecture

```
┌───────────────────────┐
│      Browser UI        │  ← React + TypeScript (SPA)
├─────────────▲───────────┤
│             │           │
│   ┌─────────▼───────────┐
│   │ Simulation Engine    │  ← Pure TS module that implements XZ‑Calculus
│   │ (state vector, gates)│
│   └──────────────────────┘
├─────────────▼───────────┤
│   WebGL/Canvas Renderer │  ← Visual representation of wires & gates
└───────────────────────┘

(Optional Backend)
┌───────────────────────┐
│      Express / Flask    │  (static file server, optional REST API)
├─────────────▲───────────┤
│             │           │
│   Storage   │           │
│   (JSON DB or S3) │     │
└───────────────────────┘
```

### Frontend Layers

| Layer | Responsibility |
|-------|----------------|
| **UI** | React components: `CircuitEditor`, `GatePalette`, `StateViewer`, `Histogram`. |
| **Store** | Redux / Zustand for global state (qubit count, gate list, current step). |
| **Renderer** | WebGL canvas that draws wires and gates; uses Three.js or PixiJS for simplicity. |
| **Persistence** | LocalStorage + optional API calls for saving/loading circuits. |

### Simulation Engine

* **State Representation** – TypedArray (`Float64Array`) of length `2^n * 2` (real+imag parts).  
* **Gate Matrices** – Pre‑computed `TypedArray` matrices for each gate; multi‑qubit gates are tensor products applied via sparse multiplication.  
* **Execution Pipeline** – For each gate: apply matrix to current state vector → update store → trigger UI refresh.  
* **Measurement** – Compute probabilities, sample according to quantum Born rule, collapse the state.

The engine exposes a minimal API:

```ts
applyGate(gateName: string, qubits: number[]): void;
stepForward(): void;
stepBackward(): void;
measure(qubitIndices: number[]): { outcome: string; probabilities: Record<string, number> };
reset(): void;
```

---

## Data Model

| Entity | Fields | Notes |
|--------|--------|-------|
| **Circuit** | `numQubits: number`<br>`gates: Gate[]` | JSON export/import format |
| **Gate** | `name: string`<br>`targets: number[]` (qubit indices) | For multi‑qubit gates, `targets.length > 1` |
| **StateVector** | `real: Float64Array`<br>`imag: Float64Array` | Length = `2^n` |

---

## API Endpoints (Optional)

| Method | Path | Payload | Response |
|--------|------|---------|----------|
| GET | `/api/circuit/:id` | N/A | `{ numQubits, gates }` |
| POST | `/api/circuit` | `{ numQubits, gates }` | `{ id }` |
| DELETE | `/api/circuit/:id` | N/A | `204 No Content` |

All endpoints are stateless; authentication is not required for the toy demo.

---

## 8. User Interface Sketch (Textual)

```
┌─────────────────────────────────────────────────────────────┐
│  Quantum Playground – Toy Machine (XZ‑Calculus)             │
├─────────────────────────────────────────────────────────────┤
│  [Qubits: 3]   [Reset]   [Save]   [Load]   [Share URL]      │
│                                                                 │
│  ┌─── Gate Palette ──────────────────────────────────────┐     │
│  |  X    Z    H    S    T    CNOT   SWAP  (drag & drop)  |     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌───────────────────────┬───────────────────────┐             │
│  |  Circuit Canvas       |  State Inspector      |             │
│  | (Wires + Gate Icons)  |  (Amplitude list,    |             │
│  |                       |   Histogram)         |             │
│  └───────────────────────┴───────────────────────┘             │
│                                                                 │
│  [Step Back]  [Step Forward]  [Measure Qubit 1]                 │
└─────────────────────────────────────────────────────────────┘
```

*Tooltips* show brief math explanations (e.g., “Hadamard: $\frac{1}{\sqrt2}\begin{pmatrix}1 & 1\\1 & -1\end{pmatrix}$”).  
*Error handling* displays modal dialogs for invalid gate placement or measurement on an undefined qubit.

---

## XZ‑Calculus Primer (for the app)

| Gate             | Matrix (Pauli‑X/Z basis)                                                      | Notes                           |
| ---------------- | ----------------------------------------------------------------------------- | ------------------------------- |
| **σ_x**          | $\begin{pmatrix}0 & 1\\1 & 0\end{pmatrix}$                                    | Flips                           |
| **σ_z**          | $\begin{pmatrix}1 & 0\\0 & -1\end{pmatrix}$                                   | Phase flip                      |
| **Hadamard (H)** | $\frac{1}{\sqrt2}\begin{pmatrix}1 & 1\\1 & -1\end{pmatrix}$                   | Maps X↔Z basis                  |
| **Phase (S)**    | $\begin{pmatrix}1 & 0\\0 & i\end{pmatrix}$                                    | $σ_z^{1/2}$                     |
| **T**            | $\begin{pmatrix}1 & 0\\0 & e^{iπ/4}\end{pmatrix}$                             | Universal gate set with H, CNOT |
| **CNOT**         | $\begin{pmatrix}I_2 & 0 \\ 0 & X\end{pmatrix}$ (control on qubit a, target b) | Entangles                       |
| **SWAP**         | $\frac{1}{2}(I⊗I + σ_x⊗σ_x + σ_z⊗σ_z - σ_y⊗σ_y)$                              | Exchanges two qubits            |

All gates are unitary; the simulation engine verifies this property when loading a gate.

---

## 13. Deliverables

1. **GitHub Repository** – Source code, CI/CD workflow (GitHub Actions).
2. **Live Demo URL** – Hosted on Netlify or Vercel.
3. **Documentation** – README with installation steps, usage guide, and XZ‑Calculus cheat sheet.
4. **Testing Reports** – Coverage badges, Cypress test results.
