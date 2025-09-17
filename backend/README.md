# Crewvar Backend

A Node.js + MySQL backend API for Crewvar - the social networking platform for cruise crew members.

## Features

- **Authentication & Authorization**: JWT-based auth with email verification
- **User Management**: Profile management, onboarding flow
- **Ship & Crew Discovery**: Browse ships, departments, and crew members
- **Connections**: Request, accept, decline, and block connections
- **Real-time Chat**: Socket.IO powered messaging
- **Favorites & Alerts**: Mark favorite crew members
- **Moderation Tools**: Admin panel for community management
- **Privacy Controls**: Comprehensive privacy settings
- **File Upload**: Profile photos and documents

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.IO
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Rate Limiting
- **Language**: TypeScript

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn

## Installation

1. **Clone and navigate to backend directory**:
   ```bash
   cd D:\chat\backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=crewvar
   DB_USER=root
   DB_PASSWORD=your_password
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   ```

4. **Set up MySQL database**:
   - Create a MySQL database named `crewvar`
   - Update database credentials in `.env` file

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify/:token` - Verify email
- `POST /api/auth/resend-verification` - Resend verification email

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Ships
- `GET /api/ships` - Get all ships

### Connections
- `GET /api/connections` - Get user connections

### Chat
- `GET /api/chat/messages/:userId` - Get chat messages

### Moderation
- `GET /api/moderation/reports` - Get reports (Admin only)

## Database Schema

The application automatically creates the following tables:
- `users` - User accounts and profiles
- `ships` - Cruise ships
- `ports` - Port locations
- `user_assignments` - Current ship assignments
- `connection_requests` - Connection requests
- `connections` - Accepted connections
- `chat_messages` - Chat messages
- `favorites` - User favorites
- `reports` - User reports
- `user_photos` - User photos
- `notifications` - User notifications

## Socket.IO Events

### Client to Server
- `join-room` - Join user's room
- `send-message` - Send chat message

### Server to Client
- `new-message` - Receive new message

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevent abuse
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for password security
- **Input Validation**: express-validator for request validation

## Development

### Project Structure
```
src/
├── config/          # Database and app configuration
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── index.ts        # Main application file
```

### Adding New Features

1. Create controller in `src/controllers/`
2. Create routes in `src/routes/`
3. Add database models if needed
4. Update main app in `src/index.ts`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `3306` |
| `DB_NAME` | Database name | `crewvar` |
| `DB_USER` | Database user | `root` |
| `DB_PASSWORD` | Database password | `` |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username | Required |
| `EMAIL_PASS` | SMTP password | Required |
| `FRONTEND_URL` | Frontend URL | `http://localhost:5173` |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC License
