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

**Base URL:** `/api`

### Common Conventions

- **Auth header:** `Authorization: <accessToken>` (raw JWT, **no** `Bearer` prefix)
- **Roles:** `ADMIN`, `BUYER`, `SOLVER`, `USER`
  - **Important:** Users who register as `BUYER` or `USER` are stored as `USER` and are blocked by the auth middleware until an admin upgrades them to `BUYER`.
  - The middleware blocks `USER` even if a route lists `USER` as allowed.
- **Response envelope (all endpoints):**
  ```json
  {
    "success": true,
    "message": "Human readable message",
    "meta": { "page": 1, "limit": 10, "total": 42 },
    "data": {}
  }
  ```
  `meta` and `data` are omitted when not applicable.
- **Error response:**
  ```json
  { "success": false, "message": "Error message" }
  ```
- **Pagination defaults:** `page=1`, `limit=10`, `sortBy=createdAt`, `sortOrder=desc`
- **Multipart uploads:** use `Content-Type: multipart/form-data` and the `file` field name. You can send other fields directly or as JSON under `data` (stringified).

### Enums

```json
{
  "Role": ["ADMIN", "USER", "BUYER", "SOLVER"],
  "ProjectStatus": ["OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
  "RequestStatus": ["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN"],
  "TaskStatus": ["IN_PROGRESS", "SUBMITTED", "COMPLETED", "REJECTED"],
  "SubmissionStatus": ["SUBMITTED", "ACCEPTED", "REJECTED"],
  "ActivityAction": [
    "PROJECT_CREATED",
    "SOLVER_REQUESTED",
    "SOLVER_ASSIGNED",
    "TASK_CREATED",
    "TASK_UPDATED",
    "SUBMISSION_UPLOADED",
    "SUBMISSION_ACCEPTED",
    "SUBMISSION_REJECTED",
    "PROJECT_COMPLETED"
  ]
}
```

---

### 1. 🔐 Authentication (`/auth`)

#### POST /auth/register

- **Auth:** Public
- **Content-Type:** `multipart/form-data`
- **Body (fields or `data` JSON):**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "name": "John Doe",
    "role": "SOLVER",
    "avatarUrl": "https://..." // optional (auto-set when uploading file)
  }
  ```
  **File:** `file` (optional avatar image)
- **Response:**
  ```json
  {
    "success": true,
    "message": "User registered successfully!",
    "data": {
      "id": "cuid...",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "SOLVER",
      "isVerified": false,
      "otp": "123456",
      "otpExpiry": "2026-01-29T18:34:12.000Z",
      "avatarUrl": "https://...",
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```
  **Notes:** If `role` is `BUYER` or `USER`, the backend stores the role as `USER` (not verified). Only `SOLVER` is accepted directly.

#### POST /auth/login

- **Auth:** Public
- **Body:**
  ```json
  { "email": "user@example.com", "password": "Password123!" }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "User logged in successfully!",
    "data": {
      "accessToken": "jwt...",
      "refreshToken": "jwt..."
    }
  }
  ```
  **Notes:** Also sets `refreshToken` as an HTTP-only cookie. Login fails if `isVerified` is `false`.

#### POST /auth/refresh-token

- **Auth:** Public (requires `refreshToken` cookie)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Access token retrieved successfully!",
    "data": { "accessToken": "jwt..." }
  }
  ```

#### POST /auth/forgot-password

- **Auth:** Public
- **Body:** `{ "email": "user@example.com" }`
- **Response:**
  ```json
  { "success": true, "message": "OTP sent to your email!" }
  ```

#### POST /auth/reset-password

- **Auth:** Public
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "otp": "123456",
    "newPassword": "NewPassword123!"
  }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Password reset successfully!" }
  ```

#### POST /auth/verify-otp

- **Auth:** Public
- **Body:** `{ "email": "user@example.com", "otp": "123456" }`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Email verified successfully!",
    "data": { "message": "Email verified successfully" }
  }
  ```

#### POST /auth/resend-otp

- **Auth:** Public
- **Body:** `{ "email": "user@example.com" }`
- **Response:**
  ```json
  {
    "success": true,
    "message": "OTP resent successfully!",
    "data": { "message": "OTP resent successfully" }
  }
  ```

---

### 2. 🏢 Projects (`/projects`)

#### POST /projects

- **Auth:** `BUYER`
- **Content-Type:** `multipart/form-data`
- **Body (fields or `data` JSON):**
  ```json
  {
    "title": "E-commerce App",
    "description": "Full stack project...",
    "skillsRequired": ["React", "Node"],
    "budget": 5000,
    "deadline": "2026-12-31T00:00:00.000Z",
    "coverImageUrl": "https://...", // optional (auto-set when uploading file)
    "coverImageName": "cover.png" // optional
  }
  ```
  **File:** `file` (optional cover image)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Project created successfully!",
    "data": {
      "id": "cuid...",
      "title": "E-commerce App",
      "description": "Full stack project...",
      "skillsRequired": ["React", "Node"],
      "budget": 5000,
      "deadline": "2026-12-31T00:00:00.000Z",
      "status": "OPEN",
      "coverImageUrl": "https://...",
      "coverImageName": "cover.png",
      "buyerId": "cuid...",
      "assignedSolverId": null,
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```

#### GET /projects

- **Auth:** `BUYER`, `SOLVER`, `ADMIN` (note: `USER` is blocked by middleware)
- **Query Params (filters):**
  - `page`, `limit`, `sortBy`, `sortOrder`
  - `searchTerm` (searches `title` + `description`)
  - `status` (see `ProjectStatus`)
  - `buyerId`
  - `skills` (comma-separated list, matches any)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Projects retrieved successfully!",
    "meta": { "page": 1, "limit": 10, "total": 50 },
    "data": [
      {
        "id": "cuid...",
        "title": "E-commerce App",
        "description": "Full stack project...",
        "shortDescription": "Full stack project...",
        "skillsRequired": ["React", "Node"],
        "status": "OPEN",
        "deadline": "2026-12-31T00:00:00.000Z",
        "createdAt": "2026-01-29T18:34:12.000Z",
        "budget": 5000,
        "coverImageUrl": "https://...",
        "buyer": {
          "id": "cuid...",
          "name": "Buyer Name",
          "email": "buyer@example.com",
          "avatarUrl": "https://..."
        }
      }
    ]
  }
  ```

#### GET /projects/:id

- **Auth:** `BUYER`, `SOLVER`, `ADMIN` (note: `USER` is blocked by middleware)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Project retrieved successfully!",
    "data": {
      "id": "cuid...",
      "title": "E-commerce App",
      "description": "Full stack project...",
      "skillsRequired": ["React", "Node"],
      "budget": 5000,
      "deadline": "2026-12-31T00:00:00.000Z",
      "status": "OPEN",
      "coverImageUrl": "https://...",
      "coverImageName": "cover.png",
      "buyerId": "cuid...",
      "assignedSolverId": "cuid...",
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z",
      "buyer": {
        "id": "cuid...",
        "name": "Buyer Name",
        "email": "buyer@example.com",
        "avatarUrl": "https://...",
        "buyerProfile": { "id": "cuid...", "companyName": "ACME", "bio": "...", "location": "NYC" }
      },
      "assignedSolver": {
        "id": "cuid...",
        "name": "Solver Name",
        "email": "solver@example.com",
        "avatarUrl": "https://...",
        "solverProfile": { "id": "cuid...", "bio": "...", "skills": ["React"] }
      },
      "requests": [
        {
          "id": "cuid...",
          "projectId": "cuid...",
          "solverId": "cuid...",
          "status": "PENDING",
          "message": "I am interested!",
          "createdAt": "2026-01-29T18:34:12.000Z",
          "updatedAt": "2026-01-29T18:34:12.000Z"
        }
      ]
    }
  }
  ```

#### PATCH /projects/:id

- **Auth:** `BUYER` (project owner)
- **Content-Type:** `multipart/form-data`
- **Body (partial, fields or `data` JSON):**
  ```json
  {
    "title": "Updated Title",
    "description": "Updated description...",
    "skillsRequired": ["React", "Node", "Prisma"],
    "budget": 6000,
    "deadline": "2026-12-31T00:00:00.000Z",
    "coverImageUrl": "https://...",
    "coverImageName": "cover.png"
  }
  ```
**File:** `file` (optional cover image)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Project updated successfully!",
    "data": {
      "id": "cuid...",
      "title": "Updated Title",
      "description": "Updated description...",
      "skillsRequired": ["React", "Node", "Prisma"],
      "budget": 6000,
      "deadline": "2026-12-31T00:00:00.000Z",
      "status": "OPEN",
      "coverImageUrl": "https://...",
      "coverImageName": "cover.png",
      "buyerId": "cuid...",
      "assignedSolverId": null,
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```
- **Notes:** If the project status is **not** `OPEN`, updating `title`, `skillsRequired`, or `budget` throws `409`.

#### DELETE /projects/:id

- **Auth:** `BUYER` (project owner)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Project deleted successfully!",
    "data": { "id": "cuid...", "...": "deleted project fields" }
  }
  ```
  **Notes:** Only allowed when project status is `OPEN`.

#### POST /projects/request

- **Auth:** `SOLVER`
- **Body:**
  ```json
  { "projectId": "cuid...", "message": "I am interested!" }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Project request sent successfully!",
    "data": {
      "id": "cuid...",
      "projectId": "cuid...",
      "solverId": "cuid...",
      "status": "PENDING",
      "message": "I am interested!",
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```

#### GET /projects/:projectId/requests

- **Auth:** `BUYER` (project owner)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Project requests retrieved successfully!",
    "data": [
      {
        "id": "cuid...",
        "projectId": "cuid...",
        "solverId": "cuid...",
        "status": "PENDING",
        "message": "I am interested!",
        "solver": {
          "id": "cuid...",
          "email": "solver@example.com",
          "solverProfile": { "id": "cuid...", "bio": "...", "skills": ["React"] }
        },
        "createdAt": "2026-01-29T18:34:12.000Z",
        "updatedAt": "2026-01-29T18:34:12.000Z"
      }
    ]
  }
  ```
  **Notes:** The `solver` object is returned without a field whitelist and currently includes the full User record (including `passwordHash`, `otp`, and `otpExpiry`).

#### POST /projects/assign

- **Auth:** `BUYER` (project owner)
- **Body:** `{ "projectId": "cuid...", "solverId": "cuid..." }`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Solver assigned successfully!",
    "data": {
      "id": "cuid...",
      "title": "E-commerce App",
      "description": "Full stack project...",
      "skillsRequired": ["React", "Node"],
      "budget": 5000,
      "deadline": "2026-12-31T00:00:00.000Z",
      "status": "ASSIGNED",
      "buyerId": "cuid...",
      "assignedSolverId": "cuid...",
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```

#### GET /projects/:projectId/activity

- **Auth:** `BUYER`, `SOLVER`, `ADMIN`
- **Query Params:** `page`, `limit`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Project activity retrieved successfully!",
    "meta": { "page": 1, "limit": 10, "total": 25 },
    "data": [
      {
        "id": "cuid...",
        "action": "TASK_CREATED",
        "actorId": "cuid...",
        "projectId": "cuid...",
        "taskId": "cuid...",
        "submissionId": null,
        "message": "Task Database Setup created",
        "metadata": null,
        "createdAt": "2026-01-29T18:34:12.000Z",
        "actor": { "name": "Solver Name", "avatarUrl": "https://...", "email": "solver@example.com" }
      }
    ]
  }
  ```

---

### 3. 🤝 Work Requests (`/requests`)

#### POST /requests

- **Auth:** `SOLVER`
- **Body:**
  ```json
  {
    "projectId": "cuid...",
    "proposal": "Detailed proposal...",
    "bidAmount": 500
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Work request submitted successfully!",
    "data": {
      "id": "cuid...",
      "projectId": "cuid...",
      "solverId": "cuid...",
      "status": "PENDING",
      "message": null,
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```
  **Notes:** `proposal` and `bidAmount` are validated but **not persisted** (not in schema).

#### GET /requests

- **Auth:** `BUYER` (requests for their projects) or `SOLVER` (their own requests)
- **Query Params:** `page`, `limit`, `sortBy`, `sortOrder`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Work requests fetched successfully!",
    "meta": { "page": 1, "limit": 10, "total": 3 },
    "data": [
      {
        "id": "cuid...",
        "projectId": "cuid...",
        "solverId": "cuid...",
        "status": "PENDING",
        "message": null,
        "project": { "id": "cuid...", "title": "E-commerce App", "status": "OPEN" },
        "solver": { "id": "cuid...", "email": "solver@example.com", "solverProfile": { "id": "cuid..." } },
        "createdAt": "2026-01-29T18:34:12.000Z",
        "updatedAt": "2026-01-29T18:34:12.000Z"
      }
    ]
  }
  ```

#### POST /requests/accept

- **Auth:** `BUYER`
- **Body:** `{ "requestId": "cuid..." }`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Work request accepted successfully!",
    "data": {
      "id": "cuid...",
      "projectId": "cuid...",
      "solverId": "cuid...",
      "status": "ACCEPTED",
      "message": null,
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```

---

### 4. ✅ Tasks (`/tasks`)

#### POST /tasks

- **Auth:** `SOLVER`
- **Body:**
  ```json
  {
    "projectId": "cuid...",
    "title": "Database Setup",
    "description": "Install Postgres...",
    "timeline": "2026-01-31T00:00:00.000Z",
    "status": "IN_PROGRESS"
  }
  ```
  **Notes:** `timeline` is stored in the `deadline` field of the task.
- **Response:**
  ```json
  {
    "success": true,
    "message": "Task created successfully!",
    "data": {
      "id": "cuid...",
      "projectId": "cuid...",
      "solverId": "cuid...",
      "title": "Database Setup",
      "description": "Install Postgres...",
      "deadline": "2026-01-31T00:00:00.000Z",
      "status": "IN_PROGRESS",
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```

#### POST /tasks/:taskId/submissions

- **Auth:** `SOLVER`
- **Content-Type:** `multipart/form-data`
- **Body:**
  - **File:** `file` (archive file)
  - **Fields or `data` JSON (optional):**
    ```json
    { "file": "https://external-link.com/file.zip", "fileName": "submission.zip" }
    ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Task submitted successfully!",
    "data": {
      "id": "cuid...",
      "taskId": "cuid...",
      "solverId": "cuid...",
      "buyerId": null,
      "fileUrl": "https://...",
      "fileName": "submission.zip",
      "fileSize": null,
      "status": "SUBMITTED",
      "reviewComments": null,
      "submittedAt": "2026-01-29T18:34:12.000Z",
      "reviewedAt": null,
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```
  **Notes:** Backend accepts archive-like MIME types and extensions (`zip`, `rar`, `iso`, `7z`, `tar`, `gz`).

#### GET /tasks/:taskId/submissions/latest

- **Auth:** `BUYER`, `SOLVER`, `ADMIN`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Latest submission retrieved successfully",
    "data": {
      "id": "cuid...",
      "taskId": "cuid...",
      "solverId": "cuid...",
      "fileUrl": "https://...",
      "fileName": "submission.zip",
      "status": "SUBMITTED",
      "solver": {
        "id": "cuid...",
        "name": "Solver Name",
        "email": "solver@example.com",
        "avatarUrl": "https://..."
      },
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```
  **Notes:** If no submission exists, `data` will be `null`.

#### PATCH /tasks/:taskId/review

- **Auth:** `BUYER`
- **Body:**
  ```json
  { "status": "ACCEPTED", "reviewComments": "Great work!" }
  ```
  **Notes:** `reviewComments` is required when `status` is `REJECTED`.
- **Response:**
  ```json
  {
    "success": true,
    "message": "Task reviewed successfully!",
    "data": {
      "id": "cuid...",
      "taskId": "cuid...",
      "solverId": "cuid...",
      "buyerId": "cuid...",
      "fileUrl": "https://...",
      "fileName": "submission.zip",
      "status": "ACCEPTED",
      "reviewComments": "Great work!",
      "reviewedAt": "2026-01-29T18:34:12.000Z",
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```

#### POST /tasks/:taskId/items

- **Auth:** `SOLVER`
- **Body:**
  ```json
  { "title": "Install Docker", "isDone": false, "order": 1 }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Subitem created successfully!",
    "data": {
      "id": "cuid...",
      "taskId": "cuid...",
      "title": "Install Docker",
      "isDone": false,
      "order": 1,
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```

#### GET /tasks/:taskId/items

- **Auth:** `SOLVER`, `BUYER`, `ADMIN`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Subitems retrieved successfully!",
    "data": [
      {
        "id": "cuid...",
        "taskId": "cuid...",
        "title": "Install Docker",
        "isDone": false,
        "order": 1,
        "createdAt": "2026-01-29T18:34:12.000Z",
        "updatedAt": "2026-01-29T18:34:12.000Z"
      }
    ]
  }
  ```

---

### 5. 📝 Task Sub-Items (`/task-items`)

#### PATCH /task-items/:id

- **Auth:** `SOLVER`
- **Body:**
  ```json
  { "title": "Updated Title", "isDone": true, "order": 2 }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Subitem updated successfully!",
    "data": {
      "id": "cuid...",
      "taskId": "cuid...",
      "title": "Updated Title",
      "isDone": true,
      "order": 2,
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```

#### DELETE /task-items/:id

- **Auth:** `SOLVER`
- **Response:**
  ```json
  { "success": true, "message": "Subitem deleted successfully!" }
  ```

---

### 6. 🧑‍💻 Solver Profiles (`/solver-profiles`)

#### GET /solver-profiles/:id

- **Auth:** Public
- **Response (when profile exists):**
  ```json
  {
    "success": true,
    "message": "Profile retrieved successfully",
    "data": {
      "id": "cuid...",
      "userId": "cuid...",
      "bio": "...",
      "skills": ["React", "Node"],
      "experience": "5 years...",
      "portfolio": "https://...",
      "user": {
        "id": "cuid...",
        "name": "Solver Name",
        "email": "solver@example.com",
        "avatarUrl": "https://...",
        "personalProjects": [],
        "education": [],
        "experience": []
      }
    }
  }
  ```
  **Notes:** If no solver profile exists yet, the API returns the **User** record (with `solverProfile` possibly `null`) instead.

#### GET /solver-profiles/me/profile

- **Auth:** `SOLVER`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Profile retrieved successfully",
    "data": {
      "id": "cuid...",
      "userId": "cuid...",
      "bio": "...",
      "skills": ["React", "Node"],
      "experience": "5 years...",
      "portfolio": "https://...",
      "user": {
        "id": "cuid...",
        "name": "Solver Name",
        "email": "solver@example.com",
        "avatarUrl": "https://..."
      }
    }
  }
  ```

#### PATCH /solver-profiles/me/profile

- **Auth:** `SOLVER`
- **Body:**
  ```json
  {
    "bio": "...",
    "skills": ["React", "Node"],
    "experience": "5 years...",
    "portfolio": "https://..."
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "data": {
      "id": "cuid...",
      "userId": "cuid...",
      "bio": "...",
      "skills": ["React", "Node"],
      "experience": "5 years...",
      "portfolio": "https://...",
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```

#### POST /solver-profiles/education

- **Auth:** `SOLVER`
- **Body:**
  ```json
  { "school": "MIT", "degree": "CS", "startYear": "2018", "endYear": "2022" }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Education added successfully",
    "data": {
      "id": "cuid...",
      "userId": "cuid...",
      "school": "MIT",
      "degree": "CS",
      "startYear": "2018",
      "endYear": "2022",
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```

#### DELETE /solver-profiles/education/:id

- **Auth:** `SOLVER`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Education deleted successfully",
    "data": {
      "id": "cuid...",
      "userId": "cuid...",
      "school": "MIT",
      "degree": "CS",
      "startYear": "2018",
      "endYear": "2022",
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```

#### POST /solver-profiles/experience

- **Auth:** `SOLVER`
- **Body:**
  ```json
  { "company": "Google", "role": "Engineer", "startDate": "2020", "endDate": "Present" }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Experience added successfully",
    "data": {
      "id": "cuid...",
      "userId": "cuid...",
      "company": "Google",
      "role": "Engineer",
      "startDate": "2020",
      "endDate": "Present",
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```

#### DELETE /solver-profiles/experience/:id

- **Auth:** `SOLVER`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Experience deleted successfully",
    "data": {
      "id": "cuid...",
      "userId": "cuid...",
      "company": "Google",
      "role": "Engineer",
      "startDate": "2020",
      "endDate": "Present",
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```

#### POST /solver-profiles/projects

- **Auth:** `SOLVER`
- **Content-Type:** `multipart/form-data`
- **Body (fields or `data` JSON):**
  ```json
  {
    "title": "My Portfolio",
    "description": "...",
    "projectUrl": "https://...",
    "imageUrl": "https://..." // optional if uploading file
  }
  ```
  **File:** `file` (project image)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Project added successfully",
    "data": {
      "id": "cuid...",
      "userId": "cuid...",
      "title": "My Portfolio",
      "description": "...",
      "projectUrl": "https://...",
      "imageUrl": "https://...",
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```

#### DELETE /solver-profiles/projects/:id

- **Auth:** `SOLVER`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Project deleted successfully",
    "data": {
      "id": "cuid...",
      "userId": "cuid...",
      "title": "My Portfolio",
      "description": "...",
      "projectUrl": "https://...",
      "imageUrl": "https://...",
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```

---

### 7. 👮 Admin (`/admin`)

#### POST /admin/assign-buyer-role

- **Auth:** `ADMIN`
- **Body:** `{ "userId": "cuid..." }`
- **Response:**
  ```json
  {
    "success": true,
    "message": "User role updated to Buyer successfully!",
    "data": {
      "id": "cuid...",
      "email": "buyer@example.com",
      "passwordHash": "$2b$...",
      "name": "Buyer Name",
      "role": "BUYER",
      "isVerified": true,
      "otp": null,
      "otpExpiry": null,
      "avatarUrl": "https://...",
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```

#### GET /admin/users

- **Auth:** `ADMIN`
- **Query Params:** `searchTerm`, `role`, `isVerified`, `page`, `limit`, `sortBy`, `sortOrder`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Users retrieved successfully!",
    "meta": { "page": 1, "limit": 10, "total": 100 },
    "data": [
      {
        "id": "cuid...",
        "email": "user@example.com",
        "passwordHash": "$2b$...",
        "name": "User Name",
        "role": "SOLVER",
        "isVerified": true,
        "otp": null,
        "otpExpiry": null,
        "avatarUrl": "https://...",
        "createdAt": "2026-01-29T18:34:12.000Z",
        "updatedAt": "2026-01-29T18:34:12.000Z"
      }
    ]
  }
  ```
  **Notes:** This endpoint currently returns raw user records, including `passwordHash` and OTP fields.

#### GET /admin/user/:userId

- **Auth:** `ADMIN`
- **Response:**
  ```json
  {
    "success": true,
    "message": "User retrieved successfully!",
    "data": {
      "id": "cuid...",
      "email": "user@example.com",
      "passwordHash": "$2b$...",
      "name": "User Name",
      "role": "SOLVER",
      "isVerified": true,
      "otp": null,
      "otpExpiry": null,
      "avatarUrl": "https://...",
      "solverProfile": {
        "id": "cuid...",
        "userId": "cuid...",
        "bio": "...",
        "skills": ["React"],
        "experience": "5 years...",
        "portfolio": "https://..."
      },
      "buyerProfile": null,
      "createdAt": "2026-01-29T18:34:12.000Z",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```

#### GET /admin/projects

- **Auth:** `ADMIN`
- **Query Params:** `searchTerm`, `status`, `buyerId`, `assignedSolverId`, `page`, `limit`, `sortBy`, `sortOrder`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Projects retrieved successfully!",
    "meta": { "page": 1, "limit": 10, "total": 25 },
    "data": [
      {
        "id": "cuid...",
        "title": "E-commerce App",
        "description": "Full stack project...",
        "skillsRequired": ["React", "Node"],
        "budget": 5000,
        "deadline": "2026-12-31T00:00:00.000Z",
        "status": "ASSIGNED",
        "coverImageUrl": "https://...",
        "coverImageName": "cover.png",
        "buyerId": "cuid...",
        "assignedSolverId": "cuid...",
        "createdAt": "2026-01-29T18:34:12.000Z",
        "updatedAt": "2026-01-29T18:34:12.000Z",
        "buyer": { "id": "cuid...", "name": "Buyer Name", "email": "buyer@example.com" },
        "assignedSolver": { "id": "cuid...", "name": "Solver Name", "email": "solver@example.com" }
      }
    ]
  }
  ```

#### POST /admin/assign-project

- **Auth:** `ADMIN`
- **Body:** `{ "projectId": "cuid...", "solverId": "cuid..." }`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Project assigned to solver successfully!",
    "data": {
      "id": "cuid...",
      "title": "E-commerce App",
      "status": "ASSIGNED",
      "buyerId": "cuid...",
      "assignedSolverId": "cuid...",
      "updatedAt": "2026-01-29T18:34:12.000Z"
    }
  }
  ```

---

### 8. 📊 Dashboard (`/dashboard`)

#### GET /dashboard/stats

- **Auth:** `BUYER`, `SOLVER`, `ADMIN`
- **Response (BUYER example):**
  ```json
  {
    "success": true,
    "message": "Dashboard stats fetched successfully!",
    "data": {
      "myProjects": [
        { "status": "OPEN", "_count": { "id": 5 } },
        { "status": "IN_PROGRESS", "_count": { "id": 2 } }
      ],
      "pendingRequestsCount": 3,
      "tasksNeedingReviewCount": 1,
      "recentActivity": [
        {
          "id": "cuid...",
          "action": "SOLVER_REQUESTED",
          "message": "Solver requested to work...",
          "createdAt": "2026-01-29T18:34:12.000Z",
          "actor": { "name": "Bob", "avatarUrl": "https://...", "email": "bob@example.com" },
          "project": { "title": "My App" },
          "task": null
        }
      ]
    }
  }
  ```
- **Response (SOLVER example):**
  ```json
  {
    "success": true,
    "message": "Dashboard stats fetched successfully!",
    "data": {
      "assignedProjectsCount": 2,
      "tasksInProgressCount": 5,
      "submissionsPendingReviewCount": 1,
      "tasksDueSoon": [
        { "id": "cuid...", "title": "Fix Bugs", "deadline": "2026-02-05T00:00:00.000Z", "project": { "title": "E-commerce" } }
      ],
      "recentActivity": [ { "id": "cuid...", "action": "TASK_CREATED", "project": { "title": "E-commerce" } } ]
    }
  }
  ```
- **Response (ADMIN example):**
  ```json
  {
    "success": true,
    "message": "Dashboard stats fetched successfully!",
    "data": {
      "userCounts": [ { "role": "BUYER", "_count": { "id": 10 } } ],
      "projectCounts": [ { "status": "OPEN", "_count": { "id": 12 } } ],
      "taskCounts": [ { "status": "IN_PROGRESS", "_count": { "id": 20 } } ],
      "recentActivity": [ { "id": "cuid...", "action": "PROJECT_CREATED", "actor": { "name": "Admin" } } ]
    }
  }
  ```

---

### 9. 📜 Activity Logs (`/activity-logs`)

#### GET /activity-logs

- **Auth:** `BUYER`, `SOLVER`, `ADMIN`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Activity logs fetched successfully!",
    "data": [
      {
        "id": "cuid...",
        "action": "PROJECT_CREATED",
        "actorId": "cuid...",
        "projectId": "cuid...",
        "taskId": null,
        "submissionId": null,
        "message": "Project E-commerce App created",
        "metadata": null,
        "createdAt": "2026-01-29T18:34:12.000Z"
      }
    ]
  }
  ```
  **Notes:** Returns the latest 10 logs; no pagination.

---

### 10. 📡 Realtime (`/realtime`)

#### GET /realtime/events

- **Auth:** `BUYER`, `SOLVER`, `ADMIN`
- **Headers:** `Accept: text/event-stream`
- **Response:** Server-Sent Events (SSE) stream.
  - **Event payload example:**
    ```json
    {
      "id": "cuid...",
      "action": "TASK_CREATED",
      "actorId": "cuid...",
      "projectId": "cuid...",
      "taskId": "cuid...",
      "submissionId": null,
      "message": "Task Database Setup created",
      "createdAt": "2026-01-29T18:34:12.000Z"
    }
    ```

---

### 11. 🩺 Health Check (root)

#### GET /

- **Auth:** Public
- **Response:** `Server is running 🎉🎉`

---
## 👨‍💻 Author

**Ready for Hire!**
This project demonstrates my ability to build secure, scalable, and well-documented backend systems.

