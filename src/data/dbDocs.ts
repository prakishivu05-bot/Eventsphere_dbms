/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Documentation and static MySQL scripts for DBMS VIVA demonstration and Workbench integration.

export const NORMALIZATION_EXPLANATION = {
  summary: "The EventSphere relational database is structured up to Third Normal Form (3NF) to maximize data integrity, eliminate redundancy, and secure transactional safety.",
  steps: [
    {
      level: "First Normal Form (1NF) - Atomic Values & Primary Keys",
      description: "A relation is in 1NF if and only if the domain of each attribute contains only atomic (indivisible) values, and there are no repeating groups.",
      application: "In EventSphere, every attribute (e.g., USERS.name, EVENTS.venue, REGISTRATIONS.registration_date) is strictly single-valued. Unique PRIMARY KEY constraints (user_id, event_id, registration_id, etc.) are established for each relation to uniquely identify any unique tuple."
    },
    {
      level: "Second Normal Form (2NF) - No Partial Dependencies",
      description: "A relation is in 2NF if it succeeds 1NF and every non-prime attribute is fully functionally dependent on the primary key (no composite partial dependencies).",
      application: "In our schemas, tables with single-attribute primary keys (like USERS, EVENTS, PAYMENTS) are automatically in 2NF. In tables with joint composite foreign elements like REGISTRATIONS or VOLUNTEERS, we use independent auto-incremented surrogate keys (registration_id, volunteer_id) rather than composite keys, which isolates functional associations, or ensure that non-key attributes (like status or assigned_role) depend completely on the primary key identifier."
    },
    {
      level: "Third Normal Form (3NF) - No Transitive Dependencies",
      description: "A relation is in 3NF if it succeeds 2NF and there is no transitive dependency of non-prime attributes on the primary key (non-prime attributes must depend only on the super keys).",
      application: "We eliminate transitive relationships by storing derived contexts in dedicated relations. For example, student's certificates references 'registration_id' which references 'user_id' and 'event_id'. Rather than duplicating User email or Event details directly in the Certificates table, we join tables via FOREIGN KEY links. Consequently, changing student contact information (e.g. email) occurs exactly in one place (USERS), without causing anomalies in payments or certificate registers."
    }
  ],
  functionalDependencies: [
    "USERS: user_id → { name, usn, email, phone, department, role } (usn also acts as Candidate Key)",
    "EVENTS: event_id → { event_name, event_description, event_date, event_time, venue, capacity, registration_fee }",
    "REGISTRATIONS: registration_id → { user_id, event_id, registration_date, status } [FKs: user_id, event_id]",
    "PAYMENTS: payment_id → { registration_id, amount, payment_date, payment_status } [FK: registration_id]",
    "ATTENDANCE: attendance_id → { registration_id, attendance_status, check_in_time } [FK: registration_id]",
    "CERTIFICATES: certificate_id → { registration_id, issue_date, certificate_status } [FK: registration_id]",
    "VOLUNTEERS: volunteer_id → { user_id, event_id, assigned_role, hours_served } [FKs: user_id, event_id]",
    "EVENT_LOG: log_id → { event_id, old_event_name, new_event_name, old_date, new_date, updated_at }"
  ]
};

export const ER_DIAGRAM_DESCRIPTION = {
  title: "EventSphere Entity-Relationship Schema Model",
  entities: [
    { name: "USERS", type: "Master Entity", attr: "user_id (PK), name, usn (Unique), email, phone, department, role (STUDENT, ORGANIZER, VOLUNTEER)" },
    { name: "EVENTS", type: "Master Entity", attr: "event_id (PK), event_name, event_description, event_date, event_time, venue, capacity, registration_fee" },
    { name: "REGISTRATIONS", type: "Weak/Relationship Entity", attr: "registration_id (PK), user_id (FK), event_id (FK), registration_date, status" },
    { name: "PAYMENTS", type: "Transaction Entity", attr: "payment_id (PK), registration_id (FK), amount, payment_date, payment_status" },
    { name: "ATTENDANCE", type: "Operational Entity", attr: "attendance_id (PK), registration_id (FK), attendance_status, check_in_time" },
    { name: "CERTIFICATES", type: "Operational Entity", attr: "certificate_id (PK), registration_id (FK), issue_date, certificate_status" },
    { name: "VOLUNTEERS", type: "Relationship Entity", attr: "volunteer_id (PK), user_id (FK), event_id (FK), assigned_role, hours_served" },
    { name: "EVENT_LOG", type: "Audit Log Entity", attr: "log_id (PK), event_id (FK), old_event_name, new_event_name, old_date, new_date, updated_at" }
  ],
  relationships: [
    "Users (1) to Registrations (M): One student can register for multiple college events.",
    "Events (1) to Registrations (M): One college event can have multiple student registrations.",
    "Registrations (1) to Payments (1): Every registration generates exactly one payment ledger record.",
    "Registrations (1) to Attendance (1): Every registration maps to a single check-in roster row.",
    "Attendance (1) to Certificates (1/0): Present status triggers a single accredited certificate.",
    "Users (1) to Volunteers (M): A user with role VOLUNTEER can volunteer for multiple events."
  ]
};

export const MYSQL_WORKBENCH_SCRIPTS = {
  createSchema: `
-- ========================================================
-- DATABASE CREATION SCRIPT FOR MYSQL WORKBENCH
-- ========================================================
CREATE DATABASE IF NOT EXISTS EventSphere;
USE EventSphere;

-- 1. USERS TABLE
CREATE TABLE USERS (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    usn VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    department VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'ORGANIZER', 'VOLUNTEER'))
);

-- 2. EVENTS TABLE
CREATE TABLE EVENTS (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(150) NOT NULL,
    event_description TEXT,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    venue VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    registration_fee DECIMAL(10, 2) DEFAULT 0.00
);

-- 3. REGISTRATIONS TABLE
CREATE TABLE REGISTRATIONS (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    registration_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_event (user_id, event_id)
);

-- 4. PAYMENTS TABLE
CREATE TABLE PAYMENTS (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED')),
    FOREIGN KEY (registration_id) REFERENCES REGISTRATIONS(registration_id) ON DELETE CASCADE
);

-- 5. ATTENDANCE TABLE
CREATE TABLE ATTENDANCE (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    attendance_status VARCHAR(20) DEFAULT 'PENDING' CHECK (attendance_status IN ('PENDING', 'PRESENT', 'ABSENT')),
    check_in_time DATETIME DEFAULT NULL,
    FOREIGN KEY (registration_id) REFERENCES REGISTRATIONS(registration_id) ON DELETE CASCADE
);

-- 6. CERTIFICATES TABLE
CREATE TABLE CERTIFICATES (
    certificate_id INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    issue_date DATE NOT NULL,
    certificate_status VARCHAR(20) DEFAULT 'ISSUED' CHECK (certificate_status IN ('ISSUED', 'REVOKED')),
    FOREIGN KEY (registration_id) REFERENCES REGISTRATIONS(registration_id) ON DELETE CASCADE
);

-- 7. VOLUNTEERS TABLE
CREATE TABLE VOLUNTEERS (
    volunteer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    assigned_role VARCHAR(100) NOT NULL,
    hours_served INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE CASCADE
);

-- 8. EVENT_LOG TABLE (Audit log for Trigger 2)
CREATE TABLE EVENT_LOG (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    old_event_name VARCHAR(150),
    new_event_name VARCHAR(150),
    old_date DATE,
    new_date DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. PAYMENT_AUDIT TABLE (Audit log for Trigger 3)
CREATE TABLE PAYMENT_AUDIT (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT NOT NULL,
    registration_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`,
  seedData: `
-- ========================================================
-- INSERT SCRIPTS FOR TESTING INITIAL ROWSETS
-- ========================================================
INSERT INTO USERS (name, usn, email, phone, department, role) VALUES 
('Rahul Sharma', '1BI22CS001', 'rahul.sharma@bit-bangalore.edu.in', '9876543210', 'Computer Science', 'STUDENT'),
('Priya Patel', '1BI22CS045', 'priya.patel@bit-bangalore.edu.in', '9123456780', 'Computer Science', 'STUDENT'),
('Anish Gowda', '1BI22IS012', 'anish.gowda@bit-bangalore.edu.in', '8899001122', 'Information Science', 'STUDENT'),
('Sahil Khan', '1BI22EC088', 'sahil.khan@bit-bangalore.edu.in', '7766554433', 'Electronics & Communication', 'VOLUNTEER'),
('Meera Nair', '1BI21CS101', 'meera.nair@bit-bangalore.edu.in', '9900112233', 'Computer Science', 'ORGANIZER'),
('Vikram Sen', '1BI23CS154', 'vikram.sen@bit-bangalore.edu.in', '8234567891', 'Computer Science', 'STUDENT');

INSERT INTO EVENTS (event_name, event_description, event_date, event_time, venue, capacity, registration_fee) VALUES 
('AI Innovation Hackathon', 'A 24-hour hackathon to build intelligent deep tech solutions using Gemini API.', '2026-07-15', '10:00:00', 'Main Auditorium', 100, 150.00),
('CodeRush Coding Contest', 'Competitive programming contest testing algorithms and data structures skill.', '2026-07-20', '14:00:00', 'CS Lab 3', 50, 0.00),
('WebDev Fullstack BootCamp', 'Learn React, Express, and Database Design directly from industry speakers.', '2026-08-05', '09:30:00', 'Seminar Hall 2', 80, 100.00),
('CyberSecurity Capture the flag', 'Jeopardy style cybersecurity challenges spanning cryptography and web-exploitation.', '2026-08-12', '11:00:00', 'MCA Seminar Hall', 40, 50.00);

-- Initial registrations (and relational cascade setup)
INSERT INTO REGISTRATIONS (user_id, event_id, registration_date, status) VALUES 
(1, 1, '2026-06-10', 'CONFIRMED'),
(2, 1, '2026-06-11', 'CONFIRMED'),
(3, 1, '2026-06-11', 'PENDING'),
(1, 2, '2026-06-12', 'CONFIRMED'),
(2, 3, '2026-06-12', 'CONFIRMED'),
(6, 1, '2026-06-13', 'CONFIRMED');

INSERT INTO PAYMENTS (registration_id, amount, payment_date, payment_status) VALUES 
(1, 150.00, '2026-06-10', 'SUCCESS'),
(2, 150.00, '2026-06-11', 'SUCCESS'),
(3, 150.00, '2026-06-11', 'PENDING'),
(4, 0.00, '2026-06-12', 'SUCCESS'),
(5, 100.00, '2026-06-12', 'SUCCESS'),
(6, 150.00, '2026-06-13', 'SUCCESS');

INSERT INTO ATTENDANCE (registration_id, attendance_status, check_in_time) VALUES 
(1, 'PRESENT', '2026-07-15 09:45:12'),
(2, 'PRESENT', '2026-07-15 09:50:24'),
(3, 'PENDING', NULL),
(4, 'ABSENT', NULL),
(5, 'PENDING', NULL),
(6, 'PRESENT', '2026-07-15 10:02:11');

INSERT INTO CERTIFICATES (registration_id, issue_date, certificate_status) VALUES 
(1, '2026-07-15', 'ISSUED'),
(2, '2026-07-15', 'ISSUED'),
(6, '2026-07-15', 'ISSUED');

INSERT INTO VOLUNTEERS (user_id, event_id, assigned_role, hours_served) VALUES 
(4, 1, 'Tech Support & Registration', 10),
(4, 3, 'Venue Coordinator', 4);
`,
  triggers: `
-- ========================================================
-- TRIGGER SCRIPTS (COMMUTE INTEGRITY AUTOMATICALS)
-- ========================================================

-- TRIGGER 1: Certificate Generation Trigger
DELIMITER $$
CREATE TRIGGER trg_generate_certificate
AFTER UPDATE ON ATTENDANCE
FOR EACH ROW
BEGIN
    IF NEW.attendance_status = 'PRESENT' AND (OLD.attendance_status != 'PRESENT' OR OLD.attendance_status IS NULL) THEN
        -- Insert certificate if not exists
        IF NOT EXISTS (SELECT 1 FROM CERTIFICATES WHERE registration_id = NEW.registration_id) THEN
            INSERT INTO CERTIFICATES (registration_id, issue_date, certificate_status)
            VALUES (NEW.registration_id, CURDATE(), 'ISSUED');
        END IF;
    END IF;
END$$
DELIMITER ;

-- TRIGGER 2: Event Audit Trigger (Tracks critical event changes)
DELIMITER $$
CREATE TRIGGER trg_audit_event_update
AFTER UPDATE ON EVENTS
FOR EACH ROW
BEGIN
    IF OLD.event_name != NEW.event_name OR OLD.event_date != NEW.event_date OR OLD.event_time != NEW.event_time THEN
        INSERT INTO EVENT_LOG (event_id, old_event_name, new_event_name, old_date, new_date, updated_at)
        VALUES (
            NEW.event_id, 
            OLD.event_name, NEW.event_name, 
            OLD.event_date, NEW.event_date, 
            NOW()
        );
    END IF;
END$$
DELIMITER ;

-- TRIGGER 3: Payment Success Audit Tracker
DELIMITER $$
CREATE TRIGGER trg_audit_payment_success
AFTER UPDATE ON PAYMENTS
FOR EACH ROW
BEGIN
    IF NEW.payment_status = 'SUCCESS' AND (OLD.payment_status != 'SUCCESS' OR OLD.payment_status IS NULL) THEN
        INSERT INTO PAYMENT_AUDIT (payment_id, registration_id, amount, action_timestamp)
        VALUES (NEW.payment_id, NEW.registration_id, NEW.amount, NOW());
    END IF;
END$$
DELIMITER ;
`,
  procedures: `
-- ========================================================
-- STORED PROCEDURE SCRIPTS
-- ========================================================

-- Procedure 1: GetParticipantCount()
DELIMITER $$
CREATE PROCEDURE GetParticipantCount()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM REGISTRATIONS) AS total_registered,
        (SELECT COUNT(*) FROM ATTENDANCE WHERE attendance_status = 'PRESENT') AS total_present_attendance;
END$$
DELIMITER ;

-- Procedure 2: GetRevenueSummary()
DELIMITER $$
CREATE PROCEDURE GetRevenueSummary()
BEGIN
    SELECT 
        IFNULL(SUM(amount), 0.00) AS total_revenue,
        COUNT(CASE WHEN payment_status = 'SUCCESS' THEN 1 END) AS successful_payments,
        COUNT(CASE WHEN payment_status = 'FAILED' THEN 1 END) AS failed_payments
    FROM PAYMENTS;
END$$
DELIMITER ;

-- Procedure 3: GetEventDetails(IN ev_id INT)
DELIMITER $$
CREATE PROCEDURE GetEventDetails(IN ev_id INT)
BEGIN
    IF ev_id IS NULL THEN
        SELECT 
            E.event_id, E.event_name, E.venue, E.event_date, E.event_time, E.capacity, E.registration_fee,
            COUNT(R.registration_id) AS registered_count,
            COUNT(CASE WHEN A.attendance_status = 'PRESENT' THEN 1 END) AS attendees_present
        FROM EVENTS E
        LEFT JOIN REGISTRATIONS R ON E.event_id = R.event_id
        LEFT JOIN ATTENDANCE A ON R.registration_id = A.registration_id
        GROUP BY E.event_id;
    ELSE
        SELECT 
            E.event_id, E.event_name, E.venue, E.event_date, E.event_time, E.capacity, E.registration_fee,
            COUNT(R.registration_id) AS registered_count,
            COUNT(CASE WHEN A.attendance_status = 'PRESENT' THEN 1 END) AS attendees_present
        FROM EVENTS E
        LEFT JOIN REGISTRATIONS R ON E.event_id = R.event_id
        LEFT JOIN ATTENDANCE A ON R.registration_id = A.registration_id
        WHERE E.event_id = ev_id
        GROUP BY E.event_id;
    END IF;
END$$
DELIMITER ;
`,
  views: `
-- ========================================================
-- VIEWS SCRIPTS
-- ========================================================

-- VIEW 1: EventParticipationView
CREATE VIEW EventParticipationView AS
SELECT 
    E.event_name,
    COUNT(R.registration_id) AS participants_count,
    COUNT(CASE WHEN A.attendance_status = 'PRESENT' THEN 1 END) AS attendance_count
FROM EVENTS E
LEFT JOIN REGISTRATIONS R ON E.event_id = R.event_id
LEFT JOIN ATTENDANCE A ON R.registration_id = A.registration_id
GROUP BY E.event_id, E.event_name;

-- VIEW 2: CertificateStatusView
CREATE VIEW CertificateStatusView AS
SELECT 
    U.name AS student_name,
    U.usn,
    E.event_name,
    C.certificate_status,
    C.issue_date
FROM CERTIFICATES C
INNER JOIN REGISTRATIONS R ON C.registration_id = R.registration_id
INNER JOIN USERS U ON R.user_id = U.user_id
INNER JOIN EVENTS E ON R.event_id = E.event_id;
`,
  sampleJoins: `
-- ========================================================
-- SAMPLE JOIN QUERIES FOR DEMONSTRATION
-- ========================================================

-- Sample 1: INNER JOIN (Lists student details, registered event and status)
SELECT U.name, U.usn, E.event_name, R.registration_date, R.status
FROM USERS U
INNER JOIN REGISTRATIONS R ON U.user_id = R.user_id
INNER JOIN EVENTS E ON R.event_id = E.event_id;

-- Sample 2: LEFT JOIN (Shows ALL users, including those who have NOT registered for events)
SELECT U.name, U.usn, R.registration_id, R.status
FROM USERS U
LEFT JOIN REGISTRATIONS R ON U.user_id = R.user_id;

-- Sample 3: RIGHT JOIN (Lists events and users registered, emphasizing all listed events even if zero enrolled)
SELECT E.event_name, E.venue, U.name AS registered_student
FROM REGISTRATIONS R
INNER JOIN USERS U ON R.user_id = U.user_id
RIGHT JOIN EVENTS E ON R.event_id = E.event_id;
`
};
