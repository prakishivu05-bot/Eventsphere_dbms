/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseState, SQLQueryResult } from './lib/dbEngine.ts';

export type ActiveTab = 
  | 'home' 
  | 'login' 
  | 'students' 
  | 'events' 
  | 'registrations' 
  | 'attendance' 
  | 'payments' 
  | 'certificates' 
  | 'dashboard';

export interface UIState {
  activeTab: ActiveTab;
  dbState: DatabaseState | null;
  participantCount: { total_registered: number; total_present_attendance: number } | null;
  revenueSummary: { total_revenue: number; successful_payments: number; failed_payments: number } | null;
  eventParticipationView: Array<{ event_name: string; participants_count: number; attendance_count: number }> | null;
  certificateStatusView: Array<{ student_name: string; usn: string; event_name: string; certificate_status: string; issue_date: string }> | null;
  currentUser: { name: string; role: 'STUDENT' | 'ORGANIZER' | 'VOLUNTEER'; userId?: number } | null;
  terminalQuery: string;
  terminalResult: SQLQueryResult | null;
  triggerLogs: string[];
}
