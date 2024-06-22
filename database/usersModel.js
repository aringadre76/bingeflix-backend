const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId, // Optional, since Mongoose automatically generates this
    title: { type: String, required: true },
    link: { type: String, required: true }  // Streaming link
});

const sportSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId, // Optional, since Mongoose automatically generates this
    teamName: { type: String, required: true },
    logo: { type: String, required: true },
    link: { type: String, required: true }
});

const userSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    userName: { type: String, required: true },
    email: { type: String, required: true },
    moviesList: [movieSchema],  // Array of movies, as defined by movieSchema
    recommendations: [movieSchema],
    sportsList: [sportSchema]
});

const User = mongoose.model('User', userSchema);
module.exports = User;
