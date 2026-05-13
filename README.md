# BlogSpace — Full-Stack Blog Platform

A complete blogging platform with user authentication, post management, and nested comments.

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS        |
| Backend  | Node.js, Express.js                 |
| Database | PostgreSQL + Sequelize ORM          |
| Auth     | JWT (JSON Web Tokens) + bcrypt      |

## Features

- **Authentication** — Register, login, JWT-based sessions, change password
- **Blog Posts** — Create, edit, delete, draft/publish, tags, cover images, view counts
- **Comments** — Nested replies (1 level deep), edit/delete own comments
- **Search & Filter** — Full-text search, filter by tag, pagination
- **Dashboard** — Manage all your posts with stats
- **Profile** — Update username, bio, avatar URL

## Project Structure

```
blog/
├── backend/
│   ├── src/
│   │   ├── config/       # Database config
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth, error handling
│   │   ├── models/       # Sequelize models
│   │   ├── routes/       # Express routers
│   │   ├── utils/        # JWT, slugify helpers
│   │   └── server.js     # Entry point
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/          # Axios API calls
    │   ├── components/   # Reusable UI components
    │   ├── context/      # React Context (Auth)
    │   ├── pages/        # Page components
    │   └── main.jsx
    ├── index.html
    └── package.json
```

## Setup & Running

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup

```sql
CREATE DATABASE blog_platform;
```

### 2. Backend

```bash
cd backend
npm install
# Edit .env with your DB credentials
npm run dev
```

The API runs on **http://localhost:5000**

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on **http://localhost:5173**

## API Endpoints

### Auth
| Method | Endpoint                  | Auth | Description          |
|--------|---------------------------|------|----------------------|
| POST   | /api/auth/register        | No   | Register new user    |
| POST   | /api/auth/login           | No   | Login                |
| GET    | /api/auth/me              | Yes  | Get current user     |
| PUT    | /api/auth/profile         | Yes  | Update profile       |
| PUT    | /api/auth/change-password | Yes  | Change password      |

### Posts
| Method | Endpoint              | Auth     | Description              |
|--------|-----------------------|----------|--------------------------|
| GET    | /api/posts            | No       | List published posts     |
| GET    | /api/posts/my/posts   | Yes      | List your posts          |
| GET    | /api/posts/:slug      | No       | Get post by slug         |
| POST   | /api/posts            | Yes      | Create post              |
| PUT    | /api/posts/:id        | Yes      | Update post (author/admin)|
| DELETE | /api/posts/:id        | Yes      | Delete post (author/admin)|

### Comments
| Method | Endpoint                        | Auth | Description                  |
|--------|---------------------------------|------|------------------------------|
| GET    | /api/posts/:postId/comments     | No   | Get comments for a post      |
| POST   | /api/posts/:postId/comments     | Yes  | Add comment                  |
| PUT    | /api/comments/:id               | Yes  | Edit comment (author/admin)  |
| DELETE | /api/comments/:id               | Yes  | Delete comment (author/admin)|
