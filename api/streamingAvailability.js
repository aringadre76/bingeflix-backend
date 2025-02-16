const axios = require('axios');

// Array of API keys
const API_KEYS = [
    'ecbd6ce98amsha24963bf3f9ee3bp19377ejsn9783a8efaa6b',  // regular key
    '151db67c49msh509c354b0dee5a3p19e99bjsnf78de8b1af13',  // other key
    'cbc2c68d40msh729c93f9011f89dp17cb58jsn8bde115ac76b',  // new key
    // Add more API keys here if you have them
];

async function fetchWatchLink(showName) {
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
            const results = response.data.result;
            let link = null, name = "None", showType = "None";

            for (let result of results) {
                if (result.streamingInfo && result.streamingInfo.us) {
                    const streamingOptions = result.streamingInfo.us;
                    for (let option of streamingOptions) {
                        if (option.link) {
                            link = option.link;
                            name = result.title;
                            showType = result.type;
                            break;
                        }
                    }
                    if (link) break;
                }
            }

            if (!link) {
                link = "Unable to find link!";
            }

            console.log(`Successfully fetched data using API key: ${apiKey.substring(0, 10)}...`);
            return { link, name, showType };

        } catch (error) {
            console.log(`API key ${apiKey.substring(0, 10)}... failed:`, error.message);
            if (apiKey === API_KEYS[API_KEYS.length - 1]) {
                console.log("All API keys exhausted");
                return { 
                    link: "https://www.netflix.com", 
                    name: showName, 
                    showType: "movie" 
                };
            }
            continue;
        }
    }
}

// Call the async function to perform the request
// fetchWatchLink("physical 100");

module.exports = fetchWatchLink;

