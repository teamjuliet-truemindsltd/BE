# 🎓 TrueMinds TalentFlow LMS - Backend

Welcome to the backend of the **TrueMinds TalentFlow LMS**, a robust and scalable learning management system built with the modern web stack. This repository provides a solid foundation for building a production-ready educational platform.

---

### 🌐 Live Hosting
The API is currently live and accessible at:
👉 **[https://backend-lms-0kw1.onrender.com/api/v1](https://backend-lms-0kw1.onrender.com/api/v1)**

---

---

## 🛠 Tech Stack

The project leverages industry-standard technologies to ensure high performance, security, and developer productivity:

| Category | Technology |
| :--- | :--- |
| **Framework** | [NestJS](https://nestjs.com/) (v11+) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Database** | [MySQL](https://www.mysql.com/) (v8.0) |
| **ORM** | [TypeORM](https://typeorm.io/) |
| **Auth** | [JWT](https://jwt.io/) & [Passport](https://www.passportjs.org/) |
| **Security** | Bcrypt (Password Hashing), RBAC (Role-Based Access Control) |
| **Media Hosting** | [Cloudinary](https://cloudinary.com/) (Video & Image Hosting) |
| **API Docs** | [Swagger / OpenAPI 3.0](https://swagger.io/) |

| **Infrastucture** | [Docker](https://www.docker.com/) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or higher (v22 recommended)
- **Database**: MySQL 8.0 or Docker Compose
- **Package Manager**: npm

### Step 1: Environment Setup

Copy the example environment file and configure your local settings:

```bash
cp .env.example .env
```

> [!IMPORTANT]
> Make sure to open your new `.env` file and fill in your:
> 1. **SMTP Mail** credentials (e.g., a Gmail App Password) so that the system can deliver OTP verification emails.
> 2. **Cloudinary** credentials (`CLOUD_NAME`, `API_KEY`, `API_SECRET`) to enable video and media uploads.


### Step 2: Launch Infrastructure (Docker)

To spin up the MySQL database quickly:

```bash
docker compose up -d
```

### Step 3: Run the Application

```bash
# Install dependencies
npm install

# Start in development mode (watch mode)
npm run start:dev

# Build for production
npm run build
npm run start:prod
```

---

## ✅Backend Additions

The following modules were implemented and tested end-to-end:

- **Assignments Module**: assignment creation, submissions (with file upload), grading workflows.
- **Progress Module**: student progress tracking, instructor class progress view, course analytics.
- **Collaboration Module**: course forum threads/replies and direct messaging with read-state support.

---

## 📖 API Documentation

The backend is fully documented and testable out of the box.

### 1. Swagger UI
Interactive documentation is available at:
👉 Local: **[http://localhost:3000/api/v1/docs](http://localhost:3000/api/v1/docs)**
👉 Live: **[https://backend-lms-0kw1.onrender.com/api/v1/docs](https://backend-lms-0kw1.onrender.com/api/v1/docs)**

### 2. Postman Collection
For dedicated API testing, import the collection found in:
📁 `docs/postman/TalentFlow_LMS.postman_collection.json`

> [!TIP]
> Registration now requires email verification. The expected flow is: **Register -> Verify OTP -> Login**.
> The Postman collection automatically handles JWT storage! Just run the **Login** request after verifying your email, and all subsequent authenticated calls will use the captured token.

### 3. Endpoints Overview

#### Auth Endpoints (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/register` | Register a new user (Student/Instructor) | No |
| POST | `/verify-otp` | Verify account via email OTP | No |
| POST | `/resend-otp` | Resend verification OTP | No |
| POST | `/login` | Authenticate and receive JWT | No |
| POST | `/forgot-password` | Request password reset code | No |
| POST | `/reset-password` | Reset password using OTP code | No |
| GET | `/me` | Get current user's security profile | Yes |

#### User Management (`/api/v1/users`)
| Method | Endpoint | Description | Auth Required | Roles |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/` | List all users (Paginated) | Yes | Admin |
| GET | `/me` | Get profile details of logged-in user | Yes | Any |
| PATCH | `/me` | Update profile information | Yes | Any |
| PATCH | `/me/password` | Change account password | Yes | Any |
| GET | `/:id` | Get details of a specific user | Yes | Admin |
| PATCH | `/:id/role` | Change user's role | Yes | Admin |
| PATCH | `/:id/deactivate`| Disable a user's account | Yes | Admin |
| PATCH | `/:id/activate` | Enable a user's account | Yes | Admin |

#### Media & Video Uploads (`/api/v1/media`)
| Method | Endpoint | Description | Auth Required | Roles |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/upload/video` | Upload a video file to Cloudinary | Yes | Instructor, Admin |

#### Courses Management (`/api/v1/courses`)
| Method | Endpoint | Description | Auth Required | Roles |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/` | Create a new course | Yes | Instructor, Admin |
| GET | `/` | List all published courses (Paginated) | No | Any |
| GET | `/:id` | Get course details | No | Any |
| PATCH | `/:id` | Update course details | Yes | Instructor, Admin |
| DELETE | `/:id` | Remove a course | Yes | Instructor, Admin |
| POST | `/:id/modules` | Add a module to a course | Yes | Instructor, Admin |
| GET | `/:id/modules` | Get modules for a course | Yes | Any |

#### Lessons Management (`/api/v1/lessons`)
| Method | Endpoint | Description | Auth Required | Roles |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/?moduleId=...` | Create a lesson in a module | Yes | Instructor, Admin |
| GET | `/:id` | Get lesson content | Yes | Any |
| PATCH | `/:id` | Update lesson details | Yes | Instructor, Admin |
| DELETE | `/:id` | Remove a lesson | Yes | Instructor, Admin |

#### Enrollments & Progress (`/api/v1`)
| Method | Endpoint | Description | Auth Required | Roles |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/courses/:id/enroll` | Enroll in a course | Yes | Student |
| GET | `/users/me/enrollments` | Get my enrolled courses & progress| Yes | Student |
| POST | `/lessons/:id/complete`| Mark a lesson as completed | Yes | Student |

#### Assignments (`/api/v1/assignments`)
| Method | Endpoint | Description | Auth Required | Roles |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/` | Create a new assignment | Yes | Instructor |
| GET | `/course/:courseId` | Get assignments for a course | Yes | Any authenticated user |
| POST | `/:id/submit` | Submit assignment (supports file upload) | Yes | Student |
| GET | `/:id/submissions` | Get submissions for an assignment | Yes | Instructor |
| PATCH | `/submissions/:submissionId/grade` | Grade a submission | Yes | Instructor |

#### Progress Module (`/api/v1/progress`)
| Method | Endpoint | Description | Auth Required | Roles |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/me` | Get student progress across enrolled courses | Yes | Student |
| GET | `/me/course/:courseId` | Get detailed progress for one course | Yes | Student |
| GET | `/course/:courseId/students` | Get student progress list in a course | Yes | Instructor |
| GET | `/course/:courseId/analytics` | Get aggregate course progress analytics | Yes | Instructor |

#### Collaboration Module (`/api/v1/collaboration`)
| Method | Endpoint | Description | Auth Required | Roles |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/forum/threads` | Create a forum thread | Yes | Any authenticated user |
| GET | `/forum/threads/course/:courseId` | Get forum threads by course | Yes | Any authenticated user |
| GET | `/forum/threads/:threadId` | Get thread details with replies | Yes | Any authenticated user |
| POST | `/forum/threads/:threadId/replies` | Add reply to a thread | Yes | Any authenticated user |
| POST | `/messages` | Send direct message | Yes | Any authenticated user |
| GET | `/messages/inbox` | Get inbox messages | Yes | Any authenticated user |
| GET | `/messages/conversation/:otherUserId` | Get direct-message conversation | Yes | Any authenticated user |
| PATCH | `/messages/:messageId/read` | Mark direct message as read | Yes | Any authenticated user |

#### Dashboard & Analytics (`/api/v1/dashboard`)
| Method | Endpoint | Description | Auth Required | Roles |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/` | Get role-based dashboard statistics | Yes | Any |

---

## 🔍 Database Management

To view and manage the underlying MySQL database in your browser:
1. Ensure the Docker containers are running: `docker compose up -d`.
2. Open your browser and navigate to: **[http://localhost:8080](http://localhost:8080)**.
3. Use the following credentials to log in to **phpMyAdmin**:
   - **Server**: `mysql`
   - **Username**: `root`
   - **Password**: `password` (matching the `MYSQL_ROOT_PASSWORD` in your config).

---

## 👑 Admin Seeding

For security reasons, the public registration endpoint (`/api/v1/auth/register`) only allows for **Student** or **Instructor** roles. To create an initial **Admin** user:

1. Ensure your database is running.
2. Run the pre-configured seeding script:
   ```bash
   npm run seed:admin
   ```
   *Note: This script will create a default admin with the email `admin@trueminds.io` and password `superadmin123` if it doesn't already exist.*

---

## 📂 Folder Structure

The project follows a modular architecture for high maintainability:

```text
src/
├── app.module.ts          # Root module
├── main.ts                # Entry point & Swagger configuration
├── auth/                  # Authentication, JWT, and Guards
│   ├── decorators/        # Custom decorators (e.g., @Roles, @CurrentUser)
│   ├── dto/               # Auth-related DTOs
│   ├── guards/            # JWT and Role-based guards
│   └── ...
├── cloudinary/            # Cloudinary SDK provider and upload service
├── media/                 # Media controller for file upload endpoints
├── common/                # Shared utilities, filters, and pipes

│   └── enums/             # Global enums (e.g., UserRole)
├── users/                 # Core User management module
│   ├── entities/          # TypeORM Entity definitions
│   ├── dto/               # User-related DTOs
│   └── ...
├── courses/               # Course & Module management
├── lessons/               # Lesson content management
├── assignments/           # Assignment creation, submission, and grading
├── enrollments/           # Student enrollment & progress tracking
├── progress/              # Per-course progress and analytics endpoints
├── collaboration/         # Forum threads/replies and direct messages
├── notifications/         # Email & OTP notification system
├── outbox/                # Transactional outbox for guaranteed delivery
└── dashboard/             # Role-based analytics module
    ├── dashboard.controller.ts
    ├── dashboard.service.ts
    └── dashboard.module.ts
```

---

## ✉️ Notifications & OTP System

The platform includes a robust **One-Time Password (OTP)** verification flow and an asynchronous notification system.

- **Verified Users Only**: New users cannot log in until they verify their email via the `/api/v1/auth/verify-otp` endpoint.
- **Secure Password Recovery**: Users can securely reset forgotten passwords using the `/api/v1/auth/forgot-password` and `/api/v1/auth/reset-password` flow.
- **Context-Aware OTPs**: The system uses a `purpose` flag (e.g., `VERIFY_EMAIL`, `RESET_PASSWORD`) to ensure OTPs are used only for their intended action.
- **Transactional Outbox Pattern**: To guarantee email delivery, OTP emails are not sent synchronously during the request. Instead, they are safely written to the `outbox` database table within the same **database transaction** as the associated user update.
- **Background Worker**: A scheduled background cron job (`@nestjs/schedule`) continuously scans the outbox and delivers pending emails (Verification or Password Reset) using NodeMailer, complete with automatic retries for failed deliveries.

---

## 🎥 Video & Media Uploads

The platform supports high-performance video uploads powered by **Cloudinary**.

- **Stateless Streaming**: To avoid taxing the server's disk space, video files are streamed directly from the incoming request buffer to Cloudinary using `streamifier`.
- **Validation**:
  - Max File Size: **100MB**.
  - Allowed Formats: `.mp4`, `.mkv`, `.avi`.
- **Usage**: Upon a successful upload to `/api/v1/media/upload/video`, the API returns a secure HTTPS URL. This URL can then be saved as the `contentUrl` for a Lesson in the Courses module.


---

## 🔐 Security Highlights

- **Bcrypt Hashing**: All passwords are salted and hashed using Bcrypt before being stored.
- **JWT Authentication**: Stateless authentication using secure JSON Web Tokens.
- **RBAC**: Fine-grained access control using `@Roles(UserRole.ADMIN)`.
- **Validation**: Strict input validation using `class-validator` and global `ValidationPipe`.

---

## 🏥 Health Check

The API includes a dedicated health check endpoint to monitor the system status and uptime. This is also used by Cloud hosting providers (like Render) to verify the service is running correctly.

- **Endpoint**: `GET /api/v1/health`
- **Live URL**: [https://backend-lms-0kw1.onrender.com/api/v1/health](https://backend-lms-0kw1.onrender.com/api/v1/health)

**Response Example:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-31T14:55:00.000Z",
  "uptime": 12345.67
}
```

---

## 🏗 Moving Forward: How to Use This Boilerplate

This repository is a **living template**. Here is how to expand it:

### 1. Creating New Modules
Use the Nest CLI to scaffold new features in seconds:
```bash
npx nest g resource courses
```

### 2. Adding Entities
Ensure your entities utilize the decorators from `typeorm`. Once created, register them in their respective module using `TypeOrmModule.forFeature([NewEntity])`.

### 3. Protecting Routes
Simply add the `@UseGuards(JwtAuthGuard, RolesGuard)` decorator to any controller or method that requires authorization.

---

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:cov
```

---

## 📄 License

This project is [UNLICENSED](LICENSE).
