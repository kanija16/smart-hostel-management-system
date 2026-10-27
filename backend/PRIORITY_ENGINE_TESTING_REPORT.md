# Software Testing Assignment Report: Priority Determination Engine

**Project Title:** Smart Hostel Management System with AI-Based Complaint Classification and Prioritization  
**Target Module:** `backend/app/services/priority_engine.py`  
**Target Function:** `determine_priority(text: str, category: str, is_fallback: bool = False) -> Tuple[str, str]`  
**Testing Framework:** `pytest` (with `pytest-html` plugin)  
**Execution Environment:** Windows 11, Python 3.12.10, pytest 9.1.1  
**Status:** **ALL 33 UNIT TESTS PASSED (0.15s) | FULL SYSTEM: 59/59 TESTS PASSED (18.35s)**

---

## 1. Executive Summary & Objective

In modern hostel management systems, student complaints vary widely from minor aesthetic concerns (such as chipped paint) to life-threatening emergencies (such as electrical arcing or gas leaks). While the system employs a Machine Learning classifier (**TF-IDF + Multinomial Naive Bayes**) to categorize complaints into functional domains (*Plumbing, Electrical, Cleaning, Maintenance, Internet, Security, Other*), the **Priority Determination Engine** is deliberately built as a **deterministic, rule-based safety engine**. 

The objective of this software testing assignment was to:
1. Thoroughly inspect `app/services/priority_engine.py` and its interaction with the ML pipeline.
2. Uncover and analyze genuine functional defects and edge case vulnerabilities.
3. Remediate these bugs by enhancing the safety heuristics without architectural deviation.
4. Construct an automated test suite in `tests/test_priority_engine.py` covering all priority tiers, edge cases, boundaries, and regression verifications.
5. Execute the tests via `pytest`, capture authentic execution logs, and generate an interactive HTML test report (`priority_test_report.html`).
6. Confirm that the full backend test suite experiences **zero regressions**.

---

## 2. Architecture: ML Classification vs. Deterministic Priority Engine

A common pitfall in safety-critical automated systems is conflating probabilistic ML predictions with deterministic safety rules. The architecture preserves this vital separation of concerns:

```
                            +---------------------------------------+
                            |     Student Complaint Submission      |
                            | (e.g., "Water leaking on switchboard")|
                            +---------------------------------------+
                                                |
                                                v
                            +---------------------------------------+
                            |       TF-IDF + MultinomialNB          |
                            |       Machine Learning Model          |
                            +---------------------------------------+
                                                |
                                   (Predicted Category, e.g. "Electrical")
                                   (Confidence Score, e.g. 0.94)
                                   (Fallback Flag: False)
                                                |
                                                v
                            +---------------------------------------+
                            |      Priority Determination Engine    |
                            |       `determine_priority()`          |
                            +---------------------------------------+
                                                |
       +----------------------------------------+----------------------------------------+
       |                                        |                                        |
       v                                        v                                        v
[Critical Safety Heuristics]             [Outage / Access Heuristics]             [Category Defaults / Fallback]
- Fire / Sparks                          - Total Blackouts                        - Electrical -> High
- Water + Electrical interaction         - No Water / Sewage                      - Plumbing -> Medium
- Stolen Laptop / Theft                  - Lock Jammed / Broken Glass             - Internet -> Medium
- Flooded Room / Burst Pipe              - Exam Wi-Fi Outage                      - Fallback -> Low (Triage)
       |                                        |                                        |
       +----------------------------------------+----------------------------------------+
                                                |
                                                v
                            +---------------------------------------+
                            |      Final Assigned Priority &        |
                            |         Auditable Reason              |
                            |    ("Critical", "Immediate hazard...")|
                            +---------------------------------------+
```

### Key Architectural Tenet:
- **ML Classifier Responsibility:** Predicts domain topic category (`Electrical`, `Plumbing`, etc.) and determines if the query is out-of-vocabulary (`is_fallback=True`).
- **Priority Engine Responsibility:** Enforces deterministic severity rules, ensuring immediate life-safety hazards, structural risks, and acute academic emergencies are prioritized without risk of machine learning hallucination or statistical misranking.

---

## 3. Discovered Defects & Root Cause Analysis

During inspection and rigorous exploratory testing of `app/services/priority_engine.py`, **six genuine bugs and deficiencies** were discovered:

| Defect ID | Defect Description | Root Cause in Original Code | Severity |
| :--- | :--- | :--- | :--- |
| **BUG-01** | **Water leaking near electrical switchboards assigned `High` instead of `Critical`.** | In the original code, `\b(leak\|dripping)\b.*\b(switch\|socket\|plug\|wire\|electricity)\b` was placed inside `HIGH_PATTERNS`. Water interacting with electrical equipment is an immediate electrocution and arc-flash fire hazard. Furthermore, the regex only checked one word ordering (`leak ... switch`), failing on `switchboard has water dripping`. | **Critical** |
| **BUG-02** | **Theft and stolen property (e.g. laptops) failed to trigger `Critical`.** | `CRITICAL_PATTERNS` only matched the singular noun `\bthief\b`. Common complaint descriptions such as *"Laptop was stolen"*, *"Theft reported in room 102"*, or *"Someone broke in and stole my wallet"* did not contain the exact token `thief`, causing serious criminal security incidents to drop to lower priority levels. | **High** |
| **BUG-03** | **Flooded rooms failed to trigger `Critical`.** | The flood regex strictly looked for `massive flood|severe flood|flooding everywhere`. Natural student complaints like *"Room is flooded"* or *"Hallway is flooded"* failed the regex match and were downgraded. | **High** |
| **BUG-04** | **Burst pipe variations missed.** | The pattern only allowed `burst pipe|pipe burst`. Phrasings like *"water pipe has burst"* or *"pipe broken"* were missed. | **Medium** |
| **BUG-05** | **Incomplete fixture variation matching.** | In `MEDIUM_PATTERNS`, the engine only matched `socket loose`, failing when a student wrote `"loose socket makes plug wobble"`. Consequently, unpatterned electrical issues fell through to the `Electrical` category default, improperly jumping to `High`. | **Medium** |
| **BUG-06** | **Defensive input vulnerability & crash risk.** | `determine_priority` directly called `text.lower()` without checking if `text` was `None`, causing an unhandled `AttributeError`. Furthermore, empty string `""` or whitespace-only inputs were not explicitly validated, causing unnecessary regex execution. Category comparisons were case-sensitive (`category == "Security"`), failing for lowercase inputs (`"security"`). | **Medium** |

---

## 4. Bug Fixes & Enhancements Applied

In `backend/app/services/priority_engine.py`, the following fixes were implemented:

1. **Relocated and Expanded Water-Electrical Hazards to `CRITICAL_PATTERNS`:**
   ```python
   # Bi-directional proximity detection covering water/leaks and electrical infrastructure
   r"\b(leak|leaking|dripping|water|spray|spraying|seeping)\b.*\b(switch|switchboard|socket|plug|wire|wiring|electricity|electrical|breaker|fuse\s*box)\b",
   r"\b(switch|switchboard|socket|plug|wire|wiring|electricity|electrical|breaker|fuse\s*box)\b.*\b(leak|leaking|dripping|water|spray|spraying|seeping)\b"
   ```

2. **Added Criminal Security & Stolen Valuables Detection to `CRITICAL_PATTERNS`:**
   ```python
   r"\b(break-in|thief|theft|stolen|robbery|burglar|burglary|stole|intruder|assault|weapon|harassment|stalking|violence|threat)\b",
   r"\b(laptop|phone|wallet|valuables|money)\b.*\b(stolen|theft|robbed|missing)\b",
   r"\b(stolen|theft|robbed)\b.*\b(laptop|phone|wallet|valuables|money)\b"
   ```

3. **Broadened Flooding and Pipe Burst Heuristics:**
   ```python
   r"\b(burst\s+pipe|pipe\s+burst|pipe\s+has\s+burst|bursting\s+pipe|water\s+pipe\s+burst|pipe\s+broken)\b",
   r"\b(flooded|flooding|massive\s+flood|severe\s+flood|flooding\s+everywhere|water\s+gushing|water\s+overflowing)\b"
   ```

4. **Added Symmetric Fixture Variations to `MEDIUM_PATTERNS`:**
   ```python
   r"\b(fan not working|fan speed|light not working|bulb fused|fused bulb|socket loose|loose socket|switch not working|loose switch)\b"
   ```

5. **Robust Input Sanitization and Case Normalization:**
   ```python
   if text is None:
       text = ""
   clean_text = str(text).strip()
   if not clean_text:
       if is_fallback:
           return ("Low", "General or ambiguous complaint requiring manual warden review and triage.")
       return ("Low", "Empty or uninformative complaint text provided. Assigned Low priority pending review.")

   text_lower = clean_text.lower()
   cat_normalized = (category or "").strip().capitalize()
   ```

6. **Safety Override Preservation:**
   Even when an out-of-vocabulary complaint sets `is_fallback=True`, `CRITICAL_PATTERNS` are evaluated first. If a critical keyword (fire, explosion, theft, water on switchboard) is found, safety overrides take precedence and immediately return `Critical`.

---

## 5. Automated Test Suite Structure & Coverage Matrix

The dedicated test file `backend/tests/test_priority_engine.py` contains **33 automated test functions** organized into 7 functional test classes:

| Test Class | Tests Count | Focus Area / Covered Scenarios |
| :--- | :---: | :--- |
| **`TestCriticalPriority`** | 5 | Electrical arcing/sparks, water-electrical proximity, laptop theft & robbery, room flooding & pipe bursts, gas leaks & structural collapse. |
| **`TestHighPriority`** | 6 | Total power outages, complete water cuts & sewage overflow, broken door locks & shattered windows, exam Wi-Fi outages, default security category, default electrical category. |
| **`TestMediumPriority`** | 4 | Ordinary water leaks (dripping tap, leaking faucet), routine fixtures (fan, fused bulb, loose socket, slow drains), Wi-Fi degradation, furniture maintenance, plumbing/internet/maintenance defaults. |
| **`TestLowPriority`** | 3 | Cosmetic wall scratches, peeling paint, squeaky door hinges, routine broom/dusting cleaning, cleaning/other defaults. |
| **`TestInputSanitizationAndEdgeCases`** | 6 | Empty strings `""`, whitespace strings `"   "`, `None` values, mixed case/ALL CAPS, punctuation/symbols `!!! ???`, unknown/empty categories. |
| **`TestFallbackMechanism`** | 3 | Ambiguous text fallback to `Low`, empty text fallback to `Low`, life-safety override of fallback to `Critical`. |
| **`TestBugFixRegressions`** | 6 | Direct regression locks for Bugs 01 through 06. |

### Negative Test Distinction (Ordinary Leaks vs. Critical Disasters)
A major focal point of the test suite is distinguishing **ordinary plumbing leaks** from **critical water emergencies**:
- `"Tap is leaking in bathroom sink"` -> Evaluates to **`Medium`** (routine maintenance).
- `"Bathroom faucet leaking slowly"` -> Evaluates to **`Medium`**.
- `"Room is flooded with water"` -> Evaluates to **`Critical`** (asset damage & floor inundation).
- `"Water leaking near an electrical switchboard"` -> Evaluates to **`Critical`** (electrocution hazard).
- `"Water pipe has burst"` -> Evaluates to **`Critical`** (infrastructure breach).

---

## 6. Execution Procedure & Authentic Results

### Commands Executed:
1. **Targeted Module Test with HTML and Console Output:**
   ```powershell
   .\venv\Scripts\python.exe -m pytest tests/test_priority_engine.py -v --html=priority_test_report.html --self-contained-html | Out-File -FilePath priority_test_output.txt -Encoding utf8
   ```

2. **Full System Regression Suite:**
   ```powershell
   .\venv\Scripts\python.exe -m pytest tests/ -v
   ```

### Authentic Terminal Execution Output:
```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0 -- C:\Users\kanij\OneDrive\Desktop\smart hostel management\backend\venv\Scripts\python.exe
cachedir: .pytest_cache
metadata: {'Python': '3.12.10', 'Platform': 'Windows-11-10.0.26200-SP0', 'Packages': {'pytest': '9.1.1', 'pluggy': '1.6.0'}, 'Plugins': {'anyio': '4.15.1', 'html': '4.2.0', 'metadata': '3.1.1'}}
rootdir: C:\Users\kanij\OneDrive\Desktop\smart hostel management\backend
configfile: pytest.ini
plugins: anyio-4.15.1, html-4.2.0, metadata-3.1.1
collecting ... collected 33 items

tests/test_priority_engine.py::TestCriticalPriority::test_critical_electrical_sparks_smoke_fire PASSED [  3%]
tests/test_priority_engine.py::TestCriticalPriority::test_critical_water_near_electrical_hazard_fix PASSED [  6%]
tests/test_priority_engine.py::TestCriticalPriority::test_critical_theft_and_stolen_items_fix PASSED [  9%]
tests/test_priority_engine.py::TestCriticalPriority::test_critical_flooded_rooms_and_burst_pipes_fix PASSED [ 12%]
tests/test_priority_engine.py::TestCriticalPriority::test_critical_structural_and_gas_hazards PASSED [ 15%]
tests/test_priority_engine.py::TestHighPriority::test_high_total_blackout_and_power_outages PASSED [ 18%]
tests/test_priority_engine.py::TestHighPriority::test_high_total_water_supply_loss_and_sewage PASSED [ 21%]
tests/test_priority_engine.py::TestHighPriority::test_high_broken_locks_and_window_security PASSED [ 24%]
tests/test_priority_engine.py::TestHighPriority::test_high_wifi_outage_during_exams_and_deadlines PASSED [ 27%]
tests/test_priority_engine.py::TestHighPriority::test_high_security_category_default PASSED [ 30%]
tests/test_priority_engine.py::TestHighPriority::test_high_electrical_category_baseline_default PASSED [ 33%]
tests/test_priority_engine.py::TestMediumPriority::test_medium_ordinary_water_leaks_not_critical PASSED [ 36%]
tests/test_priority_engine.py::TestMediumPriority::test_medium_fixtures_and_slow_drains PASSED [ 39%]
tests/test_priority_engine.py::TestMediumPriority::test_medium_general_wifi_and_furniture PASSED [ 42%]
tests/test_priority_engine.py::TestMediumPriority::test_medium_category_defaults PASSED [ 45%]
tests/test_priority_engine.py::TestLowPriority::test_low_cosmetic_defects PASSED [ 48%]
tests/test_priority_engine.py::TestLowPriority::test_low_minor_squeaks_and_cleaning PASSED [ 51%]
tests/test_priority_engine.py::TestLowPriority::test_low_category_defaults PASSED [ 54%]
tests/test_priority_engine.py::TestInputSanitizationAndEdgeCases::test_empty_string_handling PASSED [ 57%]
tests/test_priority_engine.py::TestInputSanitizationAndEdgeCases::test_whitespace_only_handling PASSED [ 60%]
tests/test_priority_engine.py::TestInputSanitizationAndEdgeCases::test_none_input_handling PASSED [ 63%]
tests/test_priority_engine.py::TestInputSanitizationAndEdgeCases::test_case_insensitivity_mixed_and_uppercase PASSED [ 66%]
tests/test_priority_engine.py::TestInputSanitizationAndEdgeCases::test_punctuation_and_special_characters PASSED [ 69%]
tests/test_priority_engine.py::TestInputSanitizationAndEdgeCases::test_unknown_and_empty_category PASSED [ 72%]
tests/test_priority_engine.py::TestFallbackMechanism::test_fallback_ambiguous_text_assigned_low PASSED [ 75%]
tests/test_priority_engine.py::TestFallbackMechanism::test_fallback_empty_text_assigned_low PASSED [ 78%]
tests/test_priority_engine.py::TestFallbackMechanism::test_safety_override_preserves_critical_on_fallback PASSED [ 81%]
tests/test_priority_engine.py::TestBugFixRegressions::test_regression_bug1_water_near_electrical_is_critical PASSED [ 84%]
tests/test_priority_engine.py::TestBugFixRegressions::test_regression_bug2_theft_and_stolen_laptop_is_critical PASSED [ 87%]
tests/test_priority_engine.py::TestBugFixRegressions::test_regression_bug3_flooded_room_is_critical PASSED [ 90%]
tests/test_priority_engine.py::TestBugFixRegressions::test_regression_bug4_pipe_has_burst_is_critical PASSED [ 93%]
tests/test_priority_engine.py::TestBugFixRegressions::test_regression_bug5_ordinary_leaks_remain_medium PASSED [ 96%]
tests/test_priority_engine.py::TestBugFixRegressions::test_regression_bug6_empty_and_none_inputs_handled_safely PASSED [100%]

- Generated html report: file:///C:/Users/kanij/OneDrive/Desktop/smart%20hostel%20management/backend/priority_test_report.html -
======================== 33 passed, 1 warning in 0.15s ========================
```

### Full System Test Suite Metrics:
- **Total Backend Tests:** 59
- **Passed:** 59
- **Failed:** 0
- **Duration:** 18.35s
- **Breakdown:**
  - `tests/test_priority_engine.py`: 33 passed
  - `tests/test_assignment_10.py`: 10 passed
  - `tests/test_ai_classifier.py`: 10 passed
  - `tests/test_auth.py`: 5 passed
  - `tests/test_e2e_workflow.py`: 1 passed

---

## 7. Deliverable File Artifacts

The following files constitute the test submission evidence:
1. **Module Source Code:** [`backend/app/services/priority_engine.py`](file:///c:/Users/kanij/OneDrive/Desktop/smart%20hostel%20management/backend/app/services/priority_engine.py)
2. **Automated Test Suite:** [`backend/tests/test_priority_engine.py`](file:///c:/Users/kanij/OneDrive/Desktop/smart%20hostel%20management/backend/tests/test_priority_engine.py)
3. **Pytest Text Execution Output:** [`backend/priority_test_output.txt`](file:///c:/Users/kanij/OneDrive/Desktop/smart%20hostel%20management/backend/priority_test_output.txt)
4. **Pytest HTML Visual Test Report:** [`backend/priority_test_report.html`](file:///c:/Users/kanij/OneDrive/Desktop/smart%20hostel%20management/backend/priority_test_report.html)
5. **Testing Assignment Report:** [`backend/PRIORITY_ENGINE_TESTING_REPORT.md`](file:///c:/Users/kanij/OneDrive/Desktop/smart%20hostel%20management/backend/PRIORITY_ENGINE_TESTING_REPORT.md)

---

## 8. Limitations & Recommendations for Future Iterations

1. **Polysemy and Context-Aware Negation:**
   - Current heuristics use regular expressions with word boundary checks (`\b`). While highly performant and deterministic, complex negated sentences (e.g., *"There is no water leak near the switchboard, but it is dirty"*) may trigger the proximity pattern.
   - *Recommendation:* Incorporate dependency parsing or lightweight negation phrase windowing (`not`, `no`, `neither`) in future revisions.
2. **Multi-Hazard Co-occurrence Scoring:**
   - When multiple patterns match (e.g., an outage and cosmetic issue), the engine returns on first match prioritizing `Critical -> High -> Medium -> Low`. While correct for safety escalation, logging all detected hazards into an array would provide wardens richer audit diagnostics.
3. **Dynamic Rule Configuration:**
   - The regex patterns are currently compiled into Python modules. A future enhancement could allow hostel administrators or head wardens to configure custom emergency keywords via an authenticated admin dashboard backed by SQLite.
