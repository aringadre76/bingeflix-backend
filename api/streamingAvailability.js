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

other_API_KEY = '151db67c49msh509c354b0dee5a3p19e99bjsnf78de8b1af13'
regular_API_KEY = 'ecbd6ce98amsha24963bf3f9ee3bp19377ejsn9783a8efaa6b'

async function fetchWatchLink(showName) {
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
      'x-rapidapi-key': 'ecbd6ce98amsha24963bf3f9ee3bp19377ejsn9783a8efaa6b',
      'x-rapidapi-host': 'streaming-availability.p.rapidapi.com'
    }
  };
  try {
    const response = await axios.request(options);
    var results = response.data.result;
    var name = "None", showType = "None";

    //console.log(results[i]);

    for (var i = 0; i < results.length; i++) {
      // Attempt to assign videoLink or fallback to link
      link = results[i].streamingInfo.us[i].videoLink || results[i].streamingInfo.us[i].link;

      // If a valid link is found, break out of the loop
      if (link) {
        name = results[i].title;
        showType = results[i].type;
        break;
      }
    }

    //console.log("name: " + name);
    //console.log("showType: " + showType);

    // If no valid links are found in any of the results, optionally handle the case (e.g., set a default link or error message)
    if (!link) {
      link = "Unable to find link!"; // Adjust as necessary
    }

    //console.log("Streaming Link for " + showName + ": " + linkie);
    return { link, name, showType };
  } catch (error) {
    console.log("exceeded API daily quota")
    console.error("error: " + error);
    return "https://www.netflix.com/title/70143836";
  }
}

// Call the async function to perform the request
// fetchWatchLink("physical 100");

module.exports = fetchWatchLink;

