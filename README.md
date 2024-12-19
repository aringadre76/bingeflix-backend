# Bingeflix Backend

The backend for Bingeflix provides the core functionalities to fetch, manage, and store user-specific data, including movie and sports streaming availability, personalized recommendations, and user details. This service is built using Node.js and MongoDB, leveraging Express for routing and Mongoose for database management.

---

## Table of Contents

1. [Features](#features)
2. [Setup](#setup)
3. [Project Structure](#project-structure)
4. [Endpoints](#endpoints)
5. [Contributing](#contributing)

---

## Features

- **User Management**: Handles user data, including authentication via Google OAuth.
- **Streaming Availability**: Fetches availability data for movies and sports across various streaming platforms.
- **Recommendations**: Provides personalized movie recommendations.
- **Database Integration**: Utilizes MongoDB with Mongoose schemas to organize user, movie, and sports data.

---

## Setup

### Prerequisites

Ensure you have the following installed:
- Node.js
- MongoDB

### Installation

1. Clone the repository:  
   ```bash  
   git clone <repository-url>  
   cd bingeflix-backend  
   ```

2. Install dependencies:  
   ```bash  
   npm install  
   ```

3. Configure environment variables:  
   Create a `.env` file in the root directory and add your MongoDB URI and Google OAuth credentials:  
   ```env  
   MONGO_URI=mongodb://localhost:27017/bingeflix  
   GOOGLE_CLIENT_ID=<your-client-id>  
   GOOGLE_CLIENT_SECRET=<your-client-secret>  
   ```

4. Start the server:  
   ```bash  
   node Server.js  
   ```

   The server will run on `http://localhost:3000` by default.

---

## Project Structure

```  
bingeflix-backend/  
├── config/  
│   ├── db.js               # MongoDB connection setup  
│   └── controller.js       # Functions for handling business logic  
├── models/  
│   └── usersModel.js       # Mongoose schemas for users, movies, and sports  
├── routes/  
│   └── router.js           # API routes for backend services  
├── services/  
│   ├── recommendations.js  # Logic for generating movie recommendations  
│   ├── sportsAvailability.js  # Fetches sports streaming availability  
│   └── streamingAvailability.js # Fetches movie streaming availability  
├── Server.js               # Entry point for the backend server  
├── index.js                # Base server setup  
└── package.json            # Project dependencies and scripts  
```

---

## Endpoints

### Base URL
`http://localhost:3000`

### User Routes
- **POST /injectMovie**  
  - Adds a movie to the user's list.  

- **POST /uninjectMovie**  
  - Removes a movie from the user's list.  

- **POST /manageMovie**  
  - Manages movie entries dynamically.  

### Health Check
- **GET /**  
  - Verifies if the service is running.  

---

## Contributing

1. Fork the repository.  
2. Create a feature branch:  
   ```bash  
   git checkout -b feature-name  
   ```  

3. Commit changes:  
   ```bash  
   git commit -m "Description of changes"  
   ```  

4. Push the branch:  
   ```bash  
   git push origin feature-name  
   ```  

5. Submit a pull request.  

---

For any questions or issues, feel free to open an issue in the repository!
