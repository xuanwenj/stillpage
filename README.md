# stillpage
Watch a walkthrough of the app in action:
https://drive.google.com/file/d/1q_lg3S56WYX5TOj3QMVn7mRXiQgQ2gE7/view?usp=sharing

A calm, all-in-one space for your daily todos, notes, and braindumps — organized into folders so scattered thoughts have somewhere to land.

**Live demo:** [stillpage-frontend.vercel.app](https://stillpage-frontend.vercel.app/login)

Try it out with the demo account (pre-loaded with sample todos and notes):
- **Email:** `test@example.com`
- **Password:** `password123`

> **Note:** the backend is hosted on Render's free tier, which spins down when idle. The first request after inactivity can take up to a minute to wake it up — please be patient on first load.

## Features

- **Todos** — create, complete, and reorder daily tasks with drag-and-drop
- **Notes** — rich-text note editing (bold, underline, images, and more)
- **Braindump** — a free-form space to quickly capture thoughts before organizing them
- **Folders** — group notes and braindumps for easier navigation
- **Accounts** — secure signup/login with JWT-based authentication

## Tech stack

**Frontend**
- React + TypeScript, built with Vite
- Tailwind CSS
- Tiptap (rich text editing)
- dnd-kit (drag-and-drop)
- React Router, Axios

**Backend**
- Node.js + Express + TypeScript
- MongoDB with Mongoose
- JWT authentication, bcrypt password hashing
- Jest for testing

## Related projects

- **stillpage Chrome extension** *(built, not yet published)* — lets users take notes directly on YouTube videos and save them to their stillpage account alongside the video, so video notes end up in the same place as everything else.

## Project structure

```
stillpage/
├── backend/
│   └── src/
│       ├── controllers/   # request handlers
│       ├── models/        # Mongoose schemas (user, todo, note, folder, braindump)
│       ├── routes/         # Express routes
│       ├── services/       # business logic (e.g. auth)
│       ├── middlewares/
│       └── server.ts
└── frontend/
    └── src/
        ├── pages/          # Login, Register, Dashboard, Daily, Note
        ├── components/     # Todos, TodoTools, etc.
        ├── api/             # HTTP client calls to the backend
        └── context/
```

## Getting started

### Prerequisites

- Node.js and npm
- A MongoDB instance (local or [Atlas](https://www.mongodb.com/atlas))

### 1. Clone the repo

```bash
git clone <repo-url>
cd stillpage
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```
MONGO_URI=<your MongoDB connection string>
JWT_SECRET=<a random secret string>
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

Run the backend:

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Running tests

```bash
cd backend
npm test
```
