# Cricket Easy Scorecard

Cricket Easy Scorecard is a full-stack CPSC 2650 final project built with HTML5, CSS3, JavaScript, Bootstrap, Node.js, Express, and MongoDB. It tracks cricket matches, supports role-based access, logs requests for accountability, and proxies external cricket data through the server.

## Current Website Behavior

- Guest users can open the home page, about page, login page, and register page.
- Guests can see a limited set of matches on the home page, but they cannot open full match pages or match details until they log in.
- Member users can view full match data, live scores, match details, and create matches.
- Admin users can do everything members can do and can also open the admin dashboard, manage user roles, and review logs.

## Course Requirements Covered

### Part I: Design Patterns

- Bootstrap GUI patterns are used across the site, including a navigation bar, responsive grid layout, cards, carousel/slider content, and modal windows.
- Module pattern is used in configuration and utility modules.
- Singleton pattern is used for configuration and MongoDB connection management.
- Factory pattern is implemented in [utils/factory.js](utils/factory.js) for users, matches, teams, scores, and logs.
- MVC is implemented with separate `models`, `views/pages`, and `controllers` directories.

### Part II: Authentication, Authorization, and Accountability

- Authentication uses usernames, passwords, sessions, and `bcryptjs` password hashing.
- Authorization supports the three required roles: `admin`, `member`, and `guest`.
- Accountability is implemented through MongoDB log collections populated by the logger middleware.

### Part III: Web APIs

- Client-side code calls the Node.js server with REST-style GET, POST, PUT, and DELETE requests.
- The server proxies external cricket data so API keys stay on the backend.

### Part IV: MongoDB Backend Database

- The project supports local MongoDB and remote MongoDB Atlas through the connection utility.
- CRUD operations are implemented through the MongoDB utility and model modules.

### Part V: Git Version Control

- This project folder is tracked in Git and connected to the GitHub remote repository for submission.
- The repository now includes commit history on `main`; continue making clear commits for fixes or improvements before final submission.
- This is a solo submission by Harshil Patel, so all commits are expected to come from the same Git identity.

## Project Structure

- `app.js` - Express server, page routing, API routing, session setup
- `config/config.js` - singleton configuration module and environment loading
- `controllers/` - authentication, admin, and API controllers
- `middleware/` - authentication and accountability logging middleware
- `models/` - MongoDB model modules for users, matches, teams, logs, and shared DB access
- `utils/factory.js` - factory-method implementation for mapper objects
- `utils/mongoUtil.js` - compatibility wrapper around the MongoDB model utility
- `views/pages/` - HTML pages served by Express
- `public/css/` - custom CSS styling
- `seed.js` - optional database seeding script

## Main Pages

- `/` - home page
- `/pages/about.html` - about page
- `/pages/login.html` - login page
- `/pages/register.html` - register page
- `/pages/matches.html` - full match list for logged-in users
- `/pages/match-details.html` - match details for logged-in users
- `/pages/create-match.html` - create match page for logged-in users
- `/pages/live-scores.html` - live score page for logged-in users
- `/pages/admin-dashboard.html` - admin dashboard
- `/pages/admin-users.html` - admin user management
- `/pages/admin-logs.html` - admin log viewer

## Main API Endpoints

- `POST /login`
- `POST /register`
- `GET /logout`
- `GET /api/session`
- `GET /api/matches`
- `GET /api/matches/:id`
- `POST /api/matches`
- `PUT /api/matches/:id`
- `DELETE /api/matches/:id`
- `GET /api/external/cricket`
- `GET /api/users`
- `POST /admin/users/:id/role`
- `GET /api/logs`

## Environment Variables

The app reads `.env` from the project root.

- `SESSION_SECRET` - session encryption secret
- `MONGODB_URI` - optional MongoDB Atlas or custom MongoDB connection string
- `CRICKET_API_KEY` - optional external cricket API key
- `NODE_ENV` - optional runtime mode
- `PORT` - optional server port, defaults to `3000`

## Install and Run

1. Install dependencies with `npm install`.
2. Make sure `.env` contains the values you want to use.
3. Start MongoDB locally, or set `MONGODB_URI` to a working Atlas connection string.
4. Optional: run `node seed.js` to load demo data.
5. Start the app with `npm start` or `npm run dev`.
6. Open `http://localhost:3000`.

## Seeded Demo Accounts

These accounts exist only after running `node seed.js`.

- `admin / admin123`
- `member / member123`
- `alice / alice123`
- `bob / bob123`
- `charlie / charlie123`

Important: `node seed.js` clears existing `users`, `matches`, `teams`, and `logs` before inserting demo data.

## Notes

- If `CRICKET_API_KEY` is missing, or if the external provider fails, the app falls back to built-in mock cricket data for the external-data pages.
- Login and registration depend on a working MongoDB connection.
- The current site serves HTML pages from `views/pages`; the README does not describe the older EJS layout because that is not the current runtime structure.

## Author

Harshil Patel  
Full Stack Web Development II (CPSC 2650)  
Langara College
