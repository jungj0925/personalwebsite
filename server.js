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

app.get('/api/now-playing', async (req, res) => {
    try {
        // Using the direct player endpoint instead of user-specific endpoint
        const response = await axios.get(
            'https://api.spotify.com/v1/me/player/currently-playing',
            {
                headers: {
                    'Authorization': `Bearer ${process.env.SPOTIFY_ACCESS_TOKEN}`
                }
            }
        );

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
        console.error('Error details:', error.response ? error.response.data : error.message);
        res.json({ isPlaying: false });
    }
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(3000, () => console.log('Server running on port 3000')); 