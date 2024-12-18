const express = require('express');
const querystring = require('querystring');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 8888;

// Add your client ID and secret from Spotify Dashboard
const CLIENT_ID = '6f501be47f01421c9efcca1958657e7a';
const CLIENT_SECRET = 'ea5bc5301c064f418fbed9fb3558e026';
const REDIRECT_URI = 'http://localhost:8888/callback';

app.get('/login', (req, res) => {
    const scope = 'user-read-currently-playing user-read-playback-state';
    
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: CLIENT_ID,
            scope: scope,
            redirect_uri: REDIRECT_URI
        }));
});

app.get('/callback', async (req, res) => {
    const code = req.query.code || null;

    try {
        // Get access token
        const response = await axios.post('https://accounts.spotify.com/api/token', 
            querystring.stringify({
                code: code,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            }), {
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

        const accessToken = response.data.access_token;
        const refreshToken = response.data.refresh_token;

        // Display tokens
        res.send(`
            <h1>Access Token:</h1>
            <p style="word-break: break-all;">${accessToken}</p>
            <h1>Refresh Token:</h1>
            <p style="word-break: break-all;">${refreshToken}</p>
            <p>Copy these tokens and store them safely!</p>
        `);

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error);
        res.send('Error getting token');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Visit http://localhost:${PORT}/login to get your token`);
});