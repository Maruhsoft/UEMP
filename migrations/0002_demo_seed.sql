-- DEMO ONLY. All accounts share this non-production password: UEMP-Demo-2026!
-- PBKDF2-SHA256, 310000 iterations; change these credentials before any real deployment.
INSERT INTO users(id,email,full_name,password_salt,password_hash,role,department_id) VALUES
('user-admin','admin@uemp.demo','UEMP Demo Administrator','82pl565U9t_q7FfX3RvYIA','rs3c2sgsHuVhkRGHbXiQQap8pHQnwg69b9nCoaBA3Ps','admin','dept-cs'),
('user-hod','hod@uemp.demo','Dr. Ada Department Admin','82pl565U9t_q7FfX3RvYIA','rs3c2sgsHuVhkRGHbXiQQap8pHQnwg69b9nCoaBA3Ps','department_admin','dept-cs'),
('user-lecturer','lecturer@uemp.demo','Dr. Tunde Lecturer','82pl565U9t_q7FfX3RvYIA','rs3c2sgsHuVhkRGHbXiQQap8pHQnwg69b9nCoaBA3Ps','lecturer','dept-cs'),
('user-student','student@uemp.demo','Chika Okafor','82pl565U9t_q7FfX3RvYIA','rs3c2sgsHuVhkRGHbXiQQap8pHQnwg69b9nCoaBA3Ps','student','dept-cs') ON CONFLICT(id) DO UPDATE SET password_salt=excluded.password_salt,password_hash=excluded.password_hash,is_active=1;
INSERT OR IGNORE INTO lecturers(user_id,staff_no) VALUES ('user-lecturer','CSC/STAFF/001');
INSERT OR IGNORE INTO students(user_id,matric_no,program_id,level) VALUES ('user-student','UEMP/2023/001','prog-cs',300);
INSERT OR IGNORE INTO courses(id,code,title,units,department_id,level) VALUES
('course-csc301','CSC301','Data Structures and Algorithms',3,'dept-cs',300),
('course-csc303','CSC303','Database Management Systems',3,'dept-cs',300),
('course-mth301','MTH301','Numerical Methods',2,'dept-cs',300),
('course-csc305','CSC305','Operating Systems',3,'dept-cs',300);
INSERT OR IGNORE INTO course_offerings(id,course_id,semester_id,lecturer_id,capacity) VALUES
('off-csc301','course-csc301','sem-2026-1','user-lecturer',120),
('off-csc303','course-csc303','sem-2026-1','user-lecturer',120),
('off-mth301','course-mth301','sem-2026-1','user-lecturer',120),
('off-csc305','course-csc305','sem-2026-1','user-lecturer',120);
INSERT OR IGNORE INTO course_registrations(id,student_id,offering_id) VALUES
('reg-demo-1','user-student','off-csc301'),('reg-demo-2','user-student','off-csc303'),('reg-demo-3','user-student','off-mth301');