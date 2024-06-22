// import { parse } from "json2csv"; // parse json output chatgpt gives to a csv file
// import fs from 'fs'; //process
// const mongoose = require('mongoose');
// import dotenv from "dotenv";
// dotenv.config();
// import OpenAI from "openai";
// const openai = new OpenAI();
// import readline from 'readline'; // for reading user input
// const User = require('./database/usersModel');

//require('dotenv').config(); // Load environment variables at the very beginning
const OpenAI = require('openai');
const mongoose = require('mongoose');
const User = require('./database/usersModel');

// Initialize OpenAI configuration
const openai = new OpenAI({
    apiKey: "sk-proj-HT4qeDlGHmrn9rDzoQ2bT3BlbkFJP9cGfnNB19nwWf7uWNU3",
});


const getUserWatchlist = async (userName, email) => {
    try {
        const query = {};
        query.userName = userName;
        query.email = email;

        const user = await User.findOne(query);
        if (user && user.moviesList) {
            return user.moviesList.map(movie => movie.title);
        }
        throw new Error('User or watchlist not found');
    } catch (error) {
        console.error('Error retrieving user watchlist:', error);
        throw error;
    }
};

const recommenderBot = async (watchlist) => {
    const prompt = JSON.stringify(watchlist);
    console.log(watchlist.length);
    if (watchlist.length === 0) {
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `
                          You are a helpful movie and show recommendation assistant.
                          You recommend movies and shows that are trending and popular currently.
                          Give a reason under "reason" about why each movie was recommended.
                          Given one or more movies/shows, you will give 3 movies as the recommendations,
                          answered as a json file, In format:
                          "movies": [
                            { "title": "PUT MOVIE 1 HERE",
                              "year": PUT YEAR HERE,
                              "reason": PUT REASON HERE,
                              "link": "PUT LINK HERE"
                            },
                            {
                              "title": "PUT MOVIE 2 HERE",
                              "year": PUT YEAR HERE,
                              "reason": PUT REASON HERE,
                              "link": "PUT LINK HERE"
                            },
                            {
                              "title": "PUT MOVIE 3 HERE",
                              "year": PUT YEAR HERE,
                              "reason": PUT REASON HERE,
                              "link": "PUT LINK HERE"
                            }]
                          Return the format in a JSON object.
                          We believe in you.
                        `
                    },
                    {
                        role: "user",
                        content: `Recommend me movies/shows based that are currently popular and trending`
                    }
                ]
            });
            console.log("Watchlist is empty: got random popular movies:\n");
            console.log(JSON.parse(completion.choices[0].message.content).movies)
            return JSON.parse(completion.choices[0].message.content).movies;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }
    else {
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `
                          You are a helpful movie recommendation assistant.
                          You recommend movies based on similar genre and plot elements.
                          Ignore entries that you cannot find.
                          Give a reason under "reason" about why each movie was recommended based on the watchlist.
                          Given one or more movies, you will give 3 movies as the recommendations,
                          answered as a json file, In format:
                          "movies": [
                            { "title": "PUT MOVIE 1 HERE",
                              "year": PUT YEAR HERE,
                              "reason": PUT REASON HERE,
                              "link": "PUT LINK HERE"
                            },
                            {
                              "title": "PUT MOVIE 2 HERE",
                              "year": PUT YEAR HERE,
                              "reason": PUT REASON HERE,
                              "link": "PUT LINK HERE"
                            },
                            {
                              "title": "PUT MOVIE 3 HERE",
                              "year": PUT YEAR HERE,
                              "reason": PUT REASON HERE,
                              "link": "PUT LINK HERE"
                            }]
                          Return the format in a JSON object.
                          We believe in you.
                        `
                    },
                    {
                        role: "user",
                        content: `Recommend me movies based on my list: ${prompt}`
                    }
                ]
            });
            return JSON.parse(completion.choices[0].message.content).movies;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

};

const updateUserRecommendations = async (userName, email, update) => {
    try {
        const watchlist = await getUserWatchlist(userName, email);
        console.log("Update in Recommendation.js is: ", update);
        if (update) {
            const recommendations = await recommenderBot(watchlist);
            console.log("OPENAI API IS CALLED");
            console.log(recommendations);

            // Transform the recommendations into the movieSchema format
            const recommendationsWithSchema = recommendations.map(rec => ({
                _id: new mongoose.Types.ObjectId(),
                title: rec.title,
                link: rec.link // Ensure the link is included in the response from the GPT model
            }));

            // Update the user's recommendations by replacing the current recommendations
            await User.findOneAndUpdate(
                { userName, email },
                { $set: { recommendations: recommendationsWithSchema } }
            );

            console.log('Recommendations updated successfully!');
        } else {
            // Just return the watchlist
            return watchlist;
        }
    } catch (error) {
        console.error('Error updating recommendations:', error);
    }
};


module.exports = { getUserWatchlist, recommenderBot, updateUserRecommendations };
