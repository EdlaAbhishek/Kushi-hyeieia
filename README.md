# Khushi Hygieia Healthcare Platform

Professional, enterprise-grade healthcare platform connecting patients, doctors, and hospitals across India.

---

## Project Structure

```
/
├── frontend/
│   ├── pages/          # All HTML pages
│   ├── styles/         # main.css (single stylesheet)
│   ├── js/             # main.js, chat.js
│   ├── services/       # api.js  (all API calls)
│   └── assets/         # logo.png, hero-family.png
│
├── backend/
│   ├── server.js       # Express entry point
│   ├── config.js       # Environment config
│   ├── package.json
│   ├── routes/         # auth, appointments, doctors, emergency, ai
│   ├── controllers/    # Business logic per route
│   ├── middleware/     # auth (JWT), errorHandler, validate
│   ├── models/         # DB queries — User, Doctor, Appointment
│   └── services/       # (reserved for 3rd-party integrations)
│
└── database/
    └── schema.sql      # PostgreSQL schema
```

---

## Getting Started

### 1. Database
```bash
createdb khushi_hygieia
psql khushi_hygieia -f database/schema.sql
```

### 2. Backend
```bash
cd backend
cp ../.env.example ../.env   # fill in your values
npm install
npm run dev                  # nodemon on port 3000
```

### 3. Frontend
Open `frontend/pages/index.html` with any static server:
```bash
npx serve frontend/pages
```

---

## API Routes

| Method | Endpoint                   | Auth     | Description             |
|--------|----------------------------|----------|-------------------------|
| POST   | /api/auth/register         | —        | Create account          |
| POST   | /api/auth/login            | —        | Get JWT token           |
| GET    | /api/doctors               | —        | Search doctors          |
| GET    | /api/appointments/slots    | Required | Available time slots    |
| POST   | /api/appointments          | Required | Book appointment        |
| POST   | /api/emergency/trigger     | Optional | SOS alert               |
| GET    | /api/emergency/hospitals   | —        | Nearby emergency units  |
| POST   | /api/ai/chat               | —        | AI assistant            |

---

## Environment Variables

See `.env.example`. All secrets stay server-side — the frontend has no API keys.

---

## Tech Stack

| Layer     | Technology            |
|-----------|-----------------------|
| Frontend  | HTML5 / CSS3 / ES6    |
| Backend   | Node.js + Express v4  |
| Database  | PostgreSQL 16         |
| Auth      | JWT (jsonwebtoken)    |
| Hashing   | bcryptjs              |
