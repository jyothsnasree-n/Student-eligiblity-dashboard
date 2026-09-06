# College Event Certificate Eligibility Board (P12)

A clean, modular single-page web application for evaluating college event participant activity points and certificate eligibility based on category completeness (`LEARN`, `BUILD`, `SHARE`) and point thresholds ($\ge 6$).

---

##  Project Directory Structure

```text
student-eligibility-dashboard/
├── index.html                  # HTML5 skeleton & container layout
├── style.css                   # Enterprise light-mode CSS design system
├── js/
│   ├── app.js                  # Application state, event binding & orchestration layer
│   ├── data.js                 # Baseline fixed activities & sample participant records
│   ├── rules.js                # Business rules, threshold constants & display formatting
│   ├── validator.js            # Input validation & error detection engine
│   ├── eligibility.js          # Pure points, category & eligibility calculation engine
│   └── renderer.js             # DOM rendering engine & template generators
├── tests/
│   └── eligibility.test.js     # Standalone unit test suite for business & validation rules
└── README.md                   # Project architecture & user documentation
```

---

##  Module Responsibilities

| Module | Responsibility |
| :--- | :--- |
| **`data.js`** | Stores immutable baseline data structures (`FIXED_ACTIVITIES` catalog and `BUILTIN_PARTICIPANTS` sample records). |
| **`rules.js`** | Defines business thresholds (`MIN_ELIGIBILITY_POINTS = 6`, `REQUIRED_CATEGORIES`), validation error types, failure reason constants, and display formatting maps. |
| **`validator.js`** | Audits raw participant inputs for empty fields (`INVALID_PARTICIPANT`), duplicate participant IDs (`DUPLICATE_PARTICIPANT_ID`), unrecognized activity IDs (`UNKNOWN_ACTIVITY`), and repeated activity entries for the same participant (`DUPLICATE_PARTICIPATION`). |
| **`eligibility.js`** | Pure logic engine calculating point totals, covered category sets, eligibility status, exact failure reason ordering (`LEARN` $\rightarrow$ `BUILD` $\rightarrow$ `SHARE` $\rightarrow$ `POINTS_BELOW_6`), and result sorting (Eligible first, ID ascending). |
| **`renderer.js`** | Renders HTML templates into DOM containers (`renderFixedActivitiesTable`, `renderParticipantInputTable`, `renderValidationBanner`, `renderResultsSection`). |
| **`app.js`** | Orchestrates application memory state (`appState`), handles **Evaluate** and **Reset** button actions, syncs input changes, and invokes validation, evaluation, and rendering pipelines. |
| **`tests/eligibility.test.js`** | Standalone ES module unit test suite verifying all 9 required acceptance scenarios independently of the DOM. |

---

##  Data & Execution Flow

```text
User Interaction (Click Evaluate / Reset / Type Input)
                     │
                     ▼
                 `app.js` (Orchestrator)
                     │
                     ▼
           `validator.js` (`validateParticipantData`)
           ├── Checks non-empty, uniqueness, activity catalog & duplicate participation
           │
           ├── INVALID? ──► Set validationError, clear evaluationResult (Stale Data Rule)
           │
           └── VALID?   ──► Call `eligibility.js` (`evaluateEligibility`)
                                   │
                                   ▼
                             Calculate Points, Categories, Reasons & Sort
                                   │
                                   ▼
                             Set state.evaluationResult
                                   │
                                   ▼
                 `renderer.js` (`renderAll`)
                     │
                     ▼
               Update Browser DOM
```

---

##  How to Run & Verify

### 1. View in Browser
Open `index.html` directly in any web browser (or run via a local HTTP server such as `npx serve .` or `python -m http.server 8000`).

### 2. Run Automated Unit Tests
Run the standalone test runner using Node.js (with ES module support):
```bash
node --experimental-modules tests/eligibility.test.js
```
*(or run via Node v14+)*
