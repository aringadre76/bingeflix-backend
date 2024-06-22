const axios = require('axios');

// Define your API keys
const sportAPIKey = 'b270953dbdmshd1af20bf82fb2b3p138460jsn66fb773c6d16';

async function fetchSport() {
    const options = {
        method: 'GET',
        url: 'https://sportapi7.p.rapidapi.com/api/v1/sport/football/events/live',
        headers: {
            'X-RapidAPI-Key': sportAPIKey,
            'X-RapidAPI-Host': 'sportapi7.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        // Processing the response to console.log or return it as needed
        console.log(response.data);
        return response.data; // or process the data as needed
    } catch (error) {
        console.error('Error fetching sports data:', error);
        return null; // Handle the error appropriately
    }
}

// Export the function if this is in a Node.js module
module.exports = fetchSport;

// To test the function, you might call it directly or export and use it in another part of your application
// Example of directly calling the function
// fetchSport();
