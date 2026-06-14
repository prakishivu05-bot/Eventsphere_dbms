/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { EventSphereDB } from './src/lib/dbEngineMysql.ts';

const app = express();
const PORT = 3000;

// Instantiate the relational DBMS implementation
const db = new EventSphereDB();

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express API endpoints - must be placed BEFORE compiling Vite assets
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Full state of the database
app.get('/api/db/state', async (req, res) => {
  try {
    const [state, participantCount, revenueSummary, eventParticipationView, certificateStatusView] = await Promise.all([
      db.getState(),
      db.GetParticipantCount(),
      db.GetRevenueSummary(),
      db.getEventParticipationView(),
      db.getCertificateStatusView()
    ]);
    res.json({
      state,
      participantCount,
      revenueSummary,
      eventParticipationView,
      certificateStatusView
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Execute arbitrary SQL query
app.post('/api/db/query', async (req, res) => {
  const { query } = req.body;
  if (!query) {
    res.status(400).json({ error: 'SQL Query parameter is required.' });
    return;
  }
  
  try {
    const result = await db.executeSQL(query);
    res.json({
      result,
      stats: {
        participantCount: await db.GetParticipantCount(),
        revenueSummary: await db.GetRevenueSummary()
      }
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Reset database
postRoute('/api/db/reset', async (req: express.Request, res: express.Response) => {
  try {
    await db.resetState();
    res.json({ success: true, message: "Database re-seeded successfully." });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CRUD Endpoint handlers for direct web controls

// Create User
postRoute('/api/users/create', async (req: express.Request, res: express.Response) => {
  try {
    const user = await db.createUser(req.body);
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update User
postRoute('/api/users/update', async (req: express.Request, res: express.Response) => {
  try {
    const { userId, ...fields } = req.body;
    const user = await db.updateUser(Number(userId), fields);
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete User
postRoute('/api/users/delete', async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.body;
    const success = await db.deleteUser(Number(userId));
    res.json({ success });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Create Event
postRoute('/api/events/create', async (req: express.Request, res: express.Response) => {
  try {
    const event = await db.createEvent({
      event_name: req.body.event_name,
      event_description: req.body.event_description,
      event_date: req.body.event_date,
      event_time: req.body.event_time,
      venue: req.body.venue,
      capacity: Number(req.body.capacity),
      registration_fee: Number(req.body.registration_fee)
    });
    res.json({ success: true, data: event });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update Event
postRoute('/api/events/update', async (req: express.Request, res: express.Response) => {
  try {
    const { eventId, ...fields } = req.body;
    if (fields.capacity) fields.capacity = Number(fields.capacity);
    if (fields.registration_fee) fields.registration_fee = Number(fields.registration_fee);
    
    const event = await db.updateEvent(Number(eventId), fields);
    res.json({ success: true, data: event, triggerLogs: (event as any).triggerLogs });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete Event
postRoute('/api/events/delete', async (req: express.Request, res: express.Response) => {
  try {
    const { eventId } = req.body;
    const success = await db.deleteEvent(Number(eventId));
    res.json({ success });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Register User
postRoute('/api/registrations/create', async (req: express.Request, res: express.Response) => {
  try {
    const { userId, eventId } = req.body;
    const r = await db.createRegistration(Number(userId), Number(eventId));
    res.json({ success: true, data: r });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete Registration
postRoute('/api/registrations/delete', async (req: express.Request, res: express.Response) => {
  try {
    const { registrationId } = req.body;
    const success = await db.deleteRegistration(Number(registrationId));
    res.json({ success });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Log payment status change (triggers audit table log)
postRoute('/api/payments/update-status', async (req: express.Request, res: express.Response) => {
  try {
    const { paymentId, status } = req.body;
    const updatedPay = await db.updatePaymentStatus(Number(paymentId), status);
    res.json({ success: true, data: updatedPay, triggerLogs: (updatedPay as any).triggerLogs });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Set Attendance (triggers certificate issue)
postRoute('/api/attendance/update-status', async (req: express.Request, res: express.Response) => {
  try {
    const { attendanceId, status } = req.body;
    const updatedAtt = await db.updateAttendanceStatus(Number(attendanceId), status);
    res.json({ success: true, data: updatedAtt, triggerLogs: (updatedAtt as any).triggerLogs });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Add Volunteer
postRoute('/api/volunteers/create', async (req: express.Request, res: express.Response) => {
  try {
    const { userId, eventId, role, hours } = req.body;
    const vol = await db.addVolunteer(Number(userId), Number(eventId), role, Number(hours));
    res.json({ success: true, data: vol });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Helper functions for routes to keep TS types safe
function postRoute(pathStr: string, handler: (req: express.Request, res: express.Response) => Promise<void> | void) {
  app.post(pathStr, handler);
}

// Vite middleware configuration for serving the React application
async function setupViteServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EventSphere Relational Server listening on port ${PORT}`);
  });
}

setupViteServer();
