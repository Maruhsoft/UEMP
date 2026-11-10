-- Expanded fictional UEMP demonstration cohort. Safe to re-run.
INSERT OR IGNORE INTO users(id,email,full_name,password_salt,password_hash,role,department_id) VALUES
('user-student-002','amina.yusuf@uemp.demo','Amina Yusuf','WdsprOsw3M_KepzLmyqi3w','JkEDBRqO0kV6eIDuG8uTgOx0GbKZZAkfsWWrKPRR2pc','student','dept-cs'),
('user-student-003','david.eze@uemp.demo','David Eze','WdsprOsw3M_KepzLmyqi3w','JkEDBRqO0kV6eIDuG8uTgOx0GbKZZAkfsWWrKPRR2pc','student','dept-cs'),
('user-student-004','fatima.bello@uemp.demo','Fatima Bello','WdsprOsw3M_KepzLmyqi3w','JkEDBRqO0kV6eIDuG8uTgOx0GbKZZAkfsWWrKPRR2pc','student','dept-cs'),
('user-student-005','emeka.nwosu@uemp.demo','Emeka Nwosu','WdsprOsw3M_KepzLmyqi3w','JkEDBRqO0kV6eIDuG8uTgOx0GbKZZAkfsWWrKPRR2pc','student','dept-cs'),
('user-student-006','grace.mensah@uemp.demo','Grace Mensah','WdsprOsw3M_KepzLmyqi3w','JkEDBRqO0kV6eIDuG8uTgOx0GbKZZAkfsWWrKPRR2pc','student','dept-cs'),
('user-student-007','ibrahim.musa@uemp.demo','Ibrahim Musa','WdsprOsw3M_KepzLmyqi3w','JkEDBRqO0kV6eIDuG8uTgOx0GbKZZAkfsWWrKPRR2pc','student','dept-cs'),
('user-student-008','zainab.aliyu@uemp.demo','Zainab Aliyu','WdsprOsw3M_KepzLmyqi3w','JkEDBRqO0kV6eIDuG8uTgOx0GbKZZAkfsWWrKPRR2pc','student','dept-cs');
INSERT OR IGNORE INTO students(user_id,matric_no,program_id,level) VALUES
('user-student-002','UEMP/2023/002','prog-cs',300),('user-student-003','UEMP/2023/003','prog-cs',300),
('user-student-004','UEMP/2023/004','prog-cs',300),('user-student-005','UEMP/2023/005','prog-cs',300),
('user-student-006','UEMP/2023/006','prog-cs',300),('user-student-007','UEMP/2023/007','prog-cs',300),
('user-student-008','UEMP/2023/008','prog-cs',300);
INSERT OR IGNORE INTO courses(id,code,title,units,department_id,level) VALUES
('course-csc307','CSC307','Software Engineering',3,'dept-cs',300),
('course-csc309','CSC309','Computer Networks',3,'dept-cs',300),
('course-csc311','CSC311','Web Application Development',3,'dept-cs',300),
('course-gst301','GST301','Entrepreneurship and Innovation',2,'dept-cs',300);
INSERT OR IGNORE INTO course_offerings(id,course_id,semester_id,lecturer_id,capacity) VALUES
('off-csc307','course-csc307','sem-2026-1','user-lecturer',120),
('off-csc309','course-csc309','sem-2026-1','user-lecturer',120),
('off-csc311','course-csc311','sem-2026-1','user-lecturer',120),
('off-gst301','course-gst301','sem-2026-1','user-lecturer',120);
INSERT OR IGNORE INTO course_registrations(id,student_id,offering_id) VALUES
('reg-demo-4','user-student','off-csc305'),
('reg-demo-5','user-student-002','off-csc301'),('reg-demo-6','user-student-002','off-csc303'),('reg-demo-7','user-student-002','off-csc307'),('reg-demo-8','user-student-002','off-csc309'),
('reg-demo-9','user-student-003','off-csc301'),('reg-demo-10','user-student-003','off-mth301'),('reg-demo-11','user-student-003','off-csc307'),('reg-demo-12','user-student-003','off-csc311'),('reg-demo-13','user-student-003','off-gst301'),
('reg-demo-14','user-student-004','off-csc303'),('reg-demo-15','user-student-004','off-csc305'),('reg-demo-16','user-student-004','off-csc309'),('reg-demo-17','user-student-004','off-csc311'),
('reg-demo-18','user-student-005','off-csc301'),('reg-demo-19','user-student-005','off-csc303'),('reg-demo-20','user-student-005','off-mth301'),('reg-demo-21','user-student-005','off-csc307'),('reg-demo-22','user-student-005','off-gst301'),
('reg-demo-23','user-student-006','off-csc305'),('reg-demo-24','user-student-006','off-csc309'),('reg-demo-25','user-student-006','off-csc311'),('reg-demo-26','user-student-006','off-gst301'),
('reg-demo-27','user-student-007','off-csc301'),('reg-demo-28','user-student-007','off-csc303'),('reg-demo-29','user-student-007','off-csc305'),('reg-demo-30','user-student-007','off-csc307'),('reg-demo-31','user-student-007','off-csc309'),('reg-demo-32','user-student-007','off-csc311'),
('reg-demo-33','user-student-008','off-mth301'),('reg-demo-34','user-student-008','off-csc307'),('reg-demo-35','user-student-008','off-csc309'),('reg-demo-36','user-student-008','off-csc311'),('reg-demo-37','user-student-008','off-gst301');
