# Smart Hostel Management System with AI-Based Complaint Classification & Prioritization

A production-ready full-stack hostel administration and student grievance triage system. The application combines **FastAPI**, **SQLite**, **React + Vite**, and **scikit-learn** machine learning to automate complaint categorization, safety prioritization, room allocations, and role-based workflows for Students, Wardens, and Administrators.

---

## 🌟 Key Features

### 1. Role-Based Access Control (RBAC) & Authentication
- **Student, Warden, and Admin roles** with secure JWT authentication (HS256) and bcrypt password hashing.
- Strict authorization barriers: Students cannot view other students' complaints or modify staff triage fields (HTTP 403 Forbidden).

### 2. Student Resident Portal
- View profile details, student ID, and allocated room number.
- Browse hostel room directory and real-time room vacancies across Blocks A, B, and C.
- Submit room allocation and room change requests with tracking of approval status and administrator remarks.
- Submit maintenance grievances with **live AI classification preview** as they type.
- View complaint history, status tracking (`Submitted`, `In Progress`, `Resolved`, `Rejected`), and resolution notes.

### 3. AI Complaint Classification & Prioritization
- **Category Machine Learning Classifier**: Powered by a trained scikit-learn pipeline using **TF-IDF Vectorizer** (n-grams 1-2, sublinear scaling) and **Multinomial Naive Bayes** (smoothing alpha=0.1) across 7 canonical categories:
  - `Plumbing`
  - `Electrical`
  - `Cleaning`
  - `Maintenance`
  - `Internet`
  - `Security`
  - `Other`
- **Severity & Hazard Evaluation Engine**: Rule-based safety triage that assigns `Critical`, `High`, `Medium`, or `Low` priority based on electrical sparking, fire risks, flooding, or security breaches.
- **Documented Fallback Mechanism**: If input text contains unrecognized out-of-vocabulary tokens (gibberish/ambiguous) or prediction probability falls below the confidence threshold (0.35), the system routes to `Other` with `Low` priority and sets `is_fallback: True`.
- **Warden Oversight & Audit Trail**: Wardens can correct or override AI categories and priorities, while preserving the original predicted values and confidence score in the database.

### 4. Warden Grievance Triage Console
- Real-time complaints feed sorted by priority (`Critical` > `High` > `Medium` > `Low`) by default.
- Filter complaints by status, category, priority, and room number.
- Update workflow statuses (`Submitted` -> `In Progress` -> `Resolved` / `Rejected`) and record resolution notes.
- Inspect student contact information, room location, and AI confidence metrics.

### 5. Administrator Control Console
- High-level KPI metrics: Total Students, Total Rooms, Bed Capacity, Occupancy Rate (%), Open/Resolved Grievances, and Pending Room Requests.
- **Room Management**: Add new rooms, edit capacity and status, delete rooms (with validation to prevent deleting occupied rooms).
- **Room Request Processing**: Review pending student requests, allocate available rooms, update room occupancy counts, or reject with feedback.
- **User Directory**: Manage student residents, warden accounts, and manual room assignments.

---

## 📁 Project Structure

```
smart hostel management/
├── backend/
│   ├── app/
│   │   ├── config.py              # Application settings via pydantic-settings
│   │   ├── database.py            # SQLite engine & sessionmaker
│   │   ├── main.py                # FastAPI app, CORS, lifespan startup
│   │   ├── models/                # SQLAlchemy models (User, Room, RoomRequest, Complaint)
│   │   ├── schemas/               # Pydantic validation schemas
│   │   ├── routes/                # REST API routers (auth, rooms, complaints, requests, stats)
│   │   ├── services/              # Auth, ML Classifier (TF-IDF + MNB), Priority Engine
│   │   └── data/
│   │       ├── complaint_dataset.json  # Curated training dataset (175 samples)
│   │       ├── model.joblib            # Trained classifier artifact
│   │       └── seed.py                 # Initial database seeding script
│   ├── tests/                     # Automated test suite (26 tests)
│   │   ├── conftest.py            # Test fixtures & isolated SQLite database
│   │   ├── test_ai_classifier.py  # ML classifier and priority engine unit tests
│   │   ├── test_assignment_10.py  # 10 required software testing assignment tests
│   │   ├── test_auth.py           # Registration, login, and token tests
│   │   └── test_e2e_workflow.py   # Full-stack end-to-end integration test
│   ├── pytest.ini                 # Pytest pythonpath configuration
│   ├── requirements.txt           # Python backend dependencies
│   └── .env                       # Environment configuration
├── frontend/
│   ├── src/
│   │   ├── api/client.js          # Axios client with JWT bearer interceptor
│   │   ├── context/AuthContext.jsx # Auth state, session persistence & login
│   │   ├── components/            # Reusable UI badges, metric cards, navbar, sidebar, modal
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Login view with one-click demo presets
│   │   │   ├── Register.jsx       # Student registration view
│   │   │   ├── student/           # Student Dashboard, Submit Complaint, Room Allocation
│   │   │   ├── warden/            # Warden Triage Dashboard, Analytics, Override Modal
│   │   │   └── admin/             # Admin Dashboard, Manage Rooms, Requests, Users
│   │   ├── App.jsx                # Main layout and role-based route switching
│   │   └── index.css              # Modern design tokens and component styling
│   ├── e2e/hostel.spec.js         # Playwright end-to-end browser tests
│   ├── package.json               # Frontend dependencies & scripts
│   └── vite.config.js             # Vite configuration with API proxy
├── README.md                      # Setup and execution guide
└── TEST_REPORT.md                 # Automated test report and screenshot guide
```

---

## 🚀 Quick Setup & Run Instructions (Windows)

### Prerequisites
- **Python 3.10+** (tested on Python 3.12)
- **Node.js 18+** & **npm**

---

### Step 1: Backend Setup & Execution

Open a PowerShell or Command Prompt terminal in the `backend` folder:

```powershell
# Navigate to backend directory
cd "c:\Users\kanij\OneDrive\Desktop\smart hostel management\backend"

# Create a virtual environment (if not already created)
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\Activate.ps1
# (If in cmd.exe: .\venv\Scripts\activate.bat)

# Install dependencies
pip install -r requirements.txt

# Seed the database and train the AI model (automatically done on startup, or manually):
python -m app.data.seed

# Start the FastAPI backend server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The backend API and interactive Swagger documentation will be live at:
- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

---

### Step 2: Frontend Setup & Execution

Open a second PowerShell or Command Prompt terminal in the `frontend` folder:

```powershell
# Navigate to frontend directory
cd "c:\Users\kanij\OneDrive\Desktop\smart hostel management\frontend"

# Install frontend dependencies (if not already installed)
npm install

# Start the Vite development server
npm run dev
```

The frontend web application will be accessible in your web browser at:
- **Frontend URL**: `http://localhost:5173`

---

## 👥 Default Demo Credentials

The database comes pre-seeded with sample users across all three roles. You can click the **One-Click Demo Login** buttons on the login screen, or enter the credentials manually:

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | System Administrator | `admin@hostel.com` | `Admin@123` | Full access to rooms, users, requests & stats |
| **Warden** | Dr. Robert Miller | `warden@hostel.com` | `Warden@123` | Grievance triage, priority sorting, classification override |
| **Student 1** | Alex Johnson | `student1@hostel.com` | `Student@123` | Allocated to Room A-101; has sample complaints |
| **Student 2** | Sarah Williams | `student2@hostel.com` | `Student@123` | Allocated to Room B-101 |
| **Student 3** | David Lee | `student3@hostel.com` | `Student@123` | Unallocated; has pending room request |

---

## 🧪 Running Automated Tests

### 1. Pytest Backend Suite (Unit, Integration, and 10 Assignment Tests)

From the `backend` folder:

```powershell
cd "c:\Users\kanij\OneDrive\Desktop\smart hostel management\backend"
.\venv\Scripts\python.exe -m pytest -v
```

### 2. End-to-End User Journey Tests (Playwright)

From the `frontend` folder:

```powershell
cd "c:\Users\kanij\OneDrive\Desktop\smart hostel management\frontend"
npx playwright test
```

---

## 🤖 AI Classification Architecture & Logic

| Dimension | Implementation |
| :--- | :--- |
| **Text Vectorization** | `TfidfVectorizer(ngram_range=(1,2), sublinear_tf=True, stop_words="english")` |
| **ML Model** | `MultinomialNB(alpha=0.1)` |
| **Training Corpus** | 175 realistic complaints covering Plumbing, Electrical, Cleaning, Maintenance, Internet, Security, Other |
| **Confidence Metric** | Class posterior probability from `predict_proba()` |
| **Fallback Trigger** | Active when input words have 0 vectorizer matches (out-of-vocabulary) or max probability < 0.35 |
| **Priority Engine** | Deterministic hazard evaluation protocol for immediate emergencies (spark, smoke, burst pipe, intrusion) |
| **Warden Override** | Preserves original ML prediction and confidence score while recording warden adjustments |
