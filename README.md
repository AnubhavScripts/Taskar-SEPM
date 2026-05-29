# RippleEffect — Decision Impact & Deadline Simulation System

## 🚀 Quick Start

### Terminal 1 — Backend
```bash
cd /Users/anubhavparashar/Documents/SEPM/backend
node server.js
# ✅ API: http://localhost:8001
# ✅ MongoDB Atlas connected
```

### Terminal 2 — Frontend
```bash
cd /Users/anubhavparashar/Documents/SEPM/frontend
npm run dev
# ✅ App: http://localhost:5174
```

---

## 📁 Project Structure

```
SEPM/
├── backend/
│   ├── config/db.js                  # MongoDB Atlas connection
│   ├── models/Project.js             # Mongoose schema (tasks + simulation history)
│   ├── services/
│   │   ├── nlpService.js             # Text → structured tasks (regex + heuristics)
│   │   ├── graphService.js           # DAG, CPM, critical path, bottlenecks
│   │   ├── simulationService.js      # BFS ripple propagation
│   │   └── predictionService.js      # Rule-based risk scoring + recommendations
│   ├── controllers/
│   │   ├── projectController.js      # Extract, save, list, get, delete
│   │   └── simulationController.js   # Run sim, get history
│   ├── routes/
│   │   ├── projects.js               # /api/projects/*
│   │   └── simulate.js               # /api/simulate/*
│   ├── server.js                     # Express entry point
│   └── .env                          # PORT + MONGO_URI
│
└── frontend/
    ├── src/
    │   ├── App.jsx                   # Root view router
    │   ├── index.css                 # Tailwind + global styles
    │   └── components/
    │       ├── Navbar.jsx            # Sticky nav with scroll effect
    │       ├── StepBar.jsx           # 5-step progress indicator
    │       ├── LandingView.jsx       # Hero + How it works + Features
    │       ├── InputView.jsx         # Text input + examples
    │       ├── ReviewView.jsx        # Task table + Gantt + recommendations
    │       ├── SimulateView.jsx      # Per-task delay controls
    │       ├── ResultsView.jsx       # Ripple impact report + updated Gantt
    │       └── GanttChart.jsx        # Reusable Gantt bar component
    ├── tailwind.config.js            # Custom design tokens
    └── index.html                    # SEO meta tags
```

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/projects/extract` | NLP extract + save project |
| `GET` | `/api/projects` | List all projects |
| `GET` | `/api/projects/:id` | Get single project |
| `DELETE` | `/api/projects/:id` | Delete project |
| `POST` | `/api/simulate/:projectId` | Run ripple simulation |
| `GET` | `/api/simulate/:projectId/history` | Simulation history |

### Extract Request Body
```json
{
  "rawInput": "Frontend takes 5 days. Backend depends on frontend, takes 7 days...",
  "title": "My Project"
}
```

### Simulate Request Body
```json
{
  "delays": [
    { "taskId": 1, "delayDays": 3 },
    { "taskId": 2, "delayDays": 2 }
  ]
}
```

---

## 🧠 How It Works

### NLP Pipeline
1. Split text into sentences
2. Extract durations via regex (`5 days`, `2 weeks`, `1 month`)
3. Extract task names via domain-term matching + heuristics
4. Infer dependencies via connective phrases (`depends on`, `after`, `once X is done`)

### CPM Scheduling
1. Build directed acyclic graph (DAG)
2. Topological sort via Kahn's algorithm
3. Forward pass → Earliest Start/Finish per task
4. Backward pass → Latest Start/Finish, compute slack
5. Critical Path = tasks with zero slack

### Ripple Simulation
1. Add delay to target task's duration
2. BFS from target → propagate to all transitive dependents
3. Re-run full CPM on modified graph
4. Generate delta report (originalEnd → newEnd, daysPushed)

### Risk Prediction (Rule-based)
- **High**: Critical path + many dependents (score ≥ 60)
- **Medium**: Critical path OR many dependents (score 30–60)
- **Low**: Neither (score < 30)
- Confidence = `100 - (avgRiskScore × 0.7)`

---

## ✅ Verified Pipeline (Smoke Test)

```
Input: "Frontend 5d → Backend 7d (dep: Frontend) → Testing 4d (dep: both) → Deploy 2d"

EXTRACTED:
  ⚡ #1 Frontend design    5d  Day 0→5   risk:high
  ⚡ #2 Backend API        7d  Day 5→12  risk:medium
     #3 Database setup     3d  Day 0→3   risk:low
  ⚡ #4 Testing            4d  Day 12→16 risk:medium
  ⚡ #5 Deployment         2d  Day 16→18 risk:medium

  Total: 18 days | Critical Path: [1,2,4,5] | Risk: High | Confidence: 67%

SIMULATE Frontend +3 days:
  #1 Frontend    5d → 8d   (+3d) ← direct delay
  #2 Backend     12d → 15d (+3d) ← rippled
  #3 DB Setup    3d → 3d   (—)   ← unaffected
  #4 Testing     16d → 19d (+3d) ← rippled
  #5 Deployment  18d → 21d (+3d) ← rippled

  Project: 18d → 21d (+3 days delayed) ✅
```
# Taskar-SEPM
