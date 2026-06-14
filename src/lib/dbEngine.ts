/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// SMART EVENT MANAGEMENT SYSTEM - DATABASE TYPE DEFINITIONS
// This file contains the TypeScript interfaces used across the client and server.

export interface User {
  user_id: number;
  name: string;
  usn: string;
  email: string;
  phone: string;
  department: string;
  role: 'STUDENT' | 'ORGANIZER' | 'VOLUNTEER';
}

export interface Event {
  event_id: number;
  event_name: string;
  event_description: string;
  event_date: string;
  event_time: string;
  venue: string;
  capacity: number;
  registration_fee: number;
}

export interface Registration {
  registration_id: number;
  user_id: number;
  event_id: number;
  registration_date: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}

export interface Payment {
  payment_id: number;
  registration_id: number;
  amount: number;
  payment_date: string;
  payment_status: 'PENDING' | 'SUCCESS' | 'FAILED';
}

export interface Attendance {
  attendance_id: number;
  registration_id: number;
  attendance_status: 'PENDING' | 'PRESENT' | 'ABSENT';
  check_in_time: string;
}

export interface Certificate {
  certificate_id: number;
  registration_id: number;
  issue_date: string;
  certificate_status: 'ISSUED' | 'REVOKED';
}

export interface Volunteer {
  volunteer_id: number;
  user_id: number;
  event_id: number;
  assigned_role: string;
  hours_served: number;
}

export interface EventLog {
  log_id: number;
  event_id: number;
  old_event_name: string;
  new_event_name: string;
  old_date: string;
  new_date: string;
  updated_at: string;
}

export interface PaymentAudit {
  audit_id: number;
  payment_id: number;
  registration_id: number;
  amount: number;
  action_timestamp: string;
}

export interface DatabaseState {
  users: User[];
  events: Event[];
  registrations: Registration[];
  payments: Payment[];
  attendance: Attendance[];
  certificates: Certificate[];
  volunteers: Volunteer[];
  event_log: EventLog[];
  payment_audit: PaymentAudit[];
}

export interface SQLQueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTimeMs: number;
  explainPlan?: string[];
  message?: string;
  triggerLogs: string[];
}
