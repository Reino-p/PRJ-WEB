const path = require('path');
const XLSX = require('xlsx');
const axios = require('axios');

// Construct the path to the Excel file in the src directory
const filePath = path.join(__dirname, 'src', 'AloeFeroxPHENOLOGY.xlsx');

// Load the Excel file
const workbook = XLSX.readFile(filePath);

// Get the sheet name
const sheetName = 'FLOWERS';
const worksheet = workbook.Sheets[sheetName];

// Convert sheet to JSON
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Your Meteostat API key
const apiKey = '3230dcb95cmshda7f116f795e959p124f12jsnb8cdc60f6b66';

// Helper function to find column index by header name
function findColumnIndex(headers, name) {
    return headers.indexOf(name);
}

// Function to convert Excel serial date to JS Date
function excelSerialDateToJSDate(serial) {
    const excelEpoch = new Date(1900, 0, 1);
    const daysOffset = serial - 2; // Adjust for Excel's leap year bug (1900 is a leap year in Excel)
    const jsDate = new Date(excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    return jsDate;
}

// Function to format date as YYYY-MM-DD
function formatDate(dateSerial) {
    if (typeof dateSerial === 'number') {
        const date = excelSerialDateToJSDate(dateSerial);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } else if (typeof dateSerial === 'string') {
        return dateSerial;
    } else {
        throw new Error(`Expected number or string for date but got: ${typeof dateSerial}`);
    }
}

// Function to get weather data from Meteostat API
async function getWeatherData(lat, lon, date) {
    const url = `https://meteostat.p.rapidapi.com/point/daily?lat=${lat}&lon=${lon}&start=${date}&end=${date}&alt=0`;

    try {
        const response = await axios.get(url, {
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'meteostat.p.rapidapi.com'
            }
        });
        const weatherData = response.data.data[0];  // Get the weather data for the specific date
        return {
            tavg: weatherData.tavg,
            tmin: weatherData.tmin,
            tmax: weatherData.tmax,
            prcp: weatherData.prcp,
            snow: weatherData.snow,
            wdir: weatherData.wdir,
            wspd: weatherData.wspd,
            wpgt: weatherData.wpgt,
            pres: weatherData.pres,
            tsun: weatherData.tsun
        };
    } catch (error) {
        console.error(`Failed to fetch weather data: ${error.message}`);
        return null;
    }
}

// Function to create a delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Process the data and save weather info back to the Excel sheet
async function processDates(data) {
    const headers = data[0];  // First row is headers
    console.log("Headers found in the Excel sheet:", headers);  // Print headers for debugging

    const dateIndex = findColumnIndex(headers, 'observed_on');  // Index for the observed_on date
    const latIndex = findColumnIndex(headers, 'latitude');  // Index for latitude
    const lonIndex = findColumnIndex(headers, 'longitude');  // Index for longitude

    // Adding new columns for weather data
    const newColumns = ['tavg', 'tmin', 'tmax', 'prcp', 'snow', 'wdir', 'wspd', 'wpgt', 'pres', 'tsun'];
    const indices = newColumns.map((_, i) => headers.length + i);
    headers.push(...newColumns);

    if (dateIndex === -1 || latIndex === -1 || lonIndex === -1) {
        throw new Error('Required columns not found');
    }

    console.log('Starting to fetch weather data...');

    for (let i = 1; i < data.length; i++) {  // Start from the second row (data)
        const row = data[i];
        const dateSerial = row[dateIndex];
        const lat = row[latIndex];
        const lon = row[lonIndex];

        if (dateSerial && lat && lon) {
            try {
                const formattedDate = formatDate(dateSerial);
                console.log(`Fetching weather data for ${lat}, ${lon} on ${formattedDate}`);
                const weatherData = await getWeatherData(lat, lon, formattedDate);

                if (weatherData) {
                    // Save weather data to the row
                    indices.forEach((index, idx) => {
                        row[index] = Object.values(weatherData)[idx];
                    });
                } else {
                    console.log(`No weather data returned for ${lat}, ${lon} on ${formattedDate}`);
                }

                // Add a delay of 2 seconds between each API call
                await delay(2000);

            } catch (error) {
                console.error(`Invalid date: ${dateSerial}`);
            }
        } else {
            console.log(`Missing data for row ${i}`);
        }
    }

    console.log("Finished processing all rows");

    // Convert JSON back to worksheet
    const newWorksheet = XLSX.utils.aoa_to_sheet(data);

    // Replace the old worksheet with the new one
    workbook.Sheets[sheetName] = newWorksheet;

    // Write the updated workbook back to the Excel file
    XLSX.writeFile(workbook, filePath);

    console.log("Data saved successfully");
}

// Execute the processing
processDates(data).then(() => console.log("Script completed successfully")).catch(console.error);
