const axios = require('axios');
/*
const options = {
  method: 'GET',
  url: 'https://streaming-availability.p.rapidapi.com/search/title',
  params: {
    country: 'us',
    title: 'Physical 100',
    output_language: 'en',
    show_type: 'all'
  },
  headers: {
    'X-RapidAPI-Key': 'ecbd6ce98amsha24963bf3f9ee3bp19377ejsn9783a8efaa6b',
    'X-RapidAPI-Host': 'streaming-availability.p.rapidapi.com'
  }
};

async function fetchMovieData() {
    try {
        const response = await axios.request(options);
        // console.log(response.data);

        const streamingInfo = response.data.result[0].streamingInfo;
        console.log("Streaming Info for 'Physical 100':", streamingInfo);
        
    } catch (error) {
        console.error(error);
    }
}
*/

// Array of API keys
const API_KEYS = [
    'ecbd6ce98amsha24963bf3f9ee3bp19377ejsn9783a8efaa6b',  // regular key
    '151db67c49msh509c354b0dee5a3p19e99bjsnf78de8b1af13',  // other key
    // Add more API keys here if you have them
];

async function fetchWatchLink(showName) {
    // Try each API key until one works
    for (let apiKey of API_KEYS) {
        const options = {
            method: 'GET',
            url: 'https://streaming-availability.p.rapidapi.com/search/title',
            params: {
                title: showName,
                country: 'us',
                show_type: 'all',
                output_language: 'en'
            },
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': 'streaming-availability.p.rapidapi.com'
            }
        };

        try {
            const response = await axios.request(options);
            var results = response.data.result;
            var name = "None", showType = "None", link;

            for (var i = 0; i < results.length; i++) {
                if (results[i].streamingInfo && results[i].streamingInfo.us && results[i].streamingInfo.us[0]) {
                    link = results[i].streamingInfo.us[0].videoLink || results[i].streamingInfo.us[0].link;
                    if (link) {
                        name = results[i].title;
                        showType = results[i].type;
                        break;
                    }
                }
            }

            if (!link) {
                link = "Unable to find link!";
            }

            console.log(`Successfully fetched data using API key: ${apiKey.substring(0, 10)}...`);
            return { link, name, showType };

        } catch (error) {
            console.log(`API key ${apiKey.substring(0, 10)}... failed:`, error.message);
            // If this is the last API key, throw the error
            if (apiKey === API_KEYS[API_KEYS.length - 1]) {
                console.log("All API keys exhausted");
                return { 
                    link: "https://www.netflix.com", 
                    name: showName, 
                    showType: "movie" 
                };
            }
            // Otherwise continue to next API key
            continue;
        }
    }
}

// Call the async function to perform the request
// fetchWatchLink("physical 100");

module.exports = fetchWatchLink;

