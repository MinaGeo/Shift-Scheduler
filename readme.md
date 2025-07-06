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

* **Frontend**: Angular 22, Bootstrap, Angular Calendar
* **Backend**: Python 3.12+, FastAPI, PuLP (for ILP)
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
Sample files can be found in frontend/samples.
### Employees CSV

```
id,name,skills,max_hours,availability_start,availability_end
E1,Emp 1,"server,cook",30,2025-07-01T06:00:00,2025-07-14T22:00:00
E2,Emp 2,cashier,30,2025-07-01T06:00:00,2025-07-14T22:00:00
```

### Shifts CSV

```
id,role,start_time,end_time,required_skill
S1,shift_1,2025-07-01T08:00:00,2025-07-01T12:00:00,cook
S2,shift_2,2025-07-02T14:00:00,2025-07-02T20:00:00,cashier
```

