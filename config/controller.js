const User = require("../database/usersModel");
const { user, useremail } = require('./index');

exports.injectMovie = async (req, res, next) => {
    const { userName, email, moviesList } = req.body;
    userName = user;
    email = useremail;
    console.log('name: ', userName);
    console.log('email: ', useremail);
    console.log(`HERE>> ${moviesList[0]}`);
    try {
        // Checking if a user exists with either the same userName or email
        const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
        
        if (existingUser) {
            // Check if both userName and email match the existing user
            if (existingUser.userName === userName && existingUser.email === email) {
                // Update the existing user's movies list
                existingUser.moviesList.push(moviesList[0]);
                await existingUser.save();
                console.log(`Updated ${userName} with ${moviesList[0].title}`);
                return res.status(200).json({
                    success: true,
                    message: "Movie added to existing user",
                    user: existingUser
                });
            } else {
                // If either userName or email does not match the existing record
                console.log(`Mismatch found - userName: ${userName}, email: ${email}`);
                return res.status(400).json({
                    success: false,
                    message: "Username and email do not match existing records"
                });
            }
        }

        // If no existing user, create a new one
        // const newUser = await User.create({
        //     userName,
        //     email,
        //     moviesList
        // });
        console.log(`Created Profile for ${userName}`);
        return res.status(201).json({
            success: true,
            message: "New user created with movie",
            user: newUser
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



exports.uninjectMovie = async (req, res) => {
    const { userName, email, movieToRemove } = req.body;

    try {
        // Find the user based on email or username
        const query = email ? { email } : { userName };
        const user = await User.findOne(query);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if the movie exists in the user's moviesList
        const index = user.moviesList.indexOf(movieToRemove);
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: "Movie not found in user's list"
            });
        }

        // Remove the movie from the list
        user.moviesList.splice(index, 1);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Movie removed successfully",
            user
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



exports.manageMovie = async (req, res) => {
    const { userName, email, moviesList, action } = req.body;

    // Ensure action is correctly specified
    if (!['add', 'remove'].includes(action)) {
        return res.status(400).json({
            success: false,
            message: "Invalid action specified"
        });
    }

    try {
        const query = { $or: [{ userName }, { email }] };
        const user = await User.findOne(query);

        if (!user) {
            // Handle adding a movie when no user is found (if specified)
            if (action === "add") {
                const newUserDetails = { userName, email, moviesList };
                const newUser = await User.create(newUserDetails);
                return res.status(201).json({
                    success: true,
                    message: "New user created with movie",
                    user: newUser
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }
        }

        // Handle addition of a movie
        if (action === "add") {
            user.moviesList.push(moviesList[0]); // Assume moviesList contains objects and we add the first one
            await user.save();
            return res.status(200).json({
                success: true,
                message: "Movie added successfully",
                user
            });
        }

        // Handle removal of a movie
        if (action === "remove") {
            const index = user.moviesList.findIndex(movie => movie.title === moviesList[0].title);
            if (index === -1) {
                return res.status(404).json({
                    success: false,
                    message: "Movie not found in user's list"
                });
            }
            user.moviesList.splice(index, 1);
            await user.save();
            return res.status(200).json({
                success: true,
                message: "Movie removed successfully",
                user
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
