# 🚛 TT Xpress — Vehicle Service Intake Form

A production-grade, front-end only **Vehicle Service Intake Form** built with **React.js**, featuring conditional rendering, real-time validation, a dynamic health report page, and a dark/light theme toggle.

> Built as part of the SDE Full Stack Interview Assignment for **TT Xpress**.

---

## 🔗 Live Demo

👉 **[View Live on Netlify](https://your-netlify-url.netlify.app)**

---

## ✨ Features

- **Multi-section form** — Vehicle Info, Fleet Owner Details, Service Details, Inspection
- **Conditional rendering** — General Service fields appear/disappear dynamically based on Job Type selection
- **Real-time validation** — All fields validated on blur and on submit with inline error messages
- **Interactive UI elements** — Visual job type cards, icon-based radio buttons, battery health slider
- **Report Page** — On submit, a full structured report is generated showing:
  - Vehicle & owner details
  - Overall health score (0–100) with color-coded ring
  - Per-metric health bars
  - Auto-generated recommendations based on condition inputs
  - Status banner: ✅ Good / ⚠️ Needs Attention / 🚨 Critical
- **Dark / Light theme toggle** — Smooth transition between dark and light modes
- **Fully responsive** — Works on mobile, tablet, and desktop
- **Console logging** — Submitted form data logged as structured JSON

---

## 🖥️ Tech Stack

| Technology | Usage |
|---|---|
| React.js | Frontend framework |
| CSS-in-JS | Styling via injected `<style>` tag |
| Google Fonts | Rajdhani + Inter typography |
| React Hooks | `useState`, `useCallback` for state & performance |

---

## 📋 Form Fields

### Base Fields (Always Visible)
- Vehicle Number
- Company Name
- Fleet Owner Name
- Fleet Owner Contact *(phone validation)*
- Fleet Owner Email *(email validation)*
- Issue Description *(multi-line)*
- Job Type *(Quick Service / General Service — visual card selector)*

### Conditional Fields *(visible only when General Service is selected)*
- Exterior Body Condition *(radio: Good / Minor Damage / Major Damage)*
- Paint Condition *(radio: Good / Faded / Scratched/Chipped)*
- Battery Health *(interactive range slider, 0–100%)*
- Tyre Pressure *(text input, e.g. 32 PSI)*

---

## 🚀 Getting Started

### Prerequisites
- Node.js v16+ → [Download here](https://nodejs.org)
- npm v8+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/tt-xpress-vehicle-intake.git

# 2. Navigate into the project
cd tt-xpress-vehicle-intake

# 3. Install dependencies
npm install

# 4. Start the development server
npm start
```

App will open at **http://localhost:3000**

---

## 📁 Project Structure

```
tt-xpress-vehicle-intake/
├── public/
│   └── index.html
├── src/
│   └── App.js          ← entire application (single-file React component)
├── package.json
└── README.md
```

---

## 🧠 Key Technical Decisions

**Why single file?**
The entire app lives in `App.js` as per the front-end only requirement. No backend, no external CSS files, no additional dependencies beyond React.

**Focus bug prevention**
All sub-components (`Field`, `ScoreRing`, `ReportPage`) are defined **outside** the main `App` function so React never remounts them on state change, preventing input focus loss on every keystroke.

**Performance**
`useCallback` is used on `handleChange` and `handleBlur` to keep handler references stable across renders.

---

## 📸 Screenshots

### Form — Dark Mode
> Clean dark interface with sectioned layout and visual job type selector

### Form — Light Mode  
> Fully themed light mode with smooth CSS transition

### Report Page
> Auto-generated health report with score ring, metrics, and recommendations

---

## 📦 Build for Production

```bash
npm run build
```

Creates an optimized production build in the `/build` folder.

---

## 👨‍💻 Author

**Saksham**  
SDE Interview Assignment — TT Xpress  
February 2026

---

## 📄 License

This project was built as part of a technical interview assignment for TT Xpress.
