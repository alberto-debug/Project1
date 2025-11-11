# ANU SMS Notification Prototype (Static)

A static HTML/CSS/JS prototype that demonstrates an SMS-based notification system for ANU. It includes:
- Compose and send simulated SMS to selected recipients
- Scheduling messages for later (in-browser timers)
- Contacts filtering by department, year, and course unit
- Reporting dashboard with KPIs and a delivery-by-department chart

Note: This is a front-end only mock. SMS delivery is simulated in the browser; no real messages are sent.

## How to run
- Open `index.html` in your browser (double-click or drag-drop into the window).
- No server or build step required.

## Key files
- `index.html` — App layout (navbar, sidebar, panels)
- `assets/css/styles.css` — Corporate modern styling
- `assets/js/mockSmsGateway.js` — Simulated SMS gateway and data store
- `assets/js/app.js` — UI logic, filters, scheduling, analytics

## Using the prototype
Login
- On load you’ll see the login screen.
- Username: admin (any password) for Admin role.
- Username: lecture (any password) for Lecturer role.

1. Go to Compose
   - Filter recipients by Department, Year, and Course Unit
   - Select recipients (Select All for quick tests)
   - Choose a template or write a custom message; placeholders like `{course}`, `{time}`, `{date}`, `{event}`, `{venue}` are auto-filled for preview
   - Click Send Now or Schedule…
2. Scheduler
   - Pick a future date/time and confirm
   - View upcoming sends in the Schedule tab; you can cancel pending items
3. Reports
   - See Sent, Delivered, Failed, Scheduled counters
   - Delivery-by-Department stacked bar chart
   - Recent messages table with per-send delivery progress
4. Contacts
   - Browse a larger subset of seeded contacts (students and staff)

## Assumptions and scope
- Chart.js is loaded via CDN for simplicity
- Contacts are synthetic for demo purposes
- Delivery outcomes are randomly simulated (~92% success)
- Scheduling relies on the tab staying open (in-memory timers)
- Role restrictions:
   - Admin: full access, can message any recipients.
   - Lecturer: can only message students in assigned unit(s). Must select Unit in Compose; defaults to all students in allowed units if none manually selected.

## Next steps for a real system
- Replace mock gateway with a real SMS provider (e.g., Twilio, Africa’s Talking) via backend APIs
- Persist data in a database (contacts, messages, schedules, delivery receipts)
- Secure authentication/authorization (lecturers/admins)
- Robust scheduler (cron/queue) and webhooks for delivery status
- Import/export contacts and LMS integration
