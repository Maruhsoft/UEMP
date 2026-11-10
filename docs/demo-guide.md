# UEMP Guided Demo — Full Academic Cycle

This guide demonstrates the complete student-to-lecturer-to-department-review-to-publication journey using fictitious Computer Science records. Run the stages in order. Do not skip ahead: each stage creates the data needed by the next.

## Demo environment

- Portal: https://uemp-mvp.maruhsoft.workers.dev/
- Session: 2025/2026
- Semester: First Semester
- Department: Computer Science
- Programme: B.Sc. Computer Science
- Level: 300
- Grading: 5-point scale
- Demo-only password for all accounts: UEMP-Demo-2026!

### Role accounts

| Role | Name | Sign-in email | Main task |
|---|---|---|---|
| System administrator | UEMP Demo Administrator | admin@uemp.demo | Configure and oversee the grading scale |
| Department administrator | Dr. Ada Department Admin | hod@uemp.demo | Review, approve, reject and reopen results |
| Lecturer | Dr. Tunde Lecturer | lecturer@uemp.demo | Manage assigned course rosters and enter results |
| Student | Chika Okafor | student@uemp.demo | Register courses and view published results |

All identities and academic records are fictitious. Never use these accounts for real university records.

## Student cohort

| Matric number | Student | Email |
|---|---|---|
| UEMP/2023/001 | Chika Okafor | student@uemp.demo |
| UEMP/2023/002 | Amina Yusuf | amina.yusuf@uemp.demo |
| UEMP/2023/003 | David Eze | david.eze@uemp.demo |
| UEMP/2023/004 | Fatima Bello | fatima.bello@uemp.demo |
| UEMP/2023/005 | Emeka Nwosu | emeka.nwosu@uemp.demo |
| UEMP/2023/006 | Grace Mensah | grace.mensah@uemp.demo |
| UEMP/2023/007 | Ibrahim Musa | ibrahim.musa@uemp.demo |
| UEMP/2023/008 | Zainab Aliyu | zainab.aliyu@uemp.demo |

The seven additional student accounts use the same demo-only password.

## Course catalogue

| Code | Course | Units |
|---|---|---:|
| CSC301 | Data Structures and Algorithms | 3 |
| CSC303 | Database Management Systems | 3 |
| CSC305 | Operating Systems | 3 |
| MTH301 | Numerical Methods | 2 |
| CSC307 | Software Engineering | 3 |
| CSC309 | Computer Networks | 3 |
| CSC311 | Web Application Development | 3 |
| GST301 | Entrepreneurship and Innovation | 2 |

Student registrations are deliberately varied. Chika begins with CSC301, CSC303 and MTH301; CSC305 is left available for the first registration exercise.

## The recommended live demonstration

### Stage 1 — Student signs in and registers a course

Sign in as Chika (student@uemp.demo).

1. Confirm the student dashboard and identity.
2. Open the active-semester course catalogue.
3. Review the available and already registered courses.
4. Select CSC305 — Operating Systems.
5. Submit the registration.
6. Open registered courses and confirm CSC305 is present.
7. Refresh the page and confirm it remains registered.

Expected result: Chika has CSC301, CSC303, MTH301 and CSC305 — four courses and 11 credit units. Repeating the registration must not create a duplicate.

### Stage 2 — Lecturer enters results and saves a draft

Sign out. Sign in as Dr. Tunde Lecturer (lecturer@uemp.demo).

1. Open the lecturer workspace. Eight assigned course offerings should be listed.
2. Open CSC301 — Data Structures and Algorithms.
3. Confirm the roster contains Chika, Amina, David, Emeka and Ibrahim.
4. Enter the sample scores below.
5. Save draft.
6. Refresh or reopen the course and confirm the draft remains saved.

#### CSC301 sample scores

CA is out of 30; examination is out of 70.

| Student | CA | Exam | Total | Grade |
|---|---:|---:|---:|---|
| Chika Okafor | 24 | 58 | 82 | A |
| Amina Yusuf | 22 | 55 | 77 | A |
| David Eze | 20 | 48 | 68 | B |
| Emeka Nwosu | 26 | 61 | 87 | A |
| Ibrahim Musa | 18 | 43 | 61 | B |

Expected result: a CSC301 draft and five result entries are saved. The application calculates totals and grades; the lecturer does not manually set them.

### Stage 3 — Lecturer submits the score sheet

Still signed in as lecturer:

1. Reopen the CSC301 draft.
2. Verify every registered student has both scores.
3. Select Submit for review.
4. Confirm the status changes to Submitted.
5. Confirm submitted results are locked pending review.

Expected result: CSC301 appears in the department review queue. A partial roster cannot be submitted.

### Stage 4 — Department administrator approves the results

Sign out. Sign in as Dr. Ada Department Admin (hod@uemp.demo).

1. Open the departmental result-review workspace.
2. Find and open CSC301.
3. Compare the score sheet against the sample scores.
4. Approve the submission.
5. Confirm its status becomes Approved.

Expected result: the CSC301 results are published to students. The approval is recorded in the audit trail.

### Stage 5 — Student checks the published result

Sign out. Sign in as Chika again.

1. Open the results view.
2. Confirm CSC301 shows CA 24, exam 58, total 82 and grade A.
3. Confirm unapproved drafts are not visible.
4. Confirm the result belongs to the correct semester.

Expected result: Chika sees the approved result. With only CSC301 approved, CGPA is 5.00.

CGPA = sum(credit units × grade point) / sum(credit units). Only approved results count.

### Stage 6 — Demonstrate rejection and correction

Sign in as lecturer. Open CSC303 — Database Management Systems. Enter these five scores, save the draft and submit.

| Student | CA | Exam | Total | Grade |
|---|---:|---:|---:|---|
| Chika Okafor | 21 | 47 | 68 | B |
| Amina Yusuf | 25 | 52 | 77 | A |
| Fatima Bello | 19 | 45 | 64 | B |
| Emeka Nwosu | 27 | 58 | 85 | A |
| Ibrahim Musa | 20 | 42 | 62 | B |

Then:

1. Sign in as department administrator and open CSC303.
2. Reject it with feedback: "Please verify the continuous assessment totals against the signed departmental mark sheet before resubmission."
3. Sign in as lecturer and reopen the rejected result sheet.
4. Change Chika's CA from 21 to 23. Her total becomes 70 and grade A.
5. Save the corrected draft and submit it again.
6. Sign in as department administrator, verify the correction and approve.

Expected result: CSC303 moves through Submitted → Rejected with feedback → corrected and resubmitted → Approved. Students see the final approved version, not the rejected draft.

### Stage 7 — System administrator checks grading configuration

Sign in as system administrator (admin@uemp.demo).

1. Open the grading-scale manager.
2. Review the default scale.

| Grade | Score range | Grade point |
|---|---:|---:|
| A | 70–100 | 5 |
| B | 60–69 | 4 |
| C | 50–59 | 3 |
| D | 45–49 | 2 |
| E | 40–44 | 1 |
| F | 0–39 | 0 |

3. Review complete 0–100 coverage, no gaps or overlaps, unique grade labels and grade-point validation.
4. Do not change the scale during the main walkthrough unless deliberately demonstrating configuration.

Expected result: system administrator can edit the scale; department administrator can view but not edit. A grade already used by a result cannot be removed. Historical result entries retain their stored grade points.

## Workflow map

Normal publication path:

Student registration → Lecturer score entry → Draft saved → Lecturer submission → Department review → Approval and publication → Student views result.

Correction path:

Submitted → Rejected with mandatory feedback → Lecturer corrects → Lecturer resubmits → Department approves.

Administrative exception:

Approved or rejected → Administrator reopens → Lecturer corrects and resubmits.

Students should only see approved results.

## Presenter validation checklist

| Check | Expected evidence |
|---|---|
| Student sign-in | Chika's dashboard opens |
| Course catalogue | Eight 300-level offerings |
| Course registration | CSC305 persists after refresh |
| Duplicate protection | No duplicate CSC305 registration |
| Lecturer workspace | Eight assigned offerings |
| CSC301 roster | Five registered students |
| Draft saving | Scores persist after refresh |
| Complete roster | Incomplete score sheet cannot be submitted |
| Submission | CSC301 status is Submitted |
| Review | HOD can inspect the score sheet |
| Approval | CSC301 status becomes Approved |
| Publication | Chika sees only approved CSC301 result |
| CGPA | Approved credit-weighted CGPA is shown |
| Rejection | CSC303 rejection requires feedback |
| Correction | Lecturer can correct and resubmit |
| Grading scale | System admin can manage the scale |
| Authorization | Student cannot perform lecturer/admin actions |
| Audit trail | Login, registration, submission and review events exist |

## Live D1 verification queries

Account counts:

    SELECT role, COUNT(*) AS account_count
    FROM users GROUP BY role ORDER BY role;

Course roster sizes:

    SELECT c.code, c.title, c.units, COUNT(r.id) AS registered_students
    FROM course_offerings o
    JOIN courses c ON c.id = o.course_id
    LEFT JOIN course_registrations r ON r.offering_id = o.id
    GROUP BY o.id, c.code, c.title, c.units
    ORDER BY c.code;

Result workflow status:

    SELECT c.code, rs.status, rs.submitted_at, rs.reviewed_at, rs.feedback
    FROM result_submissions rs
    JOIN course_offerings o ON o.id = rs.offering_id
    JOIN courses c ON c.id = o.course_id
    ORDER BY c.code;

Published results:

    SELECT st.matric_no, u.full_name, c.code, re.ca_score, re.exam_score,
           re.total_score, re.grade, re.grade_point
    FROM result_entries re
    JOIN result_submissions rs ON rs.id = re.submission_id
    JOIN students st ON st.user_id = re.student_id
    JOIN users u ON u.id = st.user_id
    JOIN course_offerings o ON o.id = rs.offering_id
    JOIN courses c ON c.id = o.course_id
    WHERE rs.status = 'approved'
    ORDER BY st.matric_no, c.code;

Audit events:

    SELECT created_at, actor_id, action, entity_type, entity_id, details
    FROM audit_logs ORDER BY created_at DESC LIMIT 50;

## Reset and scope notes

The expanded cohort migration is additive and safe to re-run; it does not clear result submissions or reset a previously completed walkthrough. Use a deliberate reset procedure only in a non-production database.

This is an MVP demonstration dataset: one department, one programme, one academic session and one semester. It does not imply that admissions, fee payments, hostel allocation, attendance, timetabling, PDF transcript generation or complete university-wide student information management are implemented.
