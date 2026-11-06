# Lost & Found Portal (MERN)

A full-stack lost-and-found portal. Users sign up, report items they've **lost** or **found**, search what others have posted, and mark items **resolved** once they're returned.

## Features

- JWT authentication with bcrypt-hashed passwords
- Report items as `Lost` or `Found` with description, location, date and contact info
- Case-insensitive search by item name
- Owners can edit, resolve (`Active` → `Resolved`) or delete their own posts
- Protected routes on both the API and the React dashboard

## API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/register` | – | Create an account |
| POST | `/api/login` | – | Get a JWT |
| POST | `/api/items` | ✔ | Report a lost / found item |
| GET | `/api/items` | ✔ | List all items |
| GET | `/api/items/search?name=` | ✔ | Search items by name |
| GET | `/api/items/:id` | ✔ | Item details |
| PUT | `/api/items/:id` | ✔ | Update an item (owner only) |
| DELETE | `/api/items/:id` | ✔ | Delete an item (owner only) |

## Project structure

```
backend/    Express 5 + Mongoose 9 API (routes, models, JWT middleware)
frontend/   React 19 + Vite + React Router (Login, Register, Dashboard)
```

## Run locally

```bash
# API
cd backend
npm install
cp .env.example .env     # set MONGO_URI and JWT_SECRET
node server.js           # http://localhost:5000

# Web app
cd ../frontend
npm install
npm run dev
```

## Stack

MongoDB · Express · React · Node.js · JWT · bcrypt · Axios · Vite
