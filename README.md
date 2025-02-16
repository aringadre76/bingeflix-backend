# BingeFlix Backend

The backend service for BingeFlix, providing movie recommendations, user management, and streaming availability data.

## Features

- **Authentication**: Google OAuth 2.0 integration
- **Movie Management**: Add/remove movies from user watchlists
- **AI Recommendations**: OpenAI-powered movie suggestions
- **Sports Tracking**: Team management and updates
- **Streaming Links**: Fetch current streaming availability

## Tech Stack

- Node.js & Express
- MongoDB & Mongoose
- OpenAI API
- Google OAuth 2.0
- Render Deployment

## Local Development

1. Clone and install:
```bash
git clone <repository-url>
cd bingeflix-backend
npm install
```

2. Set up environment variables:
```env
MONGODB_URI=your_mongodb_uri
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_api_key
```

3. Start server:
```bash
npm start
```

## API Endpoints

### Authentication
- `GET /auth/google`: Login
- `GET /auth/google/callback`: OAuth callback
- `GET /api/logout`: Logout

### Movies
- `POST /getLink`: Get streaming availability
- `POST /injectTest`: Add to watchlist
- `POST /removeMovie`: Remove from watchlist
- `GET /getUserMovies`: Get watchlist

### Sports
- `GET /getUserSports`: Get user's teams
- `POST /removeSport`: Remove team

## Project Structure

```
bingeflix-backend/
├── api/
│   ├── database/          # MongoDB models
│   ├── config/           # Configuration files
│   ├── recommendations.js # AI recommendation logic
│   └── index.js          # Main server file
└── package.json
```

## Deployment

The backend is deployed on Render and automatically updates when changes are pushed to the main branch.

Visit: [https://bingeflix-backend.onrender.com](https://bingeflix-backend.onrender.com)
