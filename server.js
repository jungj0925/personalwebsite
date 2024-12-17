const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Add this line to serve static files
app.use(express.static('.'));

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

app.listen(3000, () => console.log('Server running on port 3000')); 