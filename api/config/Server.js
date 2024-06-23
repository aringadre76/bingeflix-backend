const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieSession = require('cookie-session');

const app = express();

// Configure session
app.use(cookieSession({
  maxAge: 24 * 60 * 60 * 1000, // One day in milliseconds
  keys: ['randomstringhere'] // Change this to your own secret value
}));

app.use(passport.initialize()); // Initialize Passport
app.use(passport.session()); // Persistent login sessions

// Configure Passport
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback' // Correct URL format
  },
  (accessToken, refreshToken, profile, done) => {
    // Here, use the profile info (mainly profile id) to check if the user is registered in your db
    // If yes, use that data; if no, create a new user and then return
    return done(null, profile);
  }
));

// Serialize user into the sessions
passport.serializeUser((user, done) => {
  done(null, user.id);
});
// Deserialize user from the sessions
passport.deserializeUser((id, done) => {
  done(null, id);
});

// Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

app.get('/api/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
