const https = require('https');

// Array of API keys
const API_KEYS = [
    'ecbd6ce98amsha24963bf3f9ee3bp19377ejsn9783a8efaa6b',  // regular key
    '151db67c49msh509c354b0dee5a3p19e99bjsnf78de8b1af13',  // other key
    'cbc2c68d40msh729c93f9011f89dp17cb58jsn8bde115ac76b',  // new key
    // Add more API keys here if you have them
];

async function fetchWatchLink(showName) {
    // Try each API key until one works
    for (let apiKey of API_KEYS) {
        const options = {
            method: 'GET',
            hostname: 'streaming-availability.p.rapidapi.com',
            port: null,
            path: `/search/basic?country=us&service=netflix&type=movie&keyword=${encodeURIComponent(showName)}`,
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': 'streaming-availability.p.rapidapi.com'
            }
        };

        try {
            const response = await new Promise((resolve, reject) => {
                const req = https.request(options, function (res) {
                    const chunks = [];

                    res.on('data', function (chunk) {
                        chunks.push(chunk);
                    });

                    res.on('end', function () {
                        const body = Buffer.concat(chunks);
                        resolve(JSON.parse(body.toString()));
                    });
                });

                req.on('error', reject);
                req.end();
            });

            if (response.results && response.results.length > 0) {
                const result = response.results[0];
                return {
                    link: result.streamingInfo?.netflix?.us?.link || "https://www.netflix.com",
                    name: result.title || showName,
                    showType: result.type || "movie"
                };
            }

            console.log(`Successfully fetched data using API key: ${apiKey.substring(0, 10)}...`);
            return { 
                link: "https://www.netflix.com", 
                name: showName, 
                showType: "movie" 
            };

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

