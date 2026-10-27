# Automated Software Testing Report

**Project Title**: Smart Hostel Management System with AI-Based Complaint Classification and Prioritization  
**Execution Timestamp**: October 14, 2026  
**Test Framework**: Pytest 9.1.1 (`pytest -v`)  
**Python Runtime**: Python 3.12.10 (win32)  
**FastAPI Version**: 0.115.5  
**Backend Pytest Result**: **26 Passed / 0 Failed (100% Success Rate)**  
**Frontend Playwright E2E Result**: **4 Passed / 0 Failed (100% Success Rate)**  

---

## 🎭 Frontend Playwright End-to-End Test Execution

```
> frontend@0.0.0 test:e2e
> playwright test

Running 4 tests using 1 worker

  ok 1 [chromium] › e2e\hostel.spec.js:4:3 › Smart Hostel Management System - E2E User Journey › Login page loads and displays title and demo accounts (6.0s)
  ok 2 [chromium] › e2e\hostel.spec.js:14:3 › Smart Hostel Management System - E2E User Journey › Student can login via demo preset and view resident dashboard (2.0s)
  ok 3 [chromium] › e2e\hostel.spec.js:26:3 › Smart Hostel Management System - E2E User Journey › Warden can login and inspect complaints triage dashboard (1.7s)
  ok 4 [chromium] › e2e\hostel.spec.js:38:3 › Smart Hostel Management System - E2E User Journey › Admin can login and inspect administration console (6.4s)

  4 passed (24.8s)
```

---

## 📊 Summary of Test Execution

```
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\Users\kanij\OneDrive\Desktop\smart hostel management\backend
configfile: pytest.ini
testpaths: tests
plugins: anyio-4.15.1
collected 26 items

tests/test_ai_classifier.py::test_classifier_plumbing_sample PASSED      [  3%]
tests/test_ai_classifier.py::test_classifier_electrical_sample PASSED    [  7%]
tests/test_ai_classifier.py::test_classifier_internet_sample PASSED      [ 11%]
tests/test_ai_classifier.py::test_classifier_cleaning_sample PASSED      [ 15%]
tests/test_ai_classifier.py::test_classifier_security_sample PASSED      [ 19%]
tests/test_ai_classifier.py::test_classifier_maintenance_sample PASSED   [ 23%]
tests/test_ai_classifier.py::test_classifier_fallback_for_nonsense PASSED [ 26%]
tests/test_priority_engine_critical_fire_hazard PASSED                   [ 30%]
tests/test_ai_classifier.py::test_priority_engine_high_exam_wifi PASSED  [ 34%]
tests/test_ai_classifier.py::test_priority_engine_low_cosmetic PASSED    [ 38%]
tests/test_assignment_10.py::test_valid_complaint_submission PASSED      [ 42%]
tests/test_assignment_10.py::test_empty_complaint_description_rejection PASSED [ 46%]
tests/test_assignment_10.py::test_plumbing_complaint_classification PASSED [ 50%]
tests/test_assignment_10.py::test_urgent_electrical_complaint_classification PASSED [ 53%]
tests/test_assignment_10.py::test_student_access_restrictions_for_other_students_complaints PASSED [ 57%]
tests/test_assignment_10.py::test_warden_complaint_status_updates PASSED [ 61%]
tests/test_assignment_10.py::test_invalid_complaint_status_rejection PASSED [ 65%]
tests/test_assignment_10.py::test_complaint_persistence_after_application_restart PASSED [ 69%]
tests/test_assignment_10.py::test_unknown_complaint_classification_fallback PASSED [ 73%]
tests/test_assignment_10.py::test_unauthorized_access_to_warden_endpoints PASSED [ 76%]
tests/test_auth.py::test_student_registration_success PASSED             [ 80%]
tests/test_auth.py::test_student_registration_duplicate_email PASSED     [ 84%]
tests/test_auth.py::test_login_success PASSED                            [ 88%]
tests/test_auth.py::test_login_invalid_credentials PASSED                [ 92%]
tests/test_auth.py::test_get_current_user_profile PASSED                 [ 96%]
tests/test_e2e_workflow.py::test_full_system_e2e_journey PASSED          [100%]

======================= 26 passed, 1 warning in 24.33s ========================
```

---

## 🎯 Verification Matrix: 10 Software Testing Assignment Requirements

| # | Requirement | Test Function | Input / Scenario | Expected Result | Actual Result | Status |
| :-: | :--- | :--- | :--- | :--- | :--- | :-: |
| **1** | **Valid complaint submission** | `test_valid_complaint_submission` | Student posts valid title, description, and room number. | HTTP 201 Created; Complaint record saved with student ID, status `Submitted`, and AI prediction. | HTTP 201; DB record verified with matching title, predicted category, and priority. | **PASS** |
| **2** | **Empty complaint description rejection** | `test_empty_complaint_description_rejection` | Student submits empty string (`""`) or whitespace (`"   "`). | HTTP 422 Unprocessable Entity; validation error returned. | HTTP 422; Pydantic validator blocked invalid submission. | **PASS** |
| **3** | **Plumbing complaint classification** | `test_plumbing_complaint_classification` | *"Water pipe leaking heavily under the bathroom sink, water overflowing onto floor"* | AI model categorizes as `Plumbing` with confidence > 50% and `is_fallback=False`. | Category = `Plumbing`, `confidence = 0.9944`, `is_fallback = False`. | **PASS** |
| **4** | **Urgent electrical complaint classification** | `test_urgent_electrical_complaint_classification` | *"Electric switchboard sparked and smoke is coming out, dangerous burning smell"* | AI categorizes as `Electrical`; priority engine assigns `Critical`. | Category = `Electrical`, Priority = `Critical`, `confidence = 0.9924`. | **PASS** |
| **5** | **Student access restrictions for other students' complaints** | `test_student_access_restrictions_for_other_students_complaints` | Student A creates complaint; Student B attempts `GET /api/complaints/{id}`. | HTTP 403 Forbidden; access denied message. | HTTP 403 Forbidden; detail: `"Access forbidden: You do not have permission..."` | **PASS** |
| **6** | **Warden complaint-status updates** | `test_warden_complaint_status_updates` | Warden calls `PATCH /api/complaints/{id}/status` with `status: "In Progress"`. | HTTP 200 OK; status updated to `In Progress` with resolution notes appended. | HTTP 200 OK; status updated and notes recorded. | **PASS** |
| **7** | **Invalid complaint status rejection** | `test_invalid_complaint_status_rejection` | Warden attempts to set status to `"ArbitraryStatus"`. | HTTP 422 Unprocessable Entity. | HTTP 422; schema validator rejected non-standard workflow status. | **PASS** |
| **8** | **Complaint persistence after application restart** | `test_complaint_persistence_after_application_restart` | Create complaint in SQLite DB, terminate database connection, recreate engine/session pointing to SQLite file. | Reconnected session loads complaint with all fields intact. | Persistent SQLite record queried with identical title, category, priority, and status. | **PASS** |
| **9** | **Unknown complaint classification fallback** | `test_unknown_complaint_classification_fallback` | Unrecognized out-of-vocabulary text: *"asdfghjk qwerty xyz123"*. | Fallback activated; category defaults to `Other`, priority `Low`, `is_fallback=True`. | Category = `Other`, Priority = `Low`, `is_fallback = True`. | **PASS** |
| **10** | **Unauthorized access to warden endpoints** | `test_unauthorized_access_to_warden_endpoints` | Student token attempts to call `PATCH /api/complaints/{id}/status` and `PATCH /api/complaints/{id}/override`. | HTTP 403 Forbidden on both endpoints. | HTTP 403 Forbidden; RBAC guard blocked non-warden user. | **PASS** |

---

## 🔬 Additional Unit and Integration Tests

### AI Classifier & Priority Engine (`tests/test_ai_classifier.py`)
- `test_classifier_plumbing_sample`: Verified plumbing vocabulary trigger.
- `test_classifier_electrical_sample`: Verified electrical classification and emergency priority.
- `test_classifier_internet_sample`: Verified Wi-Fi latency, packet loss, and router classification.
- `test_classifier_cleaning_sample`: Verified hygiene, sanitation, and pest control categorization.
- `test_classifier_security_sample`: Verified room lock, break-in, and intruder detection.
- `test_classifier_maintenance_sample`: Verified furniture, carpentry, and masonry classification.
- `test_classifier_fallback_for_nonsense`: Verified graceful low-confidence triage fallback.
- `test_priority_engine_critical_fire_hazard`: Evaluated fire hazard rule logic.
- `test_priority_engine_high_exam_wifi`: Evaluated exam-time network disruption rule.
- `test_priority_engine_low_cosmetic`: Evaluated aesthetic/cosmetic priority baseline.

### Authentication & Role-Based Access Control (`tests/test_auth.py`)
- `test_student_registration_success`: Verified registration creates bcrypt hashed user record.
- `test_student_registration_duplicate_email`: Verified duplicate email rejection with HTTP 400.
- `test_login_success`: Verified token generation with user claims (`sub`, `role`, `user_id`).
- `test_login_invalid_credentials`: Verified rejection of incorrect passwords with HTTP 401.
- `test_get_current_user_profile`: Verified `/api/auth/me` returns current user and room assignment.

### Full-Stack End-to-End Workflow (`tests/test_e2e_workflow.py`)
- Full lifecycle validation connecting Student registration -> Room request -> Complaint submission -> AI inference -> Warden priority triage -> Classification override -> Admin room allocation approval -> Resolution.

---

## 📷 How to Capture Screenshots for Your Project Submission

To document the running application for academic and demonstration reports, follow these exact steps:

### 1. Terminal Test Execution Screenshot
1. Open PowerShell and run the test suite:
   ```powershell
   cd "c:\Users\kanij\OneDrive\Desktop\smart hostel management\backend"
   .\venv\Scripts\python.exe -m pytest -v
   ```
2. Press **`Win + Shift + S`** (Windows Snipping Tool).
3. Select the terminal window showing the **`26 passed in 24.33s`** green summary line.
4. Save the screenshot as `test_results_terminal.png`.

### 2. Student Dashboard & Live AI Classification Screenshot
1. Ensure both backend and frontend servers are running:
   - Backend: `uvicorn app.main:app --reload` (Port 8000)
   - Frontend: `npm run dev` (Port 5173)
2. Open your browser at `http://localhost:5173`.
3. Log in as a student using the **"Student (Alex)"** button.
4. Click **"Submit Complaint"** in the top-right corner.
5. In the description box, type:
   > *"Water pipe leaking heavily under the bathroom sink, water overflowing onto floor"*
6. Notice the **Real-Time AI Classification** box appears below the text area showing:
   - Predicted Category: `Plumbing`
   - Severity: `Critical` or `High`
   - Confidence: `99%`
7. Press **`Win + Shift + S`** to capture the modal with the live AI prediction. Save as `student_ai_preview.png`.

### 3. Warden Complaints Triage Screenshot
1. Log out, then click **"Warden (Robert)"** on the login page and sign in.
2. The **Complaints Triage Dashboard** displays tickets sorted by priority (`Critical` at the top).
3. Click **"Manage & Update"** on any ticket to open the triage modal.
4. Expand **"Correct Classification"** to show the manual warden override controls.
5. Press **`Win + Shift + S`** to capture the triage and override console. Save as `warden_triage_console.png`.

### 4. Admin Facility Occupancy & Room Allocation Screenshot
1. Log out, then click **"Admin (System)"** on the login page.
2. The **Admin Console** displays overall room statistics, bed capacity, and occupancy percentage.
3. Click **"Room Requests"** in the sidebar to show the approve/reject panel.
4. Press **`Win + Shift + S`** to capture the room occupancy metrics and request approval modal. Save as `admin_dashboard_occupancy.png`.
