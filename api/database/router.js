const express = require('express');
const router = express.Router();

// Importing all necessary functions from your controller
const { injectMovie, uninjectMovie, manageMovie } = require('../config/controller');

// Route for injecting a movie
router.post('/injectMovie', injectMovie);

// Route for removing a movie
router.post('/uninjectMovie', uninjectMovie);

// Route for managing a movie (adding or removing)
router.post('/manageMovie', manageMovie);



app.post('/api/manageMovie', ensureAuthenticated, async (req, res) => {
    // Assuming req.user contains the user data from the session
    const { userName, moviesList } = req.body;
    const email = req.user.email; // Email from Google OAuth
  
    // Proceed with your function logic using the email from OAuth
  });
  


// Default route to check if the service is running
router.get('/', (req, res) => {
    res.send('Database Online');
});

module.exports = router;
