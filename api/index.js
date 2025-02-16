const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');  // Import cookie-session
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./database/usersModel');
const fetchWatchLink = require('./streamingAvailability');
const connectDB = require('./config/db');
const { getUserWatchlist, recommenderBot, updateUserRecommendations } = require('./recommendations'); 
require('dotenv').config();

connectDB();

// Test streaming API functionality
const testStreamingAPI = async () => {
    try {
        console.log('🎬 Testing Streaming API...');
        const testMovie = 'Inception';
        console.log(`📽️ Fetching streaming info for: ${testMovie}`);
        
        const result = await fetchWatchLink(testMovie);
        console.log('✅ Streaming API Response:', {
            movieName: result.name,
            showType: result.showType,
            streamingLink: result.link
        });
    } catch (error) {
        console.error('❌ Streaming API Error:', error);
    }
};

// Run the test
testStreamingAPI();

const app = express();

app.use(cors({
    origin: ['http://localhost:3000', 'https://bingeflixstreaming.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
}));

app.use(express.json());

// Configure session to use cookie session
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],  // Replace these keys with your own secret keys
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true in production
    sameSite: 'lax'
}));

// Add this after cookie-session middleware
app.use((req, res, next) => {
    if (req.session && !req.session.regenerate) {
        req.session.regenerate = (cb) => {
            cb();
        };
    }
    if (req.session && !req.session.save) {
        req.session.save = (cb) => {
            cb();
        };
    }
    next();
});

app.use(passport.initialize());
app.use(passport.session());

let userExport;
let emailExport;
let useridexport;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://bingeflix-backend.onrender.com/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = new User({
                googleId: profile.id.toString(), // Ensure ID is stored as a string
                userName: profile.displayName,
                email: profile.emails[0].value
            });
            await user.save();
        }
        useridexport = profile.id
        userExport = profile.displayName;
        emailExport = profile.emails[0].value;
        return done(null, user); // Pass the user object
    } catch (error) {
        console.error('Error during user registration or retrieval:', error);
        return done(error);
    }
}));

// Serialize user into the sessions
passport.serializeUser((user, done) => {
    done(null, user.id.toString()); // Serialize the user ID as a string
});

// Deserialize user from the sessions
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id); // Use async/await
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// TODO get movies route
app.get('/getUserMovies', async (req, res) => {
    console.log('Endpoint Called: /getUserMovies');
    //const { userName, email } = req.query;
    //console.log('Query Params:', req.query);

    //const userid =  useridexport;
    const userName = userExport;  // From earlier session or authentication
    const email = emailExport;

    if (!userName || !email) {
        console.log('Validation Failed: Username or email missing');
        return res.status(400).json({ success: false, message: "Username and email must be provided" });
    }

    try {
        console.log('Attempting to find user:', userName);
        const user = await User.findOne({ userName, email });
        if (!user) {
            console.log('No user found for:', userName);
            return res.status(404).json({ success: false, message: "User not found" });
        }

        console.log(`Found movies for ${userName}:`);
        // user.moviesList.forEach(movie => {
        //     //console.log(`Movie Title: ${movie.title}, Movie URL: ${movie.link}`);
        // });

        res.status(200).json({
            success: true,
            message: "Movies retrieved successfully",
            movies: user.moviesList
        });

    } catch (error) {
        console.error("Error during fetching movies:", error);
        res.status(500).json({
            success: false,
            message: error.message || "An error occurred"
        });
    }
});

// get user reccomendations:
app.get('/getUserRecs', async (req, res, next) => {
    const userName = userExport;
    const email = emailExport;
    const shouldUpdate = req.query.update === 'true'; // Check if the update flag is set
    console.log("Get user recs called");
    if (!userName || !email) {
        console.log('Validation Failed: Username or email missing');
        return res.status(400).json({ success: false, message: "Username and email must be provided" });
    }

    try {
        const user = await User.findOne({ userName, email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Recs updated
        if (shouldUpdate) {
            await updateUserRecommendations(userName, email, shouldUpdate);
        

            const updatedUser = await User.findOne({ userName, email });

            res.status(200).json({
                success: true,
                message: "Movie Recommendations retrieved successfully",
                recs: updatedUser.recommendations
            });
            console.log("Updated User.recommendations!: \n" + updatedUser.recommendations);
        }
        else{
            res.status(200).json({
                success: true,
                message: "Movie Recommendations retrieved successfully",
                recs: user.recommendations
            });
            console.log("getUserRecs sent successful response: no update")
        }

    } catch (error) {
        console.error("Error during fetching movie recommendations:", error);
        res.status(500).json({
            success: false,
            message: error.message || "An error occurred"
        });
    }
});

// Sports
app.get('/getUserSports', async (req, res) => {
    console.log("ENTERED GET USER SPORTS INSIDE OF THE BACKEND");
    const userName = userExport;
    const email = emailExport;

    if (!userName || !email) {
        return res.status(400).json({ success: false, message: "Username and email must be provided" });
    }

    try {
        const user = await User.findOne({ userName, email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "Sports retrieved successfully",
            sportsList: user.sportsList
        });
        console.log("Compelted get USER SPORTS IN BACKEND!");
    } catch (error) {
        console.error("Error during fetching sports:", error);
        res.status(500).json({
            success: false,
            message: error.message || "An error occurred"
        });
    }
});

const ObjectId = require('mongoose').Types.ObjectId;


app.post('/addSport', async (req, res) => {
    const { sport } = req.body;

    console.log("ADD SPORT:", sport.sportName);
    console.log("ADD SPORT:", sport.logo);
    console.log("ADD SPORT:", sport.link);
    // console.log("ADD SPORT INSIDE: ", req.body);

    // Assuming userExportList and emailExport are set during authentication and represent the current user
    const userid = useridexport;
    const userName = userExport; // From earlier session or authentication
    const email = emailExport; // From earlier session or authentication

    console.log("Entered Add Sport in Backend");
    try {
        const existingUser = await User.findOne({ $and: [{ userName }, { email }] }); // Ensure both userName and email match

        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Initialize sportsList if it doesn't exist
        if (!existingUser.sportsList) {
            existingUser.sportsList = [];
        }

        console.log("ADD: ", existingUser.sportsList);

        // const updatedSportsList = await Promise.all(existingUser.sportsList.map(async sport => {
        //     return {
        //         id: new ObjectId(), // Generate new ObjectId
        //         teamName: sport.sportName, // Trim the sport title
        //         logo: sport.logo,
        //         link: sport.link
        //     };
        // }));

        // Create a new sport object to add to the sports list
        const newSport = {
            id: new ObjectId(), // Generate new ObjectId
            teamName: sport.sportName, // Trim the sport title
            logo: sport.logo,
            link: sport.link
        };

        // Add the new sport to the existing sports list
        existingUser.sportsList.push(newSport);

        console.log("AFTER: ", existingUser.sportsList);

        // existingUser.sportsList.push(...updatedSportsList);
        await existingUser.save();

        console.log("Updated Sports List on DB");
        return res.status(200).json({
            success: true,
            message: "Sports added to user",
        });

    } catch (error) {
        console.error("Error during operation:", error);
        res.status(500).json({
            success: false,
            message: error.message || "An error occurred"
        });
    }
});




app.post('/getLink', async (req, res) => {
    console.log("\n=== GET LINK ENDPOINT ===");
    console.log("Received search request for:", req.body.searchText);
    
    if (!req.body.searchText) {
        console.log("Error: No search text provided");
        return res.status(400).json({ message: 'Search text is required' });
    }

    try {
        console.log("Calling fetchWatchLink for:", req.body.searchText);
        const result = await fetchWatchLink(req.body.searchText);
        console.log("Raw fetchWatchLink result:", result);
        
        // Format the response
        const formattedResult = {
            name: result.name || req.body.searchText,
            link: result.link || '',
            showType: result.showType || 'movie'
        };
        
        console.log("Sending formatted result:", formattedResult);
        console.log("=== END GET LINK ENDPOINT ===\n");
        res.status(200).json(formattedResult);
    } catch (error) {
        console.error('Error in getLink endpoint:', error);
        res.status(500).json({ 
            message: 'Error processing your request',
            error: error.message 
        });
    }
});



app.post('/injectTest', async (req, res) => {
    console.log("I called this endpoint");
    const { moviesList, linkie } = req.body;

    // Log the request body
    console.log('Request body:', req.body);

    // Validate input
    if (!moviesList || !Array.isArray(moviesList) || !linkie) {
        return res.status(400).json({
            success: false,
            message: "Invalid request format. Requires moviesList array and linkie string"
        });
    }

    // Get user info from session
    const userName = req.user?.userName || userExport;
    const email = req.user?.email || emailExport;

    if (!userName || !email) {
        return res.status(401).json({
            success: false,
            message: "User not authenticated"
        });
    }

    try {
        const existingUser = await User.findOne({ userName, email });
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Create new movie entry
        const newMovie = {
            _id: new ObjectId(),
            title: moviesList[0],
            link: linkie
        };

        existingUser.moviesList.push(newMovie);
        await existingUser.save();
        
        // Update recommendations after adding movie
        await updateUserRecommendations(userName, email, true);
        
        return res.status(200).json({
            success: true,
            message: "Movie added successfully and recommendations updated",
            movie: newMovie
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/removeSport', async (req, res) => {
    console.log("Remove Sport endpoint called");
    const { sportTitle } = req.body;  // Extract the movie title to be removed

    console.log("INSDIE : REMOVESPORT: ", sportTitle);

    // Assuming userExport and emailExport are set during authentication
    const userid = useridexport;  // This should be set from a secure session or token
    const userName = userExport;  // From earlier session or authentication
    const email = emailExport;    // From earlier session or authentication

    try {
        const existingUser = await User.findOne({ $and: [{ userName }, { email }] });

        if (!existingUser) {
            console.log('User not found');
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Remove the sport from the user's sport list
        const filteredSportsList = existingUser.sportsList.filter(sport => sport.teamName !== sportTitle);

        // if (existingUser.sportsList.length === filteredSportsList.length) {
        //     console.log('No sports found to remove');
        //     return res.status(404).json({ success: false, message: "Sport not found" });
        // }

        existingUser.sportsList = filteredSportsList;
        await existingUser.save();
        console.log(`Removed sport '${sportTitle}' from ${userName}'s list`);

        return res.status(200).json({
            success: true,
            message: "Sport removed successfully",
            user: existingUser
        });

    } catch (error) {
        console.error("Error during operation:", error);
        res.status(500).json({
            success: false,
            message: error.message || "An error occurred"
        });
    }
});


app.post('/removeMovie', async (req, res) => {
    console.log("\n=== REMOVE MOVIE ENDPOINT ===");
    console.log("Remove movie endpoint called");
    const { movieTitle } = req.body;

    console.log("Attempting to remove movie:", movieTitle);
    const userName = req.user?.userName || userExport;
    const email = req.user?.email || emailExport;

    console.log("User info:", { userName, email });

    try {
        const existingUser = await User.findOne({ userName, email });
        if (!existingUser) {
            console.log("User not found");
            return res.status(404).json({ success: false, message: "User not found" });
        }

        console.log("Current movies list:", existingUser.moviesList);
        const filteredMoviesList = existingUser.moviesList.filter(movie => movie.title !== movieTitle);
        console.log("Filtered movies list:", filteredMoviesList);

        existingUser.moviesList = filteredMoviesList;
        await existingUser.save();

        // Update recommendations after removing movie
        console.log("Updating recommendations...");
        await updateUserRecommendations(userName, email, true);
        console.log("Recommendations updated");

        console.log("=== END REMOVE MOVIE ENDPOINT ===\n");
        return res.status(200).json({
            success: true,
            message: "Movie removed successfully and recommendations updated",
            user: existingUser
        });
    } catch (error) {
        console.error("Error in removeMovie:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// Define routes
app.get('/', (req, res) => res.send('API Running'));

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/auth/google' }),
    (req, res) => {
        // Successful authentication, redirect home.
        // res.redirect('/'); // change this to the homepage later
        res.redirect(`${process.env.FRONTEND_URL}/home`);
    });

app.get('/api/logout', (req, res) => {
    req.logout();
    res.clearCookie('session');
    res.redirect('/');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

const PORT = process.env.PORT || 3000;  // Render will provide the PORT env var
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});


module.exports = { userExport, emailExport };
module.exports = app;

