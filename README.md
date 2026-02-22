# 📘 Facebook Clone — Django REST + React

A full-stack social media application inspired by Facebook.  
Built with **Django REST Framework** on the backend and **React + Vite** on the frontend.

---

## ✨ Features

- 🔐 JWT Authentication (register, login, auto token refresh)
- 📝 Create, view, and delete posts (with optional image upload)
- ❤️ Like / unlike posts (toggle)
- 💬 Comment on posts, delete your own comments
- 👤 User profiles with bio, avatar, friends count
- 📨 Real-time-ish messaging between users (polling every 3s)
- 🔍 User search from the navbar

---

## 🗂️ Project Structure

```
facebook_app/
│
├── backend/                        ← Django project
│   ├── social/                     ← Main Django app
│   │   ├── models.py               ← Database models (User, Post, Like, Comment, Message)
│   │   ├── serializers.py          ← DRF serializers (data → JSON and back)
│   │   ├── views.py                ← API logic (ViewSets + Auth views)
│   │   └── urls.py                 ← App-level URL routing via DRF Router
│   │
│   └── config/
│       ├── urls.py                 ← Root URL conf, wires /api/ and media files
│       └── settings.py             ← Django settings (JWT, CORS, DRF, installed apps)
│
└── frontend/                       ← React + Vite project
    ├── index.html                  ← HTML shell, mounts <div id="root">
    ├── package.json                ← npm dependencies (react, react-router-dom)
    ├── vite.config.js              ← Vite config, dev proxy to :8000
    │
    └── src/
        ├── main.jsx                ← Entry point, renders <App> inside BrowserRouter
        ├── App.jsx                 ← AuthContext, protected routes, top-level layout
        │
        ├── services/
        │   └── api.js              ← All fetch() calls to Django API, token refresh logic
        │
        ├── styles/
        │   └── global_style.css    ← Full app styling (navbar, cards, chat, auth pages)
        │
        ├── components/
        │   ├── Navbar.jsx          ← Fixed top navbar with search, navigation, logout
        │   ├── Avatar.jsx          ← Smart avatar: shows image or initials fallback
        │   ├── PostCard.jsx        ← Single post: like, comment, delete, time-ago
        │   └── CreatePost.jsx      ← Post composer with text + image upload
        │
        └── pages/
            ├── LoginPage.jsx       ← Login form, calls /api/auth/login/
            ├── RegisterPage.jsx    ← Register form, calls /api/auth/register/
            ├── FeedPage.jsx        ← Home feed: lists all posts + CreatePost on top
            ├── ProfilePage.jsx     ← User profile: avatar, bio, their posts, message btn
            └── MessagesPage.jsx    ← Two-pane chat UI: conversations list + chat window
```

---

## 🐍 Backend — Django REST Framework

### `social/models.py`
Defines all database tables:
- **User** — extends Django's `AbstractUser`, adds `bio`, `avatar`, and `friends` (M2M)
- **Post** — belongs to a User, has `content` and optional `image`
- **Like** — join table between User and Post, unique per pair (no double-likes)
- **Comment** — belongs to a User and a Post, ordered by creation time
- **Message** — sender → receiver with `content` and `is_read` flag

### `social/serializers.py`
Converts model instances to/from JSON for the API:
- **UserSerializer** — full user data including `friends_count`, password write-only
- **UserMiniSerializer** — lightweight user (id, username, avatar) used inside posts/comments
- **PostSerializer** — includes nested author, comments, `is_liked` computed per request
- **CommentSerializer** — includes nested author info
- **MessageSerializer** — includes sender/receiver objects, `receiver_id` for writes
- **RegisterSerializer** — validates matching passwords, creates user securely

### `social/views.py`
All API business logic:
- **RegisterView** — creates user, returns JWT tokens immediately
- **LoginView** — authenticates credentials, returns JWT tokens + user data
- **UserViewSet** — CRUD for users; custom actions: `me` (get/update own profile), `search`
- **PostViewSet** — CRUD for posts; custom actions: `like` (toggle), `comment`, `feed`
- **CommentViewSet** — create and delete comments (author or post-owner can delete)
- **MessageViewSet** — send messages, fetch thread with a specific user, list conversations

### `social/urls.py`
Registers all ViewSets with DRF's `DefaultRouter` (auto-generates list/detail URLs).  
Also adds manual routes for `/auth/register/` and `/auth/login/`.

### `config/urls.py`
Root URL configuration:
- Mounts the social app under `/api/`
- Adds `/api/auth/token/refresh/` for JWT refresh
- Serves uploaded media files in development (`MEDIA_URL`)

### `config/settings.py`
Key configuration blocks:
- `AUTH_USER_MODEL` — points Django to the custom User model
- `REST_FRAMEWORK` — sets JWT as default auth, pagination to 20 items/page
- `SIMPLE_JWT` — access token lives 1 hour, refresh token lives 7 days
- `CORS_ALLOWED_ORIGINS` — allows the React dev server at `localhost:5173`
- `MEDIA_ROOT` — where uploaded images (avatars, post photos) are stored on disk

---

## ⚛️ Frontend — React + Vite

### `index.html`
Bare HTML file. Vite injects the bundled JS here. Contains only `<div id="root">`.

### `vite.config.js`
Configures the Vite dev server on port 5173 and proxies all `/api/*` requests to Django at port 8000 — avoids CORS issues during development.

### `src/main.jsx`
Application entry point. Wraps `<App>` in `<BrowserRouter>` for client-side routing and imports the global CSS.

### `src/App.jsx`
The heart of the frontend:
- Creates and provides **AuthContext** (user state, login/logout functions)
- Checks `localStorage` on mount to restore session via `/users/me/`
- Defines all **routes** using React Router v6
- Implements `<PrivateRoute>` — redirects unauthenticated users to `/login`

### `src/services/api.js`
Single source of truth for all backend communication:
- A central `request()` helper attaches the `Authorization: Bearer <token>` header automatically
- On 401 responses, it attempts a **silent token refresh** before retrying — users stay logged in
- Exports named functions for every operation: `login`, `register`, `getFeed`, `createPost`, `likePost`, `addComment`, `sendMessage`, `getConversations`, `searchUsers`, etc.

### `src/styles/global_style.css`
All styling in one file — no CSS framework needed:
- CSS custom properties (`--blue`, `--gray-bg`, etc.) for easy theming
- Styles for: navbar, auth pages, post cards, comment threads, create-post composer, profile page, two-pane chat layout, avatars, buttons, search dropdown
- Responsive breakpoints for mobile (collapses conversation sidebar)

### `src/components/Navbar.jsx`
Fixed top bar always visible when logged in:
- **Logo** links to the feed
- **Search input** debounces user input and shows a dropdown of matching users
- **Icon buttons** navigate to Feed (🏠) and Messages (💬), highlighting the active route
- **Avatar** links to own profile; **Logout** button clears tokens and resets state

### `src/components/Avatar.jsx`
Reusable avatar display:
- Shows the user's uploaded photo if available (handles relative vs. absolute URLs)
- Falls back to a colored circle with the user's **initial** if no photo is set
- Accepts an optional `size` prop for flexible use across the app

### `src/components/PostCard.jsx`
Renders a single post in the feed or profile:
- **Header** — avatar, name (links to profile), timestamp in human-readable "X ago" format
- **Like button** — optimistically toggles liked state and updates count without a page reload
- **Comment toggle** — shows/hides the comments section and inline comment form
- **Delete button** — visible only to the post author, confirms before deleting
- **Comments** — each comment shows author, text, and a delete button (for author or post owner)

### `src/components/CreatePost.jsx`
Collapsible post composer:
- Shows a placeholder button that expands into a full textarea + image picker
- Uploads the post as `multipart/form-data` to support image attachments
- Image preview is shown inline before submitting; can be cleared
- On success, calls `onPostCreated` to prepend the new post to the feed without reload

### `src/pages/LoginPage.jsx`
Simple login screen styled like Facebook's login page:
- Submits to `/api/auth/login/`, receives JWT tokens and user object
- Calls `login()` from AuthContext which saves tokens to `localStorage` and sets user state
- Shows a red error banner on bad credentials

### `src/pages/RegisterPage.jsx`
Registration form with client-side password match validation:
- Two-column first/last name layout
- Submits to `/api/auth/register/`, which also returns tokens — user is **logged in immediately**
- Parses and displays Django field-level validation errors (e.g. "username already taken")

### `src/pages/FeedPage.jsx`
The home page / news feed:
- Fetches all posts from `/api/posts/feed/` on mount
- Renders `<CreatePost>` at the top so users can post directly from the feed
- Handles `onPostCreated` (prepend) and `onDelete` (filter out) to keep the list in sync without re-fetching

### `src/pages/ProfilePage.jsx`
User profile view for any user (self or others):
- Shows a gradient cover photo, large avatar, name, bio, and friends count
- Fetches the target user's posts and displays them using the same `<PostCard>` component
- Shows a **Message** button when viewing another user's profile, linking to their chat thread

### `src/pages/MessagesPage.jsx`
Full two-pane messaging interface:
- **Left pane** — list of all users you've exchanged messages with; search bar to start new conversations
- **Right pane** — chat thread with the selected user; outgoing messages are blue (right-aligned), incoming are gray (left-aligned)
- **Auto-scroll** to the latest message on new content
- **Polling** every 3 seconds to simulate real-time updates (can be upgraded to WebSockets)
- URL-driven: navigating to `/messages/:userId` automatically opens that conversation

---

## 🚀 Quick Start

### Backend
```bash
# Install dependencies
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers Pillow

# Run migrations
python manage.py makemigrations social
python manage.py migrate

# Create a superuser (optional)
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Create account, returns tokens |
| POST | `/api/auth/login/` | Login, returns tokens |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| GET | `/api/users/me/` | Get own profile |
| PATCH | `/api/users/me/` | Update own profile |
| GET | `/api/users/search/?q=` | Search users by name |
| GET | `/api/posts/feed/` | Get all posts (feed) |
| POST | `/api/posts/` | Create a post |
| DELETE | `/api/posts/{id}/` | Delete own post |
| POST | `/api/posts/{id}/like/` | Toggle like on a post |
| POST | `/api/posts/{id}/comment/` | Add a comment |
| DELETE | `/api/comments/{id}/` | Delete a comment |
| GET | `/api/messages/?with={id}` | Get messages with a user |
| POST | `/api/messages/` | Send a message |
| GET | `/api/messages/conversations/` | List all chat partners |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Django 4.x + Django REST Framework |
| Authentication | SimpleJWT (access + refresh tokens) |
| Database | SQLite (dev) → PostgreSQL (prod) |
| File Uploads | Pillow + Django's FileField |
| CORS | django-cors-headers |
| Frontend | React 18 + React Router v6 |
| Build Tool | Vite 5 |
| Styling | Plain CSS with custom properties |
| HTTP Client | Native `fetch()` with token refresh |

---

## 📌 Notes

- **No Redux** — state is managed with React Context + local `useState`
- **No CSS framework** — everything is hand-written in `global_style.css`
- **Messaging** uses polling (every 3s). Upgrade to Django Channels + WebSockets for production.
- For production, swap SQLite → PostgreSQL and serve media files via **nginx** or an object store (S3).