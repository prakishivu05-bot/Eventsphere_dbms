/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { 
  DatabaseState, 
  User, 
  Event, 
  Registration, 
  Payment, 
  Attendance, 
  Volunteer, 
  EventLog, 
  PaymentAudit, 
  Certificate,
  SQLQueryResult 
} from './dbEngine.ts';

dotenv.config();

export class EventSphereDB {
  private pool: any;

  constructor() {
    this.initializePool();
  }

  private initializePool() {
    console.log('MySQL Connecting Config:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      passwordLength: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0
    });
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'eventsphere_db',
      dateStrings: true,     // returns date/time values as raw strings instead of Date objects
      decimalNumbers: true,  // returns DECIMAL values as numbers instead of strings
      connectionLimit: 10,
    });
  }



  public async getState(): Promise<DatabaseState> {
    const [users] = await this.pool.query('SELECT * FROM Users');
    const [events] = await this.pool.query('SELECT * FROM Events');
    const [registrations] = await this.pool.query('SELECT * FROM Registrations');
    const [payments] = await this.pool.query('SELECT * FROM Payments');
    const [attendance] = await this.pool.query('SELECT * FROM Attendance');
    const [certificates] = await this.pool.query('SELECT * FROM Certificates');
    const [volunteers] = await this.pool.query('SELECT * FROM Volunteers');
    const [event_log] = await this.pool.query('SELECT * FROM Event_Log');
    const [payment_audit] = await this.pool.query('SELECT * FROM Payment_Audit');

    return {
      users: users as User[],
      events: events as Event[],
      registrations: registrations as Registration[],
      payments: payments as Payment[],
      attendance: attendance as Attendance[],
      certificates: certificates as Certificate[],
      volunteers: volunteers as Volunteer[],
      event_log: event_log as EventLog[],
      payment_audit: payment_audit as PaymentAudit[],
    };
  }

  public async resetState(): Promise<void> {
    // Close current pool
    if (this.pool) {
      await this.pool.end();
    }

    // Connect to MySQL server without database selected to run DROP/CREATE DATABASE
    const connection: any = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
    });

    try {
      const sqlPath = path.join(process.cwd(), 'database.sql');
      const sqlContent = await fs.readFile(sqlPath, 'utf8');
      
      // Parse database.sql into separate statements, handling DELIMITER $$
      const lines = sqlContent.split(/\r?\n/);
      const statements: string[] = [];
      let current: string[] = [];
      let inCompound = false;

      for (const line of lines) {
        const stripped = line.trim();
        // Skip comments and empty lines
        if (stripped.startsWith('--') || stripped === '') {
          continue;
        }

        // Handle DELIMITER directive
        if (stripped.toUpperCase().startsWith('DELIMITER')) {
          const parts = stripped.split(/\s+/);
          const newDelim = parts[1];
          if (newDelim === '$$') {
            inCompound = true;
          } else if (newDelim === ';') {
            inCompound = false;
          }
          continue;
        }

        current.push(line);

        if (inCompound) {
          if (stripped.endsWith('$$')) {
            // Remove the trailing compound delimiter
            const joined = current.join('\n');
            const endIdx = joined.lastIndexOf('$$');
            const stmt = joined.substring(0, endIdx).trim();
            if (stmt) {
              statements.push(stmt);
            }
            current = [];
          }
        } else {
          if (stripped.endsWith(';')) {
            // Remove the trailing semicolon
            const joined = current.join('\n');
            const endIdx = joined.lastIndexOf(';');
            const stmt = joined.substring(0, endIdx).trim();
            if (stmt) {
              statements.push(stmt);
            }
            current = [];
          }
        }
      }

      // Execute all statements sequentially on the connection
      for (const stmt of statements) {
        if (stmt.trim()) {
          await connection.query(stmt);
        }
      }
    } finally {
      await connection.end();
      // Re-initialize pool connected to target database
      this.initializePool();
    }
  }

  // --- STORED PROCEDURES ---
  
  public async GetParticipantCount(): Promise<{ total_registered: number; total_present_attendance: number }> {
    const [results] = await this.pool.query('CALL GetParticipantCount()');
    const rows = (results as any)[0];
    return rows[0] || { total_registered: 0, total_present_attendance: 0 };
  }

  public async GetRevenueSummary(): Promise<{ total_revenue: number; successful_payments: number; failed_payments: number }> {
    const [results] = await this.pool.query('CALL GetRevenueSummary()');
    const rows = (results as any)[0];
    return {
      total_revenue: Number(rows[0]?.total_revenue || 0),
      successful_payments: Number(rows[0]?.successful_payments || 0),
      failed_payments: Number(rows[0]?.failed_payments || 0),
    };
  }

  public async GetEventDetails(eventId?: number): Promise<any[]> {
    const p_event_id = eventId || 0;
    const [results] = await this.pool.query('CALL GetEventDetails(?)', [p_event_id]);
    return (results as any)[0] || [];
  }

  // --- VIEWS ---

  public async getEventParticipationView(): Promise<any[]> {
    const [rows] = await this.pool.query('SELECT * FROM EventParticipationView');
    return rows as any[];
  }

  public async getCertificateStatusView(): Promise<any[]> {
    const [rows] = await this.pool.query('SELECT * FROM CertificateStatusView');
    return rows as any[];
  }

  // --- CRUD OPERATIONS ---

  // USERS
  public async createUser(user: Omit<User, 'user_id'>): Promise<User> {
    const [result] = await this.pool.query(
      'INSERT INTO Users (name, usn, email, phone, department, role) VALUES (?, ?, ?, ?, ?, ?)',
      [user.name, user.usn, user.email, user.phone, user.department, user.role]
    );
    const insertId = (result as any).insertId;
    const [rows] = await this.pool.query('SELECT * FROM Users WHERE user_id = ?', [insertId]);
    return (rows as any)[0] as User;
  }

  public async updateUser(userId: number, fields: Partial<User>): Promise<User> {
    const allowedFields = ['name', 'usn', 'email', 'phone', 'department', 'role'];
    const updatePairs: string[] = [];
    const updateValues: any[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (allowedFields.includes(key)) {
        updatePairs.push(`${key} = ?`);
        updateValues.push(value);
      }
    }

    if (updatePairs.length > 0) {
      updateValues.push(userId);
      await this.pool.query(
        `UPDATE Users SET ${updatePairs.join(', ')} WHERE user_id = ?`,
        updateValues
      );
    }

    const [rows] = await this.pool.query('SELECT * FROM Users WHERE user_id = ?', [userId]);
    if ((rows as any).length === 0) {
      throw new Error(`User with ID ${userId} not found`);
    }
    return (rows as any)[0] as User;
  }

  public async deleteUser(userId: number): Promise<boolean> {
    try {
      const [result] = await this.pool.query('DELETE FROM Users WHERE user_id = ?', [userId]);
      return (result as any).affectedRows > 0;
    } catch (err: any) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.message.includes('foreign key constraint')) {
        throw new Error(`Integrity Constraint Violation: Cannot delete User ${userId} as they have event registrations.`);
      }
      throw err;
    }
  }

  // EVENTS
  public async createEvent(event: Omit<Event, 'event_id'>): Promise<Event> {
    const [result] = await this.pool.query(
      'INSERT INTO Events (event_name, event_description, event_date, event_time, venue, capacity, registration_fee) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [event.event_name, event.event_description, event.event_date, event.event_time, event.venue, event.capacity, event.registration_fee]
    );
    const insertId = (result as any).insertId;
    const [rows] = await this.pool.query('SELECT * FROM Events WHERE event_id = ?', [insertId]);
    return (rows as any)[0] as Event;
  }

  public async updateEvent(eventId: number, fields: Partial<Event>): Promise<Event> {
    const allowedFields = ['event_name', 'event_description', 'event_date', 'event_time', 'venue', 'capacity', 'registration_fee'];
    const updatePairs: string[] = [];
    const updateValues: any[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (allowedFields.includes(key)) {
        updatePairs.push(`${key} = ?`);
        updateValues.push(value);
      }
    }

    const [oldRows] = await this.pool.query('SELECT * FROM Events WHERE event_id = ?', [eventId]);
    if ((oldRows as any).length === 0) {
      throw new Error(`Event with ID ${eventId} not found`);
    }
    const oldEvent = (oldRows as any)[0] as Event;

    if (updatePairs.length > 0) {
      updateValues.push(eventId);
      await this.pool.query(
        `UPDATE Events SET ${updatePairs.join(', ')} WHERE event_id = ?`,
        updateValues
      );
    }

    const [newRows] = await this.pool.query('SELECT * FROM Events WHERE event_id = ?', [eventId]);
    const updatedEvent = (newRows as any)[0] as Event;

    // Trigger log audit
    const triggerLogs: string[] = [];
    if (
      oldEvent.event_name !== updatedEvent.event_name ||
      oldEvent.event_date !== updatedEvent.event_date ||
      oldEvent.event_time !== updatedEvent.event_time
    ) {
      const [logRows] = await this.pool.query(
        'SELECT log_id FROM Event_Log WHERE event_id = ? ORDER BY log_id DESC LIMIT 1',
        [eventId]
      );
      const logId = (logRows as any)[0]?.log_id || 1;
      triggerLogs.push(
        `[TRIGGER FIRED: trg_audit_event_update] Captured old values (Name: "${oldEvent.event_name}", Date: "${oldEvent.event_date}") and logged update for Event ID #${eventId} in EVENT_LOG table (Log ID #${logId})`
      );
    }

    (updatedEvent as any).triggerLogs = triggerLogs;
    return updatedEvent;
  }

  public async deleteEvent(eventId: number): Promise<boolean> {
    try {
      const [result] = await this.pool.query('DELETE FROM Events WHERE event_id = ?', [eventId]);
      return (result as any).affectedRows > 0;
    } catch (err: any) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.message.includes('foreign key constraint')) {
        throw new Error(`Integrity Constraint Violation: Cannot delete Event ${eventId} as students are registered.`);
      }
      throw err;
    }
  }

  // REGISTRATIONS, PAYMENTS, ATTENDANCE
  public async createRegistration(userId: number, eventId: number): Promise<{ registration: Registration; payment: Payment; attendance: Attendance }> {
    // Check foreign key validation manually to throw custom messages
    const [userRows] = await this.pool.query('SELECT * FROM Users WHERE user_id = ?', [userId]);
    if ((userRows as any).length === 0) {
      throw new Error(`Foreign Key Violation: User ID ${userId} does not exist.`);
    }
    const user = (userRows as any)[0] as User;

    const [eventRows] = await this.pool.query('SELECT * FROM Events WHERE event_id = ?', [eventId]);
    if ((eventRows as any).length === 0) {
      throw new Error(`Foreign Key Violation: Event ID ${eventId} does not exist.`);
    }
    const event = (eventRows as any)[0] as Event;

    // Check unique constraint: user already registered for event
    const [existingRegs] = await this.pool.query(
      "SELECT * FROM Registrations WHERE user_id = ? AND event_id = ? AND status != 'CANCELLED'",
      [userId, eventId]
    );
    if ((existingRegs as any).length > 0) {
      throw new Error(`Unique Key Violation: User ${user.name} is already registered for Event "${event.event_name}".`);
    }

    // Check capacity constraint
    const [regCountRows] = await this.pool.query(
      "SELECT COUNT(*) as count FROM Registrations WHERE event_id = ? AND status = 'CONFIRMED'",
      [eventId]
    );
    const enrolledCount = (regCountRows as any)[0].count;
    if (enrolledCount >= event.capacity) {
      throw new Error(`Domain Constraint Violation: Event "${event.event_name}" is fully booked (Capacity: ${event.capacity}).`);
    }

    // Execute inserting transactions
    const connection: any = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      const regDate = new Date().toISOString().split('T')[0];
      const regStatus = event.registration_fee > 0 ? 'PENDING' : 'CONFIRMED';
      const [regResult] = await connection.query(
        'INSERT INTO Registrations (user_id, event_id, registration_date, status) VALUES (?, ?, ?, ?)',
        [userId, eventId, regDate, regStatus]
      );
      const registrationId = (regResult as any).insertId;

      const paymentStatus = event.registration_fee > 0 ? 'PENDING' : 'SUCCESS';
      const [payResult] = await connection.query(
        'INSERT INTO Payments (registration_id, amount, payment_date, payment_status) VALUES (?, ?, ?, ?)',
        [registrationId, event.registration_fee, regDate, paymentStatus]
      );
      const paymentId = (payResult as any).insertId;

      // If it is a free event (status success), manually record successful payment in audit since trigger fires AFTER UPDATE
      if (paymentStatus === 'SUCCESS') {
        await connection.query(
          'INSERT INTO Payment_Audit (payment_id, registration_id, amount, action_timestamp) VALUES (?, ?, ?, NOW())',
          [paymentId, registrationId, event.registration_fee]
        );
      }

      const [attendResult] = await connection.query(
        "INSERT INTO Attendance (registration_id, attendance_status, check_in_time) VALUES (?, 'PENDING', NULL)",
        [registrationId]
      );
      const attendanceId = (attendResult as any).insertId;

      await connection.commit();

      // Fetch the created rows to return them
      const [registration] = await this.pool.query('SELECT * FROM Registrations WHERE registration_id = ?', [registrationId]);
      const [payment] = await this.pool.query('SELECT * FROM Payments WHERE payment_id = ?', [paymentId]);
      const [attendance] = await this.pool.query('SELECT * FROM Attendance WHERE attendance_id = ?', [attendanceId]);

      return {
        registration: (registration as any)[0] as Registration,
        payment: (payment as any)[0] as Payment,
        attendance: (attendance as any)[0] as Attendance,
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  public async deleteRegistration(regId: number): Promise<boolean> {
    const [result] = await this.pool.query('DELETE FROM Registrations WHERE registration_id = ?', [regId]);
    return (result as any).affectedRows > 0;
  }

  public async updatePaymentStatus(paymentId: number, status: 'PENDING' | 'SUCCESS' | 'FAILED'): Promise<Payment> {
    const [oldRows] = await this.pool.query('SELECT * FROM Payments WHERE payment_id = ?', [paymentId]);
    if ((oldRows as any).length === 0) {
      throw new Error(`Payment record #${paymentId} not found`);
    }
    const oldPay = (oldRows as any)[0] as Payment;

    await this.pool.query('UPDATE Payments SET payment_status = ? WHERE payment_id = ?', [status, paymentId]);

    const [newRows] = await this.pool.query('SELECT * FROM Payments WHERE payment_id = ?', [paymentId]);
    const updatedPay = (newRows as any)[0] as Payment;

    const triggerLogs: string[] = [];
    if (status === 'SUCCESS' && oldPay.payment_status !== 'SUCCESS') {
      const [auditRows] = await this.pool.query(
        'SELECT audit_id FROM Payment_Audit WHERE payment_id = ? ORDER BY audit_id DESC LIMIT 1',
        [paymentId]
      );
      const auditId = (auditRows as any)[0]?.audit_id || 1;
      triggerLogs.push(
        `[TRIGGER FIRED: trg_audit_payment_success] Payment SUCCESS detected! Authored new entry in PAYMENT_AUDIT table (Audit ID #${auditId}) for Payment #${paymentId}`
      );
    }

    (updatedPay as any).triggerLogs = triggerLogs;
    return updatedPay;
  }

  public async updateAttendanceStatus(attendanceId: number, status: 'PENDING' | 'PRESENT' | 'ABSENT'): Promise<Attendance> {
    const [oldRows] = await this.pool.query('SELECT * FROM Attendance WHERE attendance_id = ?', [attendanceId]);
    if ((oldRows as any).length === 0) {
      throw new Error(`Attendance record #${attendanceId} not found`);
    }
    const oldAtt = (oldRows as any)[0] as Attendance;

    const checkInTime = status === 'PRESENT' 
      ? new Date().toISOString().replace('T', ' ').substring(0, 19)
      : null;

    await this.pool.query(
      'UPDATE Attendance SET attendance_status = ?, check_in_time = ? WHERE attendance_id = ?',
      [status, checkInTime, attendanceId]
    );

    const [newRows] = await this.pool.query('SELECT * FROM Attendance WHERE attendance_id = ?', [attendanceId]);
    const updatedAtt = (newRows as any)[0] as Attendance;

    const triggerLogs: string[] = [];
    if (status === 'PRESENT' && oldAtt.attendance_status !== 'PRESENT') {
      const [certRows] = await this.pool.query(
        'SELECT certificate_id FROM Certificates WHERE registration_id = ?',
        [updatedAtt.registration_id]
      );
      const certificateId = (certRows as any)[0]?.certificate_id || 1;
      triggerLogs.push(
        `[TRIGGER FIRED: trg_generate_certificate] Automatically generated Certificate ID #${certificateId} for Registration #${updatedAtt.registration_id} due to Attendance status = PRESENT`
      );
    }

    (updatedAtt as any).triggerLogs = triggerLogs;
    return updatedAtt;
  }

  // VOLUNTEERS
  public async addVolunteer(userId: number, eventId: number, role: string, hours: number): Promise<Volunteer> {
    const [result] = await this.pool.query(
      'INSERT INTO Volunteers (user_id, event_id, assigned_role, hours_served) VALUES (?, ?, ?, ?)',
      [userId, eventId, role, hours]
    );
    const insertId = (result as any).insertId;
    const [rows] = await this.pool.query('SELECT * FROM Volunteers WHERE volunteer_id = ?', [insertId]);
    return (rows as any)[0] as Volunteer;
  }

  // --- SQL TERMINAL EXECUTOR ---

  public async executeSQL(query: string): Promise<SQLQueryResult> {
    const sanitized = query.trim().replace(/;$/, '');
    const startTime = performance.now();
    
    try {
      // Analyze triggers max IDs before execution
      const [[{ val: oldCertMax }]] = await this.pool.query('SELECT MAX(certificate_id) as val FROM Certificates') as any;
      const [[{ val: oldLogMax }]] = await this.pool.query('SELECT MAX(log_id) as val FROM Event_Log') as any;
      const [[{ val: oldAuditMax }]] = await this.pool.query('SELECT MAX(audit_id) as val FROM Payment_Audit') as any;

      let explainPlan: string[] | undefined = undefined;

      // If SELECT, run explain plan
      if (/^select/i.test(sanitized)) {
        try {
          const [explainRows] = await this.pool.query('EXPLAIN ' + sanitized);
          explainPlan = (explainRows as any[]).map(
            (row, idx) => `${idx + 1}. table: ${row.table || 'N/A'} | type: ${row.type || 'N/A'} | key: ${row.key || 'NULL'} | rows: ${row.rows || 0} | Extra: ${row.Extra || ''}`
          );
        } catch (e) {
          // ignore explain failures for non-explainable selects
        }
      }

      // Execute actual query
      const [rows, fields] = await this.pool.query(sanitized);
      const executionTimeMs = Math.round(performance.now() - startTime);

      // Check new triggers max IDs to identify if any trigger fired
      const [[{ val: newCertMax }]] = await this.pool.query('SELECT MAX(certificate_id) as val FROM Certificates') as any;
      const [[{ val: newLogMax }]] = await this.pool.query('SELECT MAX(log_id) as val FROM Event_Log') as any;
      const [[{ val: newAuditMax }]] = await this.pool.query('SELECT MAX(audit_id) as val FROM Payment_Audit') as any;

      const triggerLogs: string[] = [];

      if (newCertMax && newCertMax > (oldCertMax || 0)) {
        const [certs] = await this.pool.query('SELECT * FROM Certificates WHERE certificate_id > ?', [oldCertMax || 0]);
        for (const cert of (certs as any[])) {
          triggerLogs.push(
            `[TRIGGER FIRED: trg_generate_certificate] Automatically generated Certificate ID #${cert.certificate_id} for Registration #${cert.registration_id} due to Attendance status = PRESENT`
          );
        }
      }

      if (newLogMax && newLogMax > (oldLogMax || 0)) {
        const [logs] = await this.pool.query('SELECT * FROM Event_Log WHERE log_id > ?', [oldLogMax || 0]);
        for (const log of (logs as any[])) {
          triggerLogs.push(
            `[TRIGGER FIRED: trg_audit_event_update] Captured old values (Name: "${log.old_event_name}", Date: "${log.old_date}") and logged update for Event ID #${log.event_id} in EVENT_LOG table (Log ID #${log.log_id})`
          );
        }
      }

      if (newAuditMax && newAuditMax > (oldAuditMax || 0)) {
        const [audits] = await this.pool.query('SELECT * FROM Payment_Audit WHERE audit_id > ?', [oldAuditMax || 0]);
        for (const audit of (audits as any[])) {
          triggerLogs.push(
            `[TRIGGER FIRED: trg_audit_payment_success] Payment SUCCESS detected! Authored new entry in PAYMENT_AUDIT table (Audit ID #${audit.audit_id}) for Payment #${audit.payment_id}`
          );
        }
      }

      // Format return results based on operation type
      if (fields) {
        // SELECT statement
        const columns = (fields as any[]).map(f => f.name);
        return {
          columns,
          rows: rows as any[],
          rowCount: (rows as any[]).length,
          executionTimeMs,
          explainPlan,
          triggerLogs,
        };
      } else {
        // INSERT / UPDATE / DELETE statement
        const header = rows as any;
        return {
          columns: ['affected_rows', 'insert_id'],
          rows: [{ affected_rows: header.affectedRows, insert_id: header.insertId }],
          rowCount: header.affectedRows,
          executionTimeMs,
          explainPlan: ['1. Write operation query', `2. Rows affected: ${header.affectedRows}`],
          message: `Query OK, ${header.affectedRows} rows affected.`,
          triggerLogs,
        };
      }
    } catch (err: any) {
      return {
        columns: ['error_message'],
        rows: [[err.message || 'Unknown MySQL error']],
        rowCount: 0,
        executionTimeMs: Math.round(performance.now() - startTime),
        explainPlan: ['Execution Failure -> Exception caught inside relational database server.'],
        triggerLogs: [],
        message: err.message,
      };
    }
  }
}
