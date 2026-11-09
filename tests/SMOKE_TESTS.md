# Smoke-test checklist

Run against the deployed origin after applying migrations 0001 and 0002.

- [ ] GET /api/health returns 200 and `ok: true`.
- [ ] Sign-in form submits credentials with POST; email/password never appear in the URL or referrer.
- [ ] Both JSON login (`/api/auth/login`) and HTML form fallback (`/login`) create a valid session cookie.
- [ ] Invalid credentials return a safe error without exposing whether the account exists.
- [ ] Each role can sign in with its demo account.
- [ ] Student can view current-semester offerings for level 300.
- [ ] Student can save a course selection; repeating the same selection does not duplicate registration or incorrectly consume the registration cap.
- [ ] Student cannot register for a course at a different level or for a full offering.
- [ ] Student cannot access lecturer or admin endpoints.
- [ ] Lecturer sees only assigned courses and registered students.
- [ ] CA values above 30 and exam values above 70 are rejected.
- [ ] Lecturer can save a draft and submit it.
- [ ] Submission is blocked until every registered student has both CA and examination scores.
- [ ] Duplicate student score rows and blank scores are rejected.
- [ ] Lecturer cannot edit a submitted or approved result sheet.
- [ ] Department administrator can inspect only submissions in their department.
- [ ] Department administrator can approve or reject a submitted result.
- [ ] Department administrator overview counts are restricted to their department.
- [ ] Department administrator can view but cannot change the grading scale.
- [ ] System administrator can update the grading scale only when bands cover 0–100 without gaps or overlaps.
- [ ] Grade labels must be unique and grade points must remain between 0 and 5.
- [ ] A grade used by existing result records cannot be removed.
- [ ] Rejected results require feedback.
- [ ] Approved results appear on the student result endpoint; unapproved results do not.
- [ ] Reopening a rejected or approved submission allows lecturer edits; reopening an unsubmitted draft is rejected.
- [ ] Cross-origin state-changing API requests are rejected.
- [ ] Dynamic course, student and lecturer values render as escaped text, not executable HTML.
- [ ] Audit log rows are created for authentication, registration, result save/submit and review actions.

This is a manual smoke-test checklist. Automated browser/API test coverage is not yet included.
