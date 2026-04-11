## Part I: Design Patterns

- [ ] Navigation bar implemented with Bootstrap
- [ ] Grid layout implemented with Bootstrap
- [ ] Responsive design implemented with Bootstrap
- [ ] Card component implemented with Bootstrap
- [ ] Slider/carousel implemented with Bootstrap
- [ ] Modal window implemented with Bootstrap
- [ ] Module pattern present
- [ ] Singleton pattern present
- [ ] Factory method pattern present
- [ ] MVC folder structure present

Evidence to show:

- `views/pages/index.html`
- `views/pages/register.html`
- `views/pages/match-details.html`
- `config/config.js`
- `models/mongoModel.js`
- `utils/factory.js`
- `models/`
- `views/pages/`
- `controllers/`

## Part II: Authentication, Authorization, Accountability

- [ ] Username/password login works
- [ ] Registration works
- [ ] Roles exist for `admin`, `member`, and `guest`
- [ ] Protected pages and APIs enforce role checks
- [ ] MongoDB log collection stores request and auth events

Evidence to show:

- Login/register flow
- Admin-only pages
- Guest redirect behavior
- MongoDB `logs` collection entries after using the site

Suggested demo accounts:

- `admin / admin123`
- `member / member123`

## Part III: Web APIs

- [ ] Client-side GET request to Node.js server demonstrated
- [ ] Client-side POST request to Node.js server demonstrated
- [ ] Server-side RESTful API call to external provider demonstrated

Evidence to show:

- Registration form POST
- Match creation POST
- Match list/details GET
- External cricket API data through the server

## Part IV: MongoDB Backend Database

- [ ] Local MongoDB connection works
- [ ] Remote MongoDB connection option exists
- [ ] CRUD utility functions exist
- [ ] App actually uses CRUD through the model layer

Evidence to show:

- `models/mongoModel.js`
- `utils/mongoUtil.js`
- `models/userModel.js`
- `models/matchModel.js`
- `models/logModel.js`

## Part V: Git Version Control

- [ ] Remote repo exists and is accessible
- [ ] Commit history is clean enough to explain
- [ ] Each group member has their own commits if this is a group submission
- [ ] Final zip matches the repo state you are submitting

Useful checks:

- `git remote -v`
- `git log --oneline --decorate --graph --all`
- `git log --format='%an <%ae>' | sort | uniq -c`

## Demo Checklist

- [ ] `npm install`
- [ ] MongoDB is running, or `MONGODB_URI` points to a working database
- [ ] `.env` contains `SESSION_SECRET`
- [ ] `.env` contains `CRICKET_API_KEY` if you are demoing external match data
- [ ] Optional: `node seed.js`
- [ ] `npm start`
- [ ] Demo login, role access, logs, match creation, and match detail pages

## Submission Pack

- [ ] Zip the full project directory
- [ ] Include `README.md`
- [ ] Include this checklist
- [ ] Do not accidentally include secrets you do not want to share
- [ ] If the grader needs external API data, provide working demo instructions

## Short Demo Script

1. Start the app and open the home page.
2. Show Bootstrap UI patterns: navbar, carousel, cards, responsive layout, modals.
3. Register a user or log in with a seeded account.
4. Show role differences for guest, member, and admin.
5. Create a match and open its details page.
6. Show admin pages for users and logs.
7. Open MongoDB and show the `users`, `matches`, and `logs` collections.
8. Show the git remote and commit history.