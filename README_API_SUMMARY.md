# ProFlow Backend API Summary & Test Plan

## Overview
This document summarizes the key API modules, their role-based access controls, and a testing guide for the ProFlow marketplace workflow.

## 1. Authentication & Users
- **POST /auth/register**: Register as BUYER or SOLVER.
- **POST /auth/login**: Get access token.

## 2. Solver Profile (Role: SOLVER)
- **GET /solver-profiles/:id**: Public view of solver profile.
- **PATCH /solver-profiles/me/profile**: Update bio, hourly rate, skills.
- **POST /solver-profiles/education**: Add education.
- **POST /solver-profiles/experience**: Add work experience.
- **POST /solver-profiles/projects**: Add personal portfolio project (Requires `imageUrl`).

## 3. Projects (Role: BUYER)
- **POST /projects**: Create a new project (Status: OPEN).
- **GET /projects**: List projects (Filter by status, skills).
- **GET /projects/:id/requests**: View pending work requests.
- **GET /projects/:id/activity**: View project activity feed.

## 4. Work Requests (Role: SOLVER -> BUYER)
- **POST /requests**: Solver requests to work on an OPEN project.
- **POST /requests/:requestId/accept**: Buyer accepts a request.
  - *Effect*: Project status -> ASSIGNED. Other requests -> REJECTED. Solver notified.

## 5. Tasks & Subitems (Role: SOLVER)
- **POST /tasks**: Create a task for an assigned project.
  - *Effect*: Project status -> IN_PROGRESS (if first task).
- **POST /tasks/:taskId/items**: Add subtasks (checklist).
- **PATCH /task-items/:id**: Mark subitem as done (`isDone: true`).
- **POST /tasks/:taskId/submissions**: Submit work (ZIP file URL required).
  - *Effect*: Task status -> SUBMITTED. Buyer notified.

## 6. Review Workflow (Role: BUYER)
- **GET /tasks/:taskId/submissions/latest**: View submission.
- **PATCH /tasks/:taskId/review**: Accept or Reject submission.
  - **Accept**: Task -> COMPLETED. If all tasks completed -> Project -> COMPLETED.
  - **Reject**: Task -> REJECTED. Requires `reviewComments`.

## 7. Dashboard & Realtime
- **GET /dashboard**: Role-specific metrics (Tasks due, Pending requests, etc.).
- **GET /realtime/events**: SSE endpoint for live activity updates.

---

## Test Plan / Verification Scenarios

### Scenario A: Full Project Lifecycle
1. **Setup**:
   - Register User A (Buyer).
   - Register User B (Solver).
2. **Project Creation**:
   - User A creates Project "Website Redesign".
   - Verify status is `OPEN`.
3. **Bidding**:
   - User B requests to work on "Website Redesign".
   - User A sees request in `/projects/:id/requests`.
4. **Assignment**:
   - User A accepts User B's request.
   - Verify Project status is `ASSIGNED`.
   - Verify User B receives email notification.
5. **Execution**:
   - User B creates Task "Homepage Layout".
   - User B adds subitems "Header", "Footer".
   - User B marks subitems as done.
   - User B submits task (ZIP link).
   - Verify Task status is `SUBMITTED`.
6. **Review**:
   - User A reviews submission.
   - User A accepts submission.
   - Verify Task status `COMPLETED`.
   - Verify Project status `COMPLETED` (since it's the only task).

### Scenario B: Rejection Flow
1. **Submission**: User B submits task.
2. **Rejection**: User A rejects with comment "Fix header alignment".
   - Verify Task status `REJECTED`.
   - User B receives email with comments.
3. **Resubmission**: User B submits again.
   - Verify Task status `SUBMITTED`.

### Scenario C: Security Checks
- Verify SOLVER cannot edit Project details.
- Verify BUYER cannot create Tasks.
- Verify User C cannot view User A's dashboard stats.
