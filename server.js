const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();

// Add security headers with updated CSP
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.spotify.com https://vercel.live; frame-src 'self' https://vercel.live;"
    );
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname)));

async function refreshAccessToken() {
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', 
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
            }), {
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(
                        process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
                    ).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        process.env.SPOTIFY_ACCESS_TOKEN = response.data.access_token;
        
        // If a new refresh token is provided, update it
        if (response.data.refresh_token) {
            process.env.SPOTIFY_REFRESH_TOKEN = response.data.refresh_token;
        }

        return response.data.access_token;
    } catch (error) {
        console.error('Error refreshing token:', error.message);
        throw error;
    }
}

async function makeSpotifyRequest(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${process.env.SPOTIFY_ACCESS_TOKEN}`
            }
        });
        return response;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            // Token expired, refresh it and try again
            const newToken = await refreshAccessToken();
            const retryResponse = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${newToken}`
                }
            });
            return retryResponse;
        }
        throw error;
    }
}

app.get('/api/now-playing', async (req, res) => {
    try {
        const response = await makeSpotifyRequest(
            'https://api.spotify.com/v1/me/player/currently-playing'
        );

        if (response.status === 204) {
            return res.json({ isPlaying: false });
        }

        if (response.data && response.data.item) {
            const track = response.data.item;
            res.json({
                isPlaying: response.data.is_playing,
                title: track.name,
                artist: track.artists.map(artist => artist.name).join(', '),
                url: track.external_urls.spotify
            });
        } else {
            console.log('No track playing or no response data');
            res.json({ isPlaying: false });
        }
    } catch (error) {
        console.error('Error fetching now playing:', error.message);
        res.json({ isPlaying: false, error: error.message });
    }
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(3000, () => console.log('Server running on port 3000')); 