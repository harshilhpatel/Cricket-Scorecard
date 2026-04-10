# Quick Start

## Cricket Easy Scorecard

Use these steps to run the current version of the project.

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB running locally, or a working MongoDB Atlas URI

## Setup

1. Install dependencies with `npm install`.
2. Open `.env` and review these values:
   - `SESSION_SECRET`
   - `MONGODB_URI`
   - `CRICKET_API_KEY`
   - `PORT`
3. If you are using local MongoDB, make sure the MongoDB service is already running.
4. If you are using MongoDB Atlas, make sure `MONGODB_URI` is valid and your IP is allowed.

## Optional Demo Data

Run `node seed.js` if you want demo users, teams, matches, and logs.

Seeded accounts:

- `admin / admin123`
- `member / member123`
- `alice / alice123`
- `bob / bob123`
- `charlie / charlie123`

Important: the seed script deletes existing `users`, `matches`, `teams`, and `logs` before recreating demo data.

## Start the App

- Production mode: `npm start`
- Development mode: `npm run dev`

Open `http://localhost:3000` in your browser after the server starts.

## What You Should See

- Guests can browse the home page and about page.
- Guests see only a limited match feed on the home page.
- Guests must log in or register before opening full match pages or match details.
- Members can access match pages and create matches.
- Admins can also access admin pages, user-role management, and request logs.

## Main Environment Notes

- `SESSION_SECRET` is used for session security.
- `MONGODB_URI` is optional if you want to use the default local MongoDB connection.
- `CRICKET_API_KEY` is optional. Without it, external live data may fall back to mock or alternate data.
- `PORT` defaults to `3000` if you do not set it.

## Common Issues

Login or signup fails:

- Check that MongoDB is reachable.
- Check that `MONGODB_URI` is correct if you are using Atlas.
- Check Atlas network access and credentials.

Live cricket data does not load:

- Add a valid `CRICKET_API_KEY` to `.env`.
- Restart the server after changing `.env`.

Port `3000` is busy:

- Change `PORT` in `.env` and restart the server.

The browser shows old behavior after code changes:

- Do a hard refresh so cached JavaScript is cleared.

## Full Documentation

See `README.md` for the project overview, routes, requirements mapping, and structure.
