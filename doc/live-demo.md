# Live Demo — AI Agentic Computer Use

## What the demo shows to the user

The demo slide is titled **"AI Agentic Computer Use — Insurance Prior-Authorization Workflow"**. It is slide 14 in the investor pitch deck and is hidden on mobile.

The user sees a split layout:

- **Left (63%)** — A simulated healthcare web UI with two pages the AI navigates through
- **Right (37%)** — An AI agent panel showing real-time activity logs

### Two-page workflow

**Page 1 — Patient Data Card** (`PatientDataCard.tsx`)
A read-only card displaying a randomly generated patient record with four sections: Patient Demographics, Insurance Information, Clinical Information, and Requesting Provider. At the bottom is a "Next Page →" button (`id="next-page-btn"`). This page is what the AI sees first via screenshot and must read before proceeding.

**Page 2 — Authorization Form** (`AuthorizationForm.tsx`)
A form with 14 read-only inputs that the AI fills in by clicking each field and typing. The inputs are controlled by React state (`formValues`) managed in `useDemoLoop`. Each input has a `data-field` attribute matching the `PatientData` key (e.g. `data-field="firstName"`). When a field is being typed into, it receives the `af-field--active` CSS class for a visual highlight.

### AI agent panel (`DemoAIPanel.tsx`)

- **Start Demo** button — kicks off the loop; shows a spinner while running
- **Refresh** button — replaces the Start button after completion or error; generates a new random patient and resets all state
- **Thinking dots** — animated while the AI is running
- **Activity Log** — reverse-chronological list of timestamped steps (newest at top), showing screenshot captures, field clicks, typing events, API calls, and completion/error status
- **"Workflow complete" banner** — shown on success
- **Error banner** — shown on failure

---

## Patient data generation (`generatePatientData.ts`)

Each run of the demo uses a fresh randomly generated `PatientData` object. Data is entirely fake but realistic-looking. The 14 fields are:

| Field | Type |
|---|---|
| `firstName`, `lastName` | Picked from pools of 20 US names |
| `dob` | Random date, ages 22–74, format `MM/DD/YYYY` |
| `phone` | Format `(NXX) NXX-XXXX` |
| `address` | Random street number + street name + US city + ZIP |
| `insurance` | One of 6 major US carriers (BCBS, Aetna, Cigna, UHC, Humana, Kaiser) |
| `memberId` | Two-letter carrier prefix + 9 random digits |
| `groupNumber` | Format `GRP-NNNNN` |
| `diagnosisCode`, `diagnosisDesc` | ICD-10 code + description, from pool of 6 realistic procedures |
| `cptCode`, `procedureName` | CPT code + procedure name (matched to diagnosis) |
| `providerName`, `providerNpi` | One of 5 realistic physician names with real-format 10-digit NPIs |

Clinical cases include: Total Knee Arthroplasty, Laparoscopic Cholecystectomy, TURP, Lumbar Spinal Fusion, Coronary Artery Bypass Graft, Cataract Removal.

On **Refresh**, `generatePatientData()` is called again and new data is passed through the entire system.

---

## How the demo loop works (`useDemoLoop.ts`)

The `useDemoLoop` hook drives everything. It is called from `SlideDemo.tsx` and owns all demo state:

| State | Description |
|---|---|
| `status` | `"idle" \| "running" \| "done" \| "error"` |
| `logs` | Array of `{ id, time, text }` log entries |
| `demoPage` | `"data" \| "form"` — controls which page is rendered |
| `formValues` | `Partial<Record<keyof PatientData, string>>` — current field values in the form |
| `activeField` | Which field is currently being typed into |
| `cursorRipples` | Array of `{ id, x, y }` for ripple animations |

### Loop sequence

1. **Screenshot**: `html2canvas` captures the `demoAreaRef` element (the left panel) and normalises it to **1440×900 px** — the fixed coordinate space the AI works in.
2. **POST /api/computer-use/start**: Sends the base64 screenshot and a plain-English task prompt. Returns `{ callId, responseId, actions[], logs[], done }`.
3. **Execute actions**: The `executeActions()` function processes each action:
   - `screenshot` — captures a new screenshot and immediately POSTs to `/continue`
   - `click` / `double_click` — maps model coordinates (1440×900) to real DOM coordinates via `mapCoords()`, detects if the target is `#next-page-btn` (triggers page transition) or a form field (stores field key in `lastClickedFieldRef`), shows a ripple animation
   - `type` — reads `lastClickedFieldRef.current` to know which field to animate into; calls `animateType()` which writes the text character-by-character at 40 ms/char
   - `scroll`, `keypress`, `wait` — handled with appropriate side effects
4. **POST /api/computer-use/continue**: After each action batch, a fresh screenshot is captured and sent back to the model with the previous `callId` and `responseId`.
5. Loop continues until the backend returns `done: true`.

### Key implementation detail — `lastClickedFieldRef`

The AI sends a `click` action followed by a `type` action for each field. React state (`activeField`) cannot be reliably read inside the async `executeActions` callback due to closure staleness. The solution is a mutable ref (`lastClickedFieldRef`) that is set when a field is clicked and read when the next `type` action arrives. This is what makes the form actually fill in.

### Screenshot capture

```typescript
html2canvas(demoAreaRef.current, {
  scale: 1,
  useCORS: true,
  allowTaint: true,
  backgroundColor: "#001810",
})
// Then redrawn onto a 1440×900 canvas and base64-encoded (PNG, no data: prefix)
```

### Coordinate mapping

Model coordinates (in 1440×900 space) are mapped to actual DOM coordinates using the `demoAreaRef` bounding rect:

```typescript
domX = rect.left + (mx / 1440) * rect.width
domY = rect.top  + (my / 900)  * rect.height
```

Percent coordinates for ripple placement use `(mx / 1440) * 100`.

---

## Backend server (`server/src/routes/computerUse.ts`)

The Express server runs on Railway at `https://mayipitchdeck-production.up.railway.app`. It has two endpoints:

### `POST /api/computer-use/start`

**Request body:**
```json
{ "screenshot": "<base64 PNG>", "task": "<plain English task description>" }
```

**What it does:** Creates an `AzureOpenAI` client and calls `client.responses.create()` using the Responses API with the `computer` tool (or `computer_use_preview` if `AZURE_USE_LEGACY_TOOL=true`). Sends the task text and initial screenshot as `input_image`.

**Response body:**
```json
{
  "callId": "...",
  "responseId": "...",
  "actions": [{ "type": "click", "x": 391, "y": 170 }, ...],
  "logs": ["🧠 Azure OpenAI computer-use session started", "🖱️ AI clicking at (391, 170)"],
  "done": false
}
```

### `POST /api/computer-use/continue`

**Request body:**
```json
{ "screenshot": "<base64 PNG>", "callId": "...", "responseId": "..." }
```

**What it does:** Calls `client.responses.create()` with `previous_response_id` (for conversation continuity) and a `computer_call_output` input containing the new screenshot. The model sees the result of its last action and decides the next steps.

**Response body:** Same shape as `/start`. When the model has no more actions, `done: true` is returned with an empty `actions` array.

### Azure OpenAI configuration

Required environment variables on Railway:

| Variable | Description |
|---|---|
| `AZURE_OPENAI_ENDPOINT` | Azure endpoint URL |
| `AZURE_OPENAI_KEY` | API key |
| `AZURE_OPENAI_DEPLOYMENT` | Deployment name |
| `AZURE_OPENAI_API_VERSION` | Defaults to `2025-04-01-preview` |
| `AZURE_USE_LEGACY_TOOL` | Set `true` to use `computer_use_preview` shape instead of GA `computer` |
| `PORT` | Set automatically by Railway |

The tool definition for the GA shape is simply `{ type: "computer" }`. For the legacy shape it includes `display_width: 1440`, `display_height: 900`, and `environment: "browser"`.

---

## File structure

```
src/components/demo/
  SlideDemo.tsx          — Root slide component; layout, AnimatePresence page transitions
  PatientDataCard.tsx    — Page 1: read-only patient data display
  AuthorizationForm.tsx  — Page 2: 14-field form with controlled read-only inputs
  DemoAIPanel.tsx        — Right panel: start button, logs, status banners
  useDemoLoop.ts         — Core hook: screenshot loop, action executor, form state
  generatePatientData.ts — Random patient data factory

server/src/
  index.ts               — Express app, wildcard CORS, routes
  routes/computerUse.ts  — /start and /continue endpoints, Azure OpenAI Responses API

railway.toml             — Root config; buildCommand: cd server && npm ci, startCommand: cd server && npx tsx src/index.ts
.env.production          — VITE_API_BASE_URL=https://mayipitchdeck-production.up.railway.app
```

---

## Visibility rules

- The demo slide is **excluded from the slides array on mobile** (`<= 768px`): `SLIDES.filter((s) => s !== "demo")`
- The "Live Demo" agenda item on slide 1 is also **filtered out on mobile**.
- The demo is slide index 13 in the full `SLIDES` array (0-indexed), page number 14 in the agenda.
