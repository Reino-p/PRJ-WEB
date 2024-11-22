const apiKey = "9b9fa3157f31c0626eddf95397b1c82f"; // Replace with your actual API key
const axios = require('axios');


const coordinates = [
    { lat: 40.7128, lon: -74.0060 },
    { lat: 34.0522, lon: -118.2437 }
    // Add more coordinates as needed
];

const fetchCurrentWeatherData = async (lat, lon) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    console.log(`Fetching data from URL: ${url}`);

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching weather data: ${error.response ? error.response.data : error.message}`);
        return null;
    }
};

const getWeatherDataForCoordinates = async () => {
    for (const coord of coordinates) {
        const weatherData = await fetchCurrentWeatherData(coord.lat, coord.lon);
        if (weatherData) {
            console.log(`Weather data for ${coord.lat}, ${coord.lon}:`, weatherData);
        } else {
            console.log(`Failed to fetch weather data for ${coord.lat}, ${coord.lon}`);
        }
    }
};

getWeatherDataForCoordinates();
