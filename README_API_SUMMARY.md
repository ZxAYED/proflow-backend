# ProFlow Backend API Documentation

Base URL: `http://localhost:5000/api/v1`

## 1. Authentication

### Register User (Multipart/Form-Data)

- **Endpoint**: `POST /auth/register`
- **Auth**: Public
- **Content-Type**: `multipart/form-data`
- **Body**:
  | Key | Type | Description |
  |-----|------|-------------|
  | `email` | Text | User email |
  | `password` | Text | Min 6 chars |
  | `name` | Text | Full name (Optional) |
  | `role` | Text | `BUYER` or `SOLVER` |
  | `file` | File | Avatar image (Optional) |
- **Response**:
  ```json
  {
    "statusCode": 201,
    "success": true,
    "message": "User registered successfully!",
    "data": {
      "id": "uuid...",
      "email": "user@example.com",
      "role": "SOLVER",
      "avatarUrl": "https://..."
    }
  }
  ```

### Login

- **Endpoint**: `POST /auth/login`
- **Auth**: Public
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "secret_password"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "ey...",
      "refreshToken": "ey..."
    }
  }
  ```

---

## 2. Projects (Role: BUYER)

### Create Project (Multipart/Form-Data)

- **Endpoint**: `POST /projects`
- **Auth**: `BUYER`
- **Content-Type**: `multipart/form-data`
- **Body**:
  | Key | Type | Description |
  |-----|------|-------------|
  | `title` | Text | 4-120 chars |
  | `description` | Text | 30-5000 chars |
  | `budget` | Number | Optional |
  | `deadline` | Text | ISO Date String (e.g. `2024-12-31T23:59:59Z`) |
  | `skillsRequired[]`| Text | Repeat for each skill (e.g. `React`, `Node`) |
  | `file` | File | Cover image (Optional) |
- **Response**:
  ```json
  {
    "success": true,
    "data": { "id": "...", "title": "..." }
  }
  ```

### Update Project

- **Endpoint**: `PATCH /projects/:id`
- **Auth**: `BUYER`
- **Content-Type**: `multipart/form-data`
- **Body**: Same fields as Create, but all optional.

### Get All Projects

- **Endpoint**: `GET /projects`
- **Params**:
  - `page`: Number (Default 1)
  - `limit`: Number (Default 10)
  - `searchTerm`: String (Search title/desc)
  - `minBudget`: Number
  - `maxBudget`: Number
  - `status`: `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`

---

## 3. Work Requests

### Request to Work (Role: SOLVER)

- **Endpoint**: `POST /projects/request`
- **Auth**: `SOLVER`
- **Body**:
  ```json
  {
    "projectId": "uuid-of-project",
    "message": "I can do this!"
  }
  ```

### View Requests (Role: BUYER)

- **Endpoint**: `GET /projects/:projectId/requests`
- **Auth**: `BUYER`

### Assign Solver (Role: BUYER)

- **Endpoint**: `POST /projects/assign`
- **Auth**: `BUYER`
- **Body**:
  ```json
  {
    "projectId": "uuid-of-project",
    "solverId": "uuid-of-solver"
  }
  ```

---

## 4. Tasks (Role: SOLVER)

### Create Task

- **Endpoint**: `POST /tasks`
- **Auth**: `SOLVER`
- **Body**:
  ```json
  {
    "projectId": "uuid-of-project",
    "title": "Setup Database",
    "description": "Install Postgres and run migrations",
    "timeline": "2024-12-01T10:00:00Z"
  }
  ```

### Submit Task (Multipart/Form-Data)

- **Endpoint**: `POST /tasks/:taskId/submissions`
- **Auth**: `SOLVER`
- **Content-Type**: `multipart/form-data`
- **Body**:
  | Key | Type | Description |
  |-----|------|-------------|
  | `file` | File | ZIP/RAR/ISO file |
- **Response**:
  ```json
  {
    "success": true,
    "message": "Task submitted successfully!"
  }
  ```

### Add Sub-items (Checklist)

- **Endpoint**: `POST /tasks/:taskId/items`
- **Auth**: `SOLVER`
- **Body**:
  ```json
  {
    "title": "Install Prisma",
    "isDone": false,
    "order": 1
  }
  ```

---

## 5. Review (Role: BUYER)

### Review Submission

- **Endpoint**: `PATCH /tasks/:taskId/review`
- **Auth**: `BUYER`
- **Body (Accept)**:
  ```json
  {
    "status": "ACCEPTED"
  }
  ```
- **Body (Reject)**:
  ```json
  {
    "status": "REJECTED",
    "reviewComments": "Fix the migration script error."
  }
  ```

---

## 6. Solver Profile (Role: SOLVER)

### Add Personal Project (Multipart/Form-Data)

- **Endpoint**: `POST /solver-profiles/projects`
- **Auth**: `SOLVER`
- **Content-Type**: `multipart/form-data`
- **Body**:
  | Key | Type | Description |
  |-----|------|-------------|
  | `title` | Text | Required |
  | `description` | Text | Optional |
  | `projectUrl` | Text | Optional URL |
  | `file` | File | Project Screenshot (Required) |

### Update Profile

- **Endpoint**: `PATCH /solver-profiles/me/profile`
- **Auth**: `SOLVER`
- **Body**:
  ```json
  {
    "bio": "Full stack developer...",
    "skills": ["React", "Node.js"],
    "experience": "5 years...",
    "portfolio": "https://myportfolio.com"
  }
  ```

---

## 7. Dashboard & Realtime

### Get Dashboard Stats

- **Endpoint**: `GET /dashboard/buyer` (or `/dashboard/solver`)
- **Auth**: Role specific
- **Response**:
  ```json
  {
    "data": {
      "totalProjects": 5,
      "activeProjects": 2,
      "pendingRequests": 1
      // ... role specific fields
    }
  }
  ```

### Realtime Events (SSE)

- **Endpoint**: `GET /realtime/events`
- **Auth**: Public (Connect with EventSource)
- **Headers**: `Accept: text/event-stream`
- **Events**:
  - `project-update`: Project status changes.
  - `task-update`: Task submission/review.
  - `notification`: New alerts for user.
