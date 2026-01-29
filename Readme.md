# ProFlow Backend

ProFlow is a Marketplace Project Workflow System connecting Buyers and Solvers. It manages the entire lifecycle of a project from request to completion, including tasks, subtasks, submissions, and reviews.

## 🚀 Tech Stack
- **Framework**: Express.js (TypeScript)
- **Database**: PostgreSQL (NeonDB)
- **ORM**: Prisma
- **Realtime**: Server-Sent Events (SSE)
- **Email**: Nodemailer
- **Storage**: Supabase (via wrapper)

## 🔑 Roles & Permissions

| Role | Permissions |
|Or | --- |
| **USER** | View-only access (Public Feed, Project Details, Solver Profiles). Cannot create/edit. |
| **SOLVER** | Manage Profile, Request Projects, Create Tasks (Assigned), Submit Work (ZIP), Manage Subtasks. |
| **BUYER** | Create Projects, Accept Solvers, Review Submissions, Manage Own Projects. |
| **ADMIN** | Manage Users (Assign Buyer Role), View All Projects/Tasks, System Oversight. |

## 📦 Modules & API Routes

### Auth
- `POST /auth/register` - Register as USER or SOLVER
- `POST /auth/login` - Login
- `POST /auth/refresh-token` - Refresh JWT
- `POST /auth/forgot-password` - Send OTP
- `POST /auth/resend-otp` - Resend OTP
- `POST /auth/reset-password` - Reset with OTP

### Admin
- `GET /admin/users` - List users
- `PATCH /admin/users/:userId/role` - Assign BUYER role
- `GET /admin/projects` - List all projects
- `GET /admin/dashboard` - Admin stats

### Solver Profile
- `GET /solver-profiles/:id` - View profile (Public)
- `GET /solver-profiles/me/profile` - View own profile
- `PATCH /solver-profiles/me/profile` - Update bio, skills
- `POST /solver-profiles/education` - Add education
- `DELETE /solver-profiles/education/:id` - Delete education
- `POST /solver-profiles/experience` - Add experience
- `DELETE /solver-profiles/experience/:id` - Delete experience
- `POST /solver-profiles/projects` - Add personal project
- `DELETE /solver-profiles/projects/:id` - Delete personal project

### Projects
- `POST /projects` - Create Project (Buyer)
- `GET /projects` - Public Feed (Filters: status, skills, search)
- `GET /projects/:id` - Project Details
- `PATCH /projects/:id` - Update Project (Buyer)
- `DELETE /projects/:id` - Delete Project (Buyer, OPEN only)
- `POST /projects/request` - Request Project (Solver)
- `GET /projects/:projectId/requests` - View Requests (Buyer)
- `POST /projects/assign` - Assign Solver (Buyer)
- `GET /projects/:projectId/activity` - Activity Feed

### Tasks & Submissions
- `POST /tasks` - Create Task (Assigned Solver)
- `GET /tasks` - List Tasks (Project/User context)
- `POST /tasks/:taskId/submit` - Upload ZIP Submission (Solver)
- `POST /tasks/:taskId/review` - Review Submission (Buyer)
- `GET /tasks/:taskId/submission` - Get Latest Submission
- `POST /task-items/:taskId/items` - Add Subtask
- `PATCH /task-items/:id` - Update Subtask (Toggle Done)
- `DELETE /task-items/:id` - Delete Subtask

### Dashboard & Realtime
- `GET /dashboard/stats` - Role-based stats
- `GET /realtime/subscribe` - SSE Endpoint for live updates

## 🛠 Setup & Run

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create `.env` file:
   ```env
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."
   JWT_SECRET="supersecret"
   NODE_ENV="development"
   PORT=3000
   EMAIL_HOST="smtp.example.com"
   EMAIL_PORT=587
   EMAIL_USER="user@example.com"
   EMAIL_PASS="password"
   EMAIL_FROM="noreply@proflow.com"
   SUPABASE_URL="https://..."
   SUPABASE_KEY="eyJ..."
   ```

3. **Database Migration**
   ```bash
   npx prisma migrate dev
   ```

4. **Run Server**
   ```bash
   npm run dev
   ```

## 🧪 Testing
- **Auth**: Register/Login to get Token.
- **Flow**:
  1. Admin makes User -> Buyer.
  2. Buyer creates Project.
  3. Solver requests Project.
  4. Buyer accepts Solver.
  5. Solver creates Task -> Submits ZIP.
  6. Buyer Reviews (Accept/Reject).
  7. Check Dashboard & Email Notifications.

## 📝 Notes
- **ZIP Upload**: Only `.zip` files allowed. Max 30MB.
- **Activity Log**: Automatically tracks key events (Assignment, Submission, Review).
- **Notifications**: Emails sent on Request, Assignment, Submission, Review.
