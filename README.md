# Developer Kaki Forum

A Reddit-like forum platform built specifically for the Developer Kaki community. This is a full-stack application featuring user authentication, posts, comments, voting, categories, user dashboards, and admin controls.

## Features

### User Features
- 🔐 **Authentication**: Secure user registration and login with JWT
- 📝 **Posts**: Create, edit, and delete posts with Markdown support
- 💬 **Comments**: Nested comment system with unlimited depth
- ⬆️ **Voting**: Upvote/downvote posts and comments
- 🏷️ **Categories**: Organize posts by categories (JavaScript, Python, Web Dev, DevOps, Career, General)
- 🔍 **Search**: Search posts by title and content
- 📊 **Sorting**: Sort posts by Hot, New, or Top
- 👤 **User Profiles**: View user profiles with post and comment history
- 📈 **User Dashboard**: Manage your profile, view your posts and comments

### Admin Features
- 🛡️ **Admin Dashboard**: Comprehensive overview of forum statistics
- 👥 **User Management**: Manage user roles (User, Moderator, Admin)
- 🔒 **Content Moderation**: Pin and lock posts
- 📊 **Analytics**: View real-time statistics and recent activity
- 🗑️ **Content Control**: Delete inappropriate posts and comments

## Tech Stack

### Backend
- **Node.js** with **Express.js** - REST API server
- **SQLite** - Lightweight, file-based database
- **JWT** - Secure authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Markdown** - Markdown rendering
- **Lucide React** - Modern icon library
- **date-fns** - Date formatting

## Project Structure

```
devkaki-forum/
├── backend/
│   ├── routes/          # API route handlers
│   │   ├── auth.js      # Authentication endpoints
│   │   ├── posts.js     # Post CRUD operations
│   │   ├── comments.js  # Comment operations
│   │   ├── votes.js     # Voting system
│   │   ├── categories.js # Category management
│   │   ├── users.js     # User profiles
│   │   └── admin.js     # Admin operations
│   ├── middleware/      # Express middleware
│   │   └── auth.js      # Authentication middleware
│   ├── database.js      # SQLite database setup
│   ├── server.js        # Express app entry point
│   └── package.json     # Backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   │   ├── Navbar.jsx
│   │   │   ├── PostCard.jsx
│   │   │   └── Comment.jsx
│   │   ├── pages/       # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── PostDetail.jsx
│   │   │   ├── CreatePost.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── UserDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── context/     # React context
│   │   │   └── AuthContext.jsx
│   │   ├── utils/       # Utility functions
│   │   │   └── api.js   # API client
│   │   ├── App.jsx      # Main app component
│   │   ├── main.jsx     # React entry point
│   │   └── index.css    # Global styles
│   └── package.json     # Frontend dependencies
│
└── package.json         # Root package.json for running both servers
```

## Installation & Setup

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Step 1: Clone the repository
```bash
git clone <repository-url>
cd devkaki-forum
```

### Step 2: Install dependencies
```bash
# Install all dependencies (root, backend, and frontend)
npm run install-all
```

### Step 3: Configure environment variables
```bash
# Create backend .env file
cd backend
cp .env.example .env
```

Edit `backend/.env` and update the values:
```env
PORT=5000
JWT_SECRET=your-very-secure-secret-key-here
NODE_ENV=development
DATABASE_PATH=./database.sqlite
```

### Step 4: Start the development servers

#### Option 1: Run both servers concurrently (recommended)
```bash
# From the root directory
npm run dev
```

This will start:
- Backend API server on `http://localhost:5000`
- Frontend dev server on `http://localhost:3000`

#### Option 2: Run servers separately
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 5: Access the application
Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## Default Admin Account

The application comes with a default admin account:
- **Username**: `admin`
- **Email**: `admin@developerkaki.com`
- **Password**: `admin123`

**Important**: Change the admin password after first login in production!

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Posts
- `GET /api/posts` - Get all posts (with pagination, filtering, sorting)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post (auth required)
- `PUT /api/posts/:id` - Update post (auth required)
- `DELETE /api/posts/:id` - Delete post (auth required)
- `PATCH /api/posts/:id/pin` - Pin/unpin post (admin only)
- `PATCH /api/posts/:id/lock` - Lock/unlock post (admin only)

### Comments
- `GET /api/comments/post/:postId` - Get comments for a post
- `POST /api/comments` - Create comment (auth required)
- `PUT /api/comments/:id` - Update comment (auth required)
- `DELETE /api/comments/:id` - Delete comment (auth required)

### Votes
- `POST /api/votes/post/:id` - Vote on post (auth required)
- `POST /api/votes/comment/:id` - Vote on comment (auth required)
- `GET /api/votes/user/post/:postId` - Get user's votes (auth required)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:slug` - Get single category
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

### Users
- `GET /api/users/:username` - Get user profile
- `GET /api/users/:username/posts` - Get user's posts
- `GET /api/users/:username/comments` - Get user's comments
- `PUT /api/users/profile` - Update profile (auth required)

### Admin
- `GET /api/admin/stats` - Get dashboard statistics (admin only)
- `GET /api/admin/users` - Get all users (admin only)
- `PATCH /api/admin/users/:id/role` - Update user role (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)
- `GET /api/admin/posts` - Get all posts for moderation (admin only)
- `GET /api/admin/comments` - Get all comments for moderation (admin only)

## Database Schema

The application uses SQLite with the following tables:

- **users** - User accounts and profiles
- **categories** - Post categories
- **posts** - Forum posts
- **comments** - Post comments (with parent_id for nesting)
- **post_votes** - Upvotes/downvotes on posts
- **comment_votes** - Upvotes/downvotes on comments

## Development

### Backend Development
```bash
cd backend
npm run dev  # Runs with nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm run dev  # Runs Vite dev server with hot reload
```

### Build for Production
```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm start
```

## Features in Detail

### Voting System
- Users can upvote or downvote posts and comments
- Vote counts are displayed prominently
- Users can change or remove their votes
- Karma system tracks user contributions

### Comment System
- Nested comments with unlimited depth
- Reply to any comment
- Edit and delete your own comments
- Visual threading with indentation

### User Dashboard
- View and edit profile information
- See all your posts and comments
- Track your karma score
- View account statistics

### Admin Dashboard
- Real-time statistics overview
- User management with role assignment
- Content moderation tools
- Recent activity monitoring

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Protected routes and API endpoints
- Input validation and sanitization
- XSS protection
- SQL injection prevention

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own community!

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the Developer Kaki team.

---

Built with ❤️ for the Developer Kaki Community
