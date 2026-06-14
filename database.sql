-- ============================================================
--  EventSphere DBMS - Complete MySQL Database Script
--  Database: eventsphere_db
--  Version: 1.0 | MySQL 8.0
--  Generated for DBMS Evaluation / Academic Submission
-- ============================================================

-- ============================================================
-- STEP 1: CREATE DATABASE
-- ============================================================
DROP DATABASE IF EXISTS eventsphere_db;
CREATE DATABASE eventsphere_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE eventsphere_db;

-- ============================================================
-- STEP 2: CREATE TABLES
-- ============================================================

-- TABLE 1: Users
CREATE TABLE Users (
  user_id       INT           NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100)  NOT NULL,
  usn           VARCHAR(20)   NOT NULL UNIQUE,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  phone         VARCHAR(15)   NOT NULL,
  department    VARCHAR(100)  NOT NULL,
  role          ENUM('STUDENT','ORGANIZER','VOLUNTEER') NOT NULL DEFAULT 'STUDENT',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  INDEX idx_users_role (role),
  INDEX idx_users_department (department)
) ENGINE=InnoDB;

-- TABLE 2: Events
CREATE TABLE Events (
  event_id          INT             NOT NULL AUTO_INCREMENT,
  event_name        VARCHAR(200)    NOT NULL,
  event_description TEXT            NOT NULL,
  event_date        DATE            NOT NULL,
  event_time        TIME            NOT NULL,
  venue             VARCHAR(200)    NOT NULL,
  capacity          INT             NOT NULL CHECK (capacity > 0),
  registration_fee  DECIMAL(10,2)   NOT NULL DEFAULT 0.00 CHECK (registration_fee >= 0),
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id),
  INDEX idx_events_date (event_date),
  INDEX idx_events_venue (venue)
) ENGINE=InnoDB;

-- TABLE 3: Registrations
CREATE TABLE Registrations (
  registration_id   INT       NOT NULL AUTO_INCREMENT,
  user_id           INT       NOT NULL,
  event_id          INT       NOT NULL,
  registration_date DATE      NOT NULL DEFAULT (CURDATE()),
  status            ENUM('PENDING','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (registration_id),
  UNIQUE KEY uk_user_event (user_id, event_id),
  FOREIGN KEY (user_id)  REFERENCES Users(user_id)  ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_reg_event (event_id),
  INDEX idx_reg_status (status)
) ENGINE=InnoDB;

-- TABLE 4: Payments
CREATE TABLE Payments (
  payment_id      INT             NOT NULL AUTO_INCREMENT,
  registration_id INT             NOT NULL,
  amount          DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  payment_date    DATE            NOT NULL DEFAULT (CURDATE()),
  payment_status  ENUM('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (payment_id),
  FOREIGN KEY (registration_id) REFERENCES Registrations(registration_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_pay_reg (registration_id),
  INDEX idx_pay_status (payment_status)
) ENGINE=InnoDB;

-- TABLE 5: Attendance
CREATE TABLE Attendance (
  attendance_id     INT         NOT NULL AUTO_INCREMENT,
  registration_id   INT         NOT NULL,
  attendance_status ENUM('PENDING','PRESENT','ABSENT') NOT NULL DEFAULT 'PENDING',
  check_in_time     DATETIME    NULL DEFAULT NULL,
  PRIMARY KEY (attendance_id),
  FOREIGN KEY (registration_id) REFERENCES Registrations(registration_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_att_reg (registration_id),
  INDEX idx_att_status (attendance_status)
) ENGINE=InnoDB;

-- TABLE 6: Certificates
CREATE TABLE Certificates (
  certificate_id     INT       NOT NULL AUTO_INCREMENT,
  registration_id    INT       NOT NULL UNIQUE,
  issue_date         DATE      NOT NULL DEFAULT (CURDATE()),
  certificate_status ENUM('ISSUED','REVOKED') NOT NULL DEFAULT 'ISSUED',
  PRIMARY KEY (certificate_id),
  FOREIGN KEY (registration_id) REFERENCES Registrations(registration_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_cert_status (certificate_status)
) ENGINE=InnoDB;

-- TABLE 7: Volunteers
CREATE TABLE Volunteers (
  volunteer_id  INT           NOT NULL AUTO_INCREMENT,
  user_id       INT           NOT NULL,
  event_id      INT           NOT NULL,
  assigned_role VARCHAR(150)  NOT NULL,
  hours_served  INT           NOT NULL DEFAULT 0 CHECK (hours_served >= 0),
  PRIMARY KEY (volunteer_id),
  FOREIGN KEY (user_id)  REFERENCES Users(user_id)  ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_vol_event (event_id),
  INDEX idx_vol_user (user_id)
) ENGINE=InnoDB;

-- TABLE 8: Event_Log (Audit table for event updates)
CREATE TABLE Event_Log (
  log_id         INT          NOT NULL AUTO_INCREMENT,
  event_id       INT          NOT NULL,
  old_event_name VARCHAR(200) NOT NULL,
  new_event_name VARCHAR(200) NOT NULL,
  old_date       DATE         NOT NULL,
  new_date       DATE         NOT NULL,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  INDEX idx_log_event (event_id)
) ENGINE=InnoDB;

-- TABLE 9: Payment_Audit (Audit table for successful payments)
CREATE TABLE Payment_Audit (
  audit_id         INT             NOT NULL AUTO_INCREMENT,
  payment_id       INT             NOT NULL,
  registration_id  INT             NOT NULL,
  amount           DECIMAL(10,2)   NOT NULL,
  action_timestamp TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (audit_id),
  INDEX idx_audit_payment (payment_id),
  INDEX idx_audit_reg (registration_id)
) ENGINE=InnoDB;


-- ============================================================
-- STEP 3: INSERT SEED DATA
-- ============================================================

-- INSERT Users
INSERT INTO Users (user_id, name, usn, email, phone, department, role) VALUES
(1, 'Rahul Sharma',  '1BI22CS001', 'rahul.sharma@bit-bangalore.edu.in',  '9876543210', 'Computer Science',            'STUDENT'),
(2, 'Priya Patel',   '1BI22CS045', 'priya.patel@bit-bangalore.edu.in',   '9123456780', 'Computer Science',            'STUDENT'),
(3, 'Anish Gowda',   '1BI22IS012', 'anish.gowda@bit-bangalore.edu.in',   '8899001122', 'Information Science',         'STUDENT'),
(4, 'Sahil Khan',    '1BI22EC088', 'sahil.khan@bit-bangalore.edu.in',    '7766554433', 'Electronics & Communication',  'VOLUNTEER'),
(5, 'Meera Nair',    '1BI21CS101', 'meera.nair@bit-bangalore.edu.in',    '9900112233', 'Computer Science',            'ORGANIZER'),
(6, 'Vikram Sen',    '1BI23CS154', 'vikram.sen@bit-bangalore.edu.in',    '8234567891', 'Computer Science',            'STUDENT');

-- INSERT Events
INSERT INTO Events (event_id, event_name, event_description, event_date, event_time, venue, capacity, registration_fee) VALUES
(1, 'AI Innovation Hackathon',       'A 24-hour hackathon to build intelligent deep tech solutions using Gemini API.', '2026-07-15', '10:00:00', 'Main Auditorium',   100, 150.00),
(2, 'CodeRush Coding Contest',        'Competitive programming contest testing algorithms and data structures skill.',   '2026-07-20', '14:00:00', 'CS Lab 3',          50,  0.00),
(3, 'WebDev Fullstack BootCamp',      'Learn React, Express, and Database Design directly from industry speakers.',      '2026-08-05', '09:30:00', 'Seminar Hall 2',    80,  100.00),
(4, 'CyberSecurity Capture the Flag', 'Jeopardy style cybersecurity challenges spanning cryptography and web-exploitation.', '2026-08-12', '11:00:00', 'MCA Seminar Hall', 40,  50.00);

-- INSERT Registrations
INSERT INTO Registrations (registration_id, user_id, event_id, registration_date, status) VALUES
(1, 1, 1, '2026-06-10', 'CONFIRMED'),
(2, 2, 1, '2026-06-11', 'CONFIRMED'),
(3, 3, 1, '2026-06-11', 'PENDING'),
(4, 1, 2, '2026-06-12', 'CONFIRMED'),
(5, 2, 3, '2026-06-12', 'CONFIRMED'),
(6, 6, 1, '2026-06-13', 'CONFIRMED');

-- INSERT Payments
INSERT INTO Payments (payment_id, registration_id, amount, payment_date, payment_status) VALUES
(1, 1, 150.00, '2026-06-10', 'SUCCESS'),
(2, 2, 150.00, '2026-06-11', 'SUCCESS'),
(3, 3, 150.00, '2026-06-11', 'PENDING'),
(4, 4,   0.00, '2026-06-12', 'SUCCESS'),
(5, 5, 100.00, '2026-06-12', 'SUCCESS'),
(6, 6, 150.00, '2026-06-13', 'SUCCESS');

-- INSERT Attendance
INSERT INTO Attendance (attendance_id, registration_id, attendance_status, check_in_time) VALUES
(1, 1, 'PRESENT', '2026-07-15 09:45:12'),
(2, 2, 'PRESENT', '2026-07-15 09:50:24'),
(3, 3, 'PENDING', NULL),
(4, 4, 'ABSENT',  NULL),
(5, 5, 'PENDING', NULL),
(6, 6, 'PRESENT', '2026-07-15 10:02:11');

-- INSERT Certificates
INSERT INTO Certificates (certificate_id, registration_id, issue_date, certificate_status) VALUES
(1, 1, '2026-07-15', 'ISSUED'),
(2, 2, '2026-07-15', 'ISSUED'),
(3, 6, '2026-07-15', 'ISSUED');

-- INSERT Volunteers
INSERT INTO Volunteers (volunteer_id, user_id, event_id, assigned_role, hours_served) VALUES
(1, 4, 1, 'Tech Support & Registration', 10),
(2, 4, 3, 'Venue Coordinator',           4);

-- INSERT Payment_Audit seed (historical successful payments)
INSERT INTO Payment_Audit (audit_id, payment_id, registration_id, amount, action_timestamp) VALUES
(1, 1, 1, 150.00, '2026-06-10 10:15:00'),
(2, 2, 2, 150.00, '2026-06-11 11:24:00'),
(3, 5, 5, 100.00, '2026-06-12 09:30:00'),
(4, 6, 6, 150.00, '2026-06-13 14:14:12');


-- ============================================================
-- STEP 4: TRIGGERS
-- ============================================================

DELIMITER $$

-- TRIGGER 1: trg_generate_certificate
-- After Attendance is updated to PRESENT, auto-generate a Certificate
CREATE TRIGGER trg_generate_certificate
AFTER UPDATE ON Attendance
FOR EACH ROW
BEGIN
  -- Only fire when new status = PRESENT and old status was NOT PRESENT
  IF NEW.attendance_status = 'PRESENT' AND OLD.attendance_status != 'PRESENT' THEN
    -- Only insert if certificate doesn't already exist for this registration
    IF NOT EXISTS (
      SELECT 1 FROM Certificates WHERE registration_id = NEW.registration_id
    ) THEN
      INSERT INTO Certificates (registration_id, issue_date, certificate_status)
      VALUES (NEW.registration_id, CURDATE(), 'ISSUED');
    END IF;
  END IF;
END$$

-- TRIGGER 2: trg_audit_event_update
-- After an Event is updated, log old/new values to Event_Log
CREATE TRIGGER trg_audit_event_update
AFTER UPDATE ON Events
FOR EACH ROW
BEGIN
  -- Only log if event_name, event_date, or event_time changed
  IF OLD.event_name != NEW.event_name
  OR OLD.event_date != NEW.event_date
  OR OLD.event_time != NEW.event_time THEN
    INSERT INTO Event_Log (event_id, old_event_name, new_event_name, old_date, new_date, updated_at)
    VALUES (NEW.event_id, OLD.event_name, NEW.event_name, OLD.event_date, NEW.event_date, NOW());
  END IF;
END$$

-- TRIGGER 3: trg_audit_payment_success
-- After a Payment is updated to SUCCESS, insert an entry into Payment_Audit
CREATE TRIGGER trg_audit_payment_success
AFTER UPDATE ON Payments
FOR EACH ROW
BEGIN
  -- Only fire when new status = SUCCESS and old was NOT SUCCESS
  IF NEW.payment_status = 'SUCCESS' AND OLD.payment_status != 'SUCCESS' THEN
    INSERT INTO Payment_Audit (payment_id, registration_id, amount, action_timestamp)
    VALUES (NEW.payment_id, NEW.registration_id, NEW.amount, NOW());
    -- Also auto-confirm the registration
    UPDATE Registrations
    SET status = 'CONFIRMED'
    WHERE registration_id = NEW.registration_id;
  END IF;
END$$

DELIMITER ;


-- ============================================================
-- STEP 5: STORED PROCEDURES
-- ============================================================

DELIMITER $$

-- PROCEDURE 1: GetParticipantCount
-- Returns total registrations and total present attendees
CREATE PROCEDURE GetParticipantCount()
BEGIN
  SELECT
    COUNT(*)                                              AS total_registered,
    SUM(CASE WHEN a.attendance_status = 'PRESENT' THEN 1 ELSE 0 END) AS total_present_attendance
  FROM Registrations r
  LEFT JOIN Attendance a ON r.registration_id = a.registration_id;
END$$

-- PROCEDURE 2: GetRevenueSummary
-- Returns total revenue, count of successful and failed payments
CREATE PROCEDURE GetRevenueSummary()
BEGIN
  SELECT
    SUM(CASE WHEN payment_status = 'SUCCESS' THEN amount ELSE 0 END) AS total_revenue,
    SUM(CASE WHEN payment_status = 'SUCCESS' THEN 1 ELSE 0 END)      AS successful_payments,
    SUM(CASE WHEN payment_status = 'FAILED'  THEN 1 ELSE 0 END)      AS failed_payments
  FROM Payments;
END$$

-- PROCEDURE 3: GetEventDetails
-- Returns full event info with aggregated participant and attendance counts
-- Pass event_id = 0 or NULL to get ALL events
CREATE PROCEDURE GetEventDetails(IN p_event_id INT)
BEGIN
  SELECT
    e.event_id,
    e.event_name,
    e.venue,
    e.event_date,
    e.event_time,
    e.capacity,
    e.registration_fee                                           AS fee,
    COUNT(DISTINCT r.registration_id)                            AS registered_count,
    SUM(CASE WHEN a.attendance_status = 'PRESENT' THEN 1 ELSE 0 END) AS attendees_present,
    COUNT(DISTINCT v.volunteer_id)                               AS volunteers_assigned,
    CASE
      WHEN COUNT(DISTINCT r.registration_id) >= e.capacity THEN 'FULL'
      ELSE 'OPEN'
    END                                                          AS status
  FROM Events e
  LEFT JOIN Registrations r ON e.event_id = r.event_id
  LEFT JOIN Attendance    a ON r.registration_id = a.registration_id
  LEFT JOIN Volunteers    v ON e.event_id = v.event_id
  WHERE (p_event_id IS NULL OR p_event_id = 0 OR e.event_id = p_event_id)
  GROUP BY e.event_id, e.event_name, e.venue, e.event_date, e.event_time, e.capacity, e.registration_fee;
END$$

DELIMITER ;


-- ============================================================
-- STEP 6: VIEWS
-- ============================================================

-- VIEW 1: EventParticipationView
CREATE OR REPLACE VIEW EventParticipationView AS
SELECT
  e.event_id,
  e.event_name,
  COUNT(DISTINCT r.registration_id)                              AS participants_count,
  SUM(CASE WHEN a.attendance_status = 'PRESENT' THEN 1 ELSE 0 END) AS attendance_count
FROM Events e
LEFT JOIN Registrations r ON e.event_id = r.event_id
LEFT JOIN Attendance    a ON r.registration_id = a.registration_id
GROUP BY e.event_id, e.event_name;

-- VIEW 2: CertificateStatusView
CREATE OR REPLACE VIEW CertificateStatusView AS
SELECT
  u.name               AS student_name,
  u.usn,
  e.event_name,
  c.certificate_status,
  c.issue_date
FROM Certificates c
JOIN Registrations r ON c.registration_id = r.registration_id
JOIN Users         u ON r.user_id = u.user_id
JOIN Events        e ON r.event_id = e.event_id;


-- ============================================================
-- STEP 7: VERIFICATION QUERIES
-- Run these inside MySQL Workbench to verify everything works
-- ============================================================

-- Show all tables
-- SHOW TABLES;

-- Show all databases
-- SHOW DATABASES;

-- Show CREATE TABLE for Events
-- SHOW CREATE TABLE Events;

-- Show all triggers
-- SHOW TRIGGERS;

-- Show all stored procedures
-- SHOW PROCEDURE STATUS WHERE Db = 'eventsphere_db';

-- Select from tables
-- SELECT * FROM Users;
-- SELECT * FROM Events;
-- SELECT * FROM Registrations;
-- SELECT * FROM Payments;
-- SELECT * FROM Attendance;
-- SELECT * FROM Certificates;
-- SELECT * FROM Volunteers;
-- SELECT * FROM Event_Log;
-- SELECT * FROM Payment_Audit;

-- Call stored procedures
-- CALL GetParticipantCount();
-- CALL GetRevenueSummary();
-- CALL GetEventDetails(0);

-- Query views
-- SELECT * FROM EventParticipationView;
-- SELECT * FROM CertificateStatusView;

-- Test Trigger 1: Update attendance to PRESENT -> auto-generates certificate
-- UPDATE Attendance SET attendance_status = 'PRESENT', check_in_time = NOW() WHERE attendance_id = 3;
-- SELECT * FROM Certificates;

-- Test Trigger 2: Update event -> auto-logs to Event_Log
-- UPDATE Events SET event_name = 'AI Hackathon 2026 Updated', event_date = '2026-07-18' WHERE event_id = 1;
-- SELECT * FROM Event_Log;

-- Test Trigger 3: Update payment to SUCCESS -> auto-logs to Payment_Audit
-- UPDATE Payments SET payment_status = 'SUCCESS' WHERE payment_id = 3;
-- SELECT * FROM Payment_Audit;
