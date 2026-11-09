# Entity relationship diagram

```mermaid
erDiagram
  DEPARTMENTS ||--o{ PROGRAMS : owns
  DEPARTMENTS ||--o{ USERS : scopes
  DEPARTMENTS ||--o{ COURSES : offers
  PROGRAMS ||--o{ STUDENTS : enrolls
  USERS ||--o| STUDENTS : profile
  USERS ||--o| LECTURERS : profile
  ACADEMIC_SESSIONS ||--o{ SEMESTERS : contains
  COURSES ||--o{ COURSE_OFFERINGS : scheduled_as
  SEMESTERS ||--o{ COURSE_OFFERINGS : includes
  LECTURERS ||--o{ COURSE_OFFERINGS : teaches
  STUDENTS ||--o{ COURSE_REGISTRATIONS : registers
  COURSE_OFFERINGS ||--o{ COURSE_REGISTRATIONS : has
  COURSE_OFFERINGS ||--o| RESULT_SUBMISSIONS : receives
  RESULT_SUBMISSIONS ||--o{ RESULT_ENTRIES : contains
  STUDENTS ||--o{ RESULT_ENTRIES : receives
  GRADING_SCALES ||--o{ RESULT_ENTRIES : determines
  USERS ||--o{ AUDIT_LOGS : performs
```

Core entities: departments, programmes, academic sessions, semesters, users, students, lecturers, courses, course offerings, course registrations, grading scales, result submissions, result entries, audit logs and application settings.
