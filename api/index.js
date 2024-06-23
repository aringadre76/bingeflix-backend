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


const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json());

// Configure session to use cookie session
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],  // Replace these keys with your own secret keys
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    httpOnly: true,
    secure: false,  // Set to true if using HTTPS
    sameSite: 'strict'
}));

app.use(passport.initialize());
app.use(passport.session());

let userExport;
let emailExport;
let useridexport;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.REACT_APP_BACKEND_URL}/auth/google/callback`
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
    console.log("title API route got: "+ req.body['searchText']); // Log the search text received from the front end
    try {
        // Await the promise to resolve
        const { link, name, showType } = await fetchWatchLink(req.body['searchText']);
        res.status(200).json({ link, name, showType });
    } catch (error) {
        console.error('Error fetching link:', error);
        res.status(500).json({ message: 'Error processing your request' });
    }
});



app.post('/injectTest', async (req, res) => {
    console.log("I called this endpoint");
    const { moviesList, linkie } = req.body; // Only get moviesList from the request

    // Assuming userExport and emailExport are set during authentication and represent the current user
    const userid =  useridexport;
    const userName = userExport;  // From earlier session or authentication
    const email = emailExport;    // From earlier session or authentication

    console.log('Google ID:', userid);
    console.log ('Username:', userName);
    console.log ('Email:', email);
    console.log(`Movie ${moviesList[0]}`);
    console.log('url:', linkie);

    console.log('going to do if statement')
    // if (!Array.isArray(moviesList) || !moviesList.every(movie => movie.title)) {
    //     return res.status(400).json({ success: false, message: "Each movie must include a title and must be an array" });
    //     console.log('debug');
    // }
    console.log('going to update movie list ...');

    try {
        const existingUser = await User.findOne({ $and: [{ userName }, { email }] }); // Ensure both userName and email match

        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        console.log('going to update movie list in try')
        // Fetch links and update movies list
        const updatedMoviesList = await Promise.all(moviesList.map(async movie => {
            //const link = await fetchWatchLink(movie.title);  // Fetch the streaming link for each movie
            return {
                _id: new ObjectId(),  // Generate new ObjectId
                title: moviesList[0],   // Movie title
                link: linkie            // Streaming link
            };
        }));

        // Add the updated movie list to the existing user's movie list
        existingUser.moviesList.push(...updatedMoviesList);
        await existingUser.save();
        console.log(`Updated ${userName} with movies`);
        return res.status(200).json({
            success: true,
            message: "Movies added to existing user",
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
    console.log("Remove movie endpoint called");
    const { movieTitle } = req.body;  // Extract the movie title to be removed

    // Assuming userExport and emailExport are set during authentication
    const userid = useridexport;  // This should be set from a secure session or token
    const userName = userExport;  // From earlier session or authentication
    const email = emailExport;    // From earlier session or authentication

    console.log('Google ID:', userid);
    console.log('Username:', userName);
    console.log('Email:', email);
    console.log('Movie to remove:', movieTitle);

    try {
        const existingUser = await User.findOne({ $and: [{ userName }, { email }] });

        if (!existingUser) {
            console.log('User not found');
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Remove the movie from the user's movie list
        const filteredMoviesList = existingUser.moviesList.filter(movie => movie.title !== movieTitle);

        if (existingUser.moviesList.length === filteredMoviesList.length) {
            console.log('No movie found to remove');
            return res.status(404).json({ success: false, message: "Movie not found" });
        }

        existingUser.moviesList = filteredMoviesList;
        await existingUser.save();
        console.log(`Removed movie '${movieTitle}' from ${userName}'s list`);

        return res.status(200).json({
            success: true,
            message: "Movie removed successfully",
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

// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => console.log(`Server started on port ${PORT}`));


module.exports = { userExport, emailExport };
module.exports = app;

