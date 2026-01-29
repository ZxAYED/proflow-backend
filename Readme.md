# 🚀 ProFlow Backend

![ProFlow Banner](https://img.shields.io/badge/ProFlow-Enterprise%20Grade-blue?style=for-the-badge&logo=typescript)

**ProFlow** is a robust, scalable, and enterprise-ready backend solution designed for managing complex project lifecycles, freelance marketplaces, or task-based collaboration platforms. Built with **Node.js**, **Express**, **TypeScript**, and **Prisma**, it demonstrates a mastery of modern backend architecture, ensuring security, performance, and maintainability.

> **Note to HR / Hiring Managers:**
> This repository represents a production-standard backend architecture. It features:
>
> - **Role-Based Access Control (RBAC)** (Admin, Buyer, Solver)
> - **Complex State Management** (Project & Task Lifecycles)
> - **Realtime Updates** via Server-Sent Events (SSE)
> - **Containerization** with Docker & Docker Compose
> - **Type Safety** with TypeScript & Zod validation
> - **ORM** integration with PostgreSQL & Prisma

---

## 🛠 Tech Stack

| Category       | Technologies                     |
| -------------- | -------------------------------- |
| **Core**       | Node.js, Express.js, TypeScript  |
| **Database**   | PostgreSQL, Prisma ORM           |
| **Validation** | Zod                              |
| **Security**   | JWT, Bcrypt, Helmet, Cors        |
| **Realtime**   | Server-Sent Events (SSE)         |
| **DevOps**     | Docker, Docker Compose           |
| **Storage**    | Multer, Supabase (Cloud Storage) |

---

## 🐳 Deployment

### Using Docker Compose

Deploy the full stack (Backend + PostgreSQL) with a single command:

```bash
docker-compose up -d --build
```

### Manual Setup

1. **Install Dependencies:** `npm install`
2. **Database Setup:** `npx prisma migrate dev`
3. **Start Server:** `npm run dev`

---

## 📚 API Documentation (Exhaustive)

### 1. 🔐 Authentication (`/auth`)

#### Register User

- **Endpoint**: `POST /auth/register`
- **Role**: Public
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: (Binary) Avatar image (Optional)
  - `data`: (Stringified JSON)
    ```json
    {
      "email": "user@example.com",
      "password": "Password123!",
      "name": "John Doe",
      "role": "SOLVER" // or "BUYER"
    }
    ```
- **Response**:
  ```json
  {
    "statusCode": 200,
    "success": true,
    "message": "User registered successfully",
    "data": { ...userObject }
  }
  ```

#### Login

- **Endpoint**: `POST /auth/login`
- **Role**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response**:
  ```json
  {
    "statusCode": 200,
    "success": true,
    "data": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
  ```

#### Verify OTP (Email Verification)

- **Endpoint**: `POST /auth/verify-otp`
- **Role**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```
- **Response**: `{ "success": true, "message": "Email verified successfully!" }`

#### Resend OTP

- **Endpoint**: `POST /auth/resend-otp`
- **Role**: Public
- **Request Body**: `{ "email": "user@example.com" }`

#### Refresh Token

- **Endpoint**: `POST /auth/refresh-token`
- **Role**: Public (Requires `refreshToken` cookie)
- **Response**: `{ "accessToken": "..." }`

#### Forgot Password

- **Endpoint**: `POST /auth/forgot-password`
- **Role**: Public
- **Request Body**: `{ "email": "user@example.com" }`

#### Reset Password

- **Endpoint**: `POST /auth/reset-password`
- **Role**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "otp": "123456",
    "newPassword": "NewPassword123!"
  }
  ```

---

### 2. 🏢 Projects (`/projects`)

#### Create Project

- **Endpoint**: `POST /projects`
- **Role**: `BUYER`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: (Binary) Cover image
  - `data`: (Stringified JSON)
    ```json
    {
      "title": "E-commerce App",
      "description": "Full stack project...",
      "skillsRequired": ["React", "Node"],
      "budget": 5000,
      "deadline": "2025-12-31T00:00:00Z"
    }
    ```

#### Get All Projects

- **Endpoint**: `GET /projects`
- **Role**: Auth (All Roles)
- **Query Params (Filters)**:
  - `page`: default 1
  - `limit`: default 10
  - `searchTerm`: Search title/description
  - `status`: `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
  - `skills`: Comma-separated (e.g., "React,Node")
  - `buyerId`: Filter by specific buyer
  - `assignedSolverId`: Filter by assigned solver
  - `sortBy`: default "createdAt"
  - `sortOrder`: "asc" or "desc"
- **Response**:
  ```json
  {
    "meta": { "page": 1, "limit": 10, "total": 50 },
    "data": [ ...projects ]
  }
  ```

#### Get Project By ID

- **Endpoint**: `GET /projects/:id`
- **Role**: Auth (All Roles)

#### Update Project

- **Endpoint**: `PATCH /projects/:id`
- **Role**: `BUYER` (Owner)
- **Content-Type**: `multipart/form-data`
- **Form Fields**: `file` (optional), `data` (partial project object)

#### Delete Project

- **Endpoint**: `DELETE /projects/:id`
- **Role**: `BUYER` (Owner)

#### Request to Work (Solver)

- **Endpoint**: `POST /projects/request`
- **Role**: `SOLVER`
- **Request Body**:
  ```json
  {
    "projectId": "uuid...",
    "message": "I am interested!"
  }
  ```

#### Get Project Requests

- **Endpoint**: `GET /projects/:projectId/requests`
- **Role**: `BUYER`
- **Response**: List of solvers who requested this project.

#### Assign Solver

- **Endpoint**: `POST /projects/assign`
- **Role**: `BUYER`
- **Request Body**:
  ```json
  {
    "projectId": "uuid...",
    "solverId": "uuid..."
  }
  ```

#### Get Project Activity

- **Endpoint**: `GET /projects/:projectId/activity`
- **Role**: Auth (All Roles)

---

### 3. 🤝 Work Requests (`/requests`)

#### Create Work Request (Proposal)

- **Endpoint**: `POST /requests`
- **Role**: `SOLVER`
- **Request Body**:
  ```json
  {
    "projectId": "uuid...",
    "proposal": "Detailed proposal...",
    "bidAmount": 500
  }
  ```

#### Get Work Requests

- **Endpoint**: `GET /requests`
- **Role**: `BUYER` (sees requests for their projects), `SOLVER` (sees their own requests)
- **Query Params**: `page`, `limit`, `sortBy`, `sortOrder`

#### Accept Work Request

- **Endpoint**: `POST /requests/accept`
- **Role**: `BUYER`
- **Request Body**:
  ```json
  {
    "requestId": "uuid..."
  }
  ```

---

### 4. ✅ Tasks (`/tasks`)

#### Create Task

- **Endpoint**: `POST /tasks`
- **Role**: `SOLVER`
- **Request Body**:
  ```json
  {
    "projectId": "uuid...",
    "title": "Database Setup",
    "description": "Install Postgres...",
    "timeline": "2025-01-01T00:00:00Z",
    "status": "IN_PROGRESS" // Optional
  }
  ```

#### Submit Task

- **Endpoint**: `POST /tasks/:taskId/submissions`
- **Role**: `SOLVER`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: (Binary) Submission file
  - `data`: (Stringified JSON) - Optional
    ```json
    { "file": "https://external-link.com" } // If not using file upload
    ```

#### Get Latest Submission

- **Endpoint**: `GET /tasks/:taskId/submissions/latest`
- **Role**: Auth (All Roles)

#### Review Task

- **Endpoint**: `PATCH /tasks/:taskId/review`
- **Role**: `BUYER`
- **Request Body**:
  ```json
  {
    "status": "ACCEPTED", // or "REJECTED"
    "reviewComments": "Great work!" // Required if REJECTED
  }
  ```

#### Create Sub-Item

- **Endpoint**: `POST /tasks/:taskId/items`
- **Role**: `SOLVER`
- **Request Body**:
  ```json
  {
    "title": "Install Docker",
    "isDone": false,
    "order": 1
  }
  ```

#### Get Sub-Items

- **Endpoint**: `GET /tasks/:taskId/items`
- **Role**: Auth (All Roles)

---

### 5. 📝 Task Sub-Items (`/task-items`)

#### Update Sub-Item

- **Endpoint**: `PATCH /task-items/:id`
- **Role**: `SOLVER`
- **Request Body**:
  ```json
  {
    "title": "Updated Title",
    "isDone": true
  }
  ```

#### Delete Sub-Item

- **Endpoint**: `DELETE /task-items/:id`
- **Role**: `SOLVER`

---

### 6. 🧑‍💻 Solver Profiles (`/solver-profiles`)

#### Get Profile (Public)

- **Endpoint**: `GET /solver-profiles/:id`
- **Role**: Public (All Roles)

#### Get My Profile

- **Endpoint**: `GET /solver-profiles/me/profile`
- **Role**: `SOLVER`

#### Update Profile

- **Endpoint**: `PATCH /solver-profiles/me/profile`
- **Role**: `SOLVER`
- **Request Body**:
  ```json
  {
    "bio": "...",
    "skills": ["React", "Node"],
    "experience": "5 years...",
    "portfolio": "https://..."
  }
  ```

#### Add Education

- **Endpoint**: `POST /solver-profiles/education`
- **Role**: `SOLVER`
- **Request Body**:
  ```json
  {
    "school": "MIT",
    "degree": "CS",
    "startYear": "2018",
    "endYear": "2022"
  }
  ```

#### Delete Education

- **Endpoint**: `DELETE /solver-profiles/education/:id`
- **Role**: `SOLVER`

#### Add Experience

- **Endpoint**: `POST /solver-profiles/experience`
- **Role**: `SOLVER`
- **Request Body**:
  ```json
  {
    "company": "Google",
    "role": "Engineer",
    "startDate": "2020",
    "endDate": "Present"
  }
  ```

#### Delete Experience

- **Endpoint**: `DELETE /solver-profiles/experience/:id`
- **Role**: `SOLVER`

#### Add Portfolio Project

- **Endpoint**: `POST /solver-profiles/projects`
- **Role**: `SOLVER`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: (Binary) Project Image
  - `data`: (Stringified JSON)
    ```json
    {
      "title": "My Portfolio",
      "description": "...",
      "projectUrl": "https://..."
    }
    ```

#### Delete Portfolio Project

- **Endpoint**: `DELETE /solver-profiles/projects/:id`
- **Role**: `SOLVER`

---

### 7. 👮 Admin (`/admin`)

#### Assign Buyer Role

- **Endpoint**: `POST /admin/assign-buyer-role`
- **Role**: `ADMIN`
- **Request Body**: `{ "userId": "uuid..." }`

#### Get All Users

- **Endpoint**: `GET /admin/users`
- **Role**: `ADMIN`
- **Query Params**:
  - `searchTerm`: Search email/name
  - `role`: `SOLVER`, `BUYER`, `ADMIN`
  - `isVerified`: `true` / `false`
  - `page`, `limit`, `sortBy`, `sortOrder`

#### Get User By ID

- **Endpoint**: `GET /admin/user/:userId`
- **Role**: `ADMIN`

#### Get All Projects (Admin View)

- **Endpoint**: `GET /admin/projects`
- **Role**: `ADMIN`
- **Query Params**: `searchTerm`, `status`, `buyerId`, `assignedSolverId`, `page`, `limit`

#### Assign Project (Force Assign)

- **Endpoint**: `POST /admin/assign-project`
- **Role**: `ADMIN`
- **Request Body**:
  ```json
  {
    "projectId": "uuid...",
    "solverId": "uuid..."
  }
  ```

---

### 8. 📊 Dashboard (`/dashboard`)

#### Get Dashboard Stats

- **Endpoint**: `GET /dashboard/stats`
- **Role**: Auth (Response depends on user role)
- **Response (If BUYER)**:
  ```json
  {
    "statusCode": 200,
    "success": true,
    "data": {
      "myProjects": [
        { "status": "OPEN", "_count": { "id": 5 } },
        { "status": "IN_PROGRESS", "_count": { "id": 2 } }
      ],
      "pendingRequestsCount": 3,
      "tasksNeedingReviewCount": 1,
      "recentActivity": [
        {
          "id": "...",
          "action": "SOLVER_REQUESTED",
          "message": "Solver requested...",
          "createdAt": "...",
          "actor": { "name": "Bob", "avatarUrl": "..." },
          "project": { "title": "My App" }
        }
      ]
    }
  }
  ```
- **Response (If SOLVER)**:
  ```json
  {
    "statusCode": 200,
    "success": true,
    "data": {
      "assignedProjectsCount": 2,
      "tasksInProgressCount": 5,
      "submissionsPendingReviewCount": 1,
      "tasksDueSoon": [
        {
          "id": "...",
          "title": "Fix Bugs",
          "deadline": "2025-01-15...",
          "project": { "title": "E-commerce" }
        }
      ],
      "recentActivity": [ ... ]
    }
  }
  ```
- **Response (If ADMIN)**:
  ```json
  {
    "statusCode": 200,
    "success": true,
    "data": {
      "userCounts": [
        { "role": "BUYER", "_count": { "id": 10 } },
        { "role": "SOLVER", "_count": { "id": 50 } }
      ],
      "projectCounts": [ ... ],
      "taskCounts": [ ... ],
      "recentActivity": [ ... ]
    }
  }
  ```

---

### 9. 📜 Activity Logs (`/activity-logs`)

#### Get Activity Logs

- **Endpoint**: `GET /activity-logs`
- **Role**: Auth (Returns logs relevant to the user's role/context)
- **Response**: List of last 10 activities.

---

### 10. 📡 Realtime (`/realtime`)

#### Subscribe to Events (SSE)

- **Endpoint**: `GET /realtime/events`
- **Role**: Auth (All Roles)
- **Headers**: `Accept: text/event-stream`
- **Description**: Server-Sent Events stream for real-time notifications.

---

## 👨‍💻 Author

**Ready for Hire!**
This project demonstrates my ability to build secure, scalable, and well-documented backend systems.
