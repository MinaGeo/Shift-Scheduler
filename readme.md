# Shift Scheduler

An offline-first shift scheduling system with optional online optimization using advanced constraints.

---

## 🚀 Overview

Shift Scheduler allows organizations to manage employee shifts effectively. It supports:

* Manual or CSV-based employee & shift import
* Greedy offline scheduling (works without internet)
* Online optimization via backend (FastAPI + ILP)
* Interactive calendar view

---

## 🌐 Technologies Used

* **Frontend**: Angular 16, Bootstrap, Angular Calendar
* **Backend**: Python 3.10+, FastAPI, PuLP (for ILP)
* **Dockerized**: Yes (Docker Compose)

---

## 🤖 Features

### Offline

* CSV import for employees & shifts
* Local greedy algorithm (first-fit with skill constraints)
* Drag & drop calendar view (employee lanes)

### Online

* API health check to auto-detect backend
* Sends schedule to backend for optimal allocation
* Considers advanced constraints like overtime limits
* Displays backend response + metrics (hours, fairness)

---

## 📁 Project Structure

```
Shift Scheduler/
├── backend/
│   ├── main.py            # FastAPI entry point
│   ├── models.py          # Pydantic models
│   └── optimizer.py       # ILP scheduling logic
├── frontend/
│   ├── src/app/           # Angular components/services
│   ├── environments/      # API base URL config
│   └── ...
├── docker-compose.yml     # Runs both services
└── README.md
```

---

## 🎓 Demo Script (for video or live presentation)

1. **Intro Slide**: "Shift Scheduler - Offline-first scheduling with online optimization"
2. **Local App**

   * Open app (`localhost:3000`)
   * Show empty calendar
   * Import CSVs for employees & shifts
   * Click "Run Offline Scheduler" → Show allocation
3. **Online Optimization**

   * Run backend with Docker
   * Refresh app (detects backend)
   * Click "Optimize Online" → Show improved allocation
   * Show printed metrics from backend (fairness, overwork, etc.)
4. **Wrap Up**

   * Recap features: offline support, calendar UI, backend optimization, Docker
   * Show code folders (Angular / FastAPI)

---

## 🚀 Getting Started

### Prerequisites

* Docker & Docker Compose installed

### Run the Full System

```bash
docker compose up --build
```

* Frontend: [http://localhost:3000](http://localhost:3000)
* Backend:  [http://localhost:8000/api/health](http://localhost:8000/api/health)

### Run Frontend Locally (Dev Mode)

```bash
cd frontend
npm install
ng serve --port 3000
```

### Run Backend Locally

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 📄 CSV Formats

### Employees CSV

```
name,skills
John Doe,Math;English
Jane Smith,Physics;English
```

### Shifts CSV

```
day,hour,skill
Monday,09:00,Math
Monday,10:00,English
```

