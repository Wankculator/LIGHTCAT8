// server/routes/twitter-auth.js
// SECURE Twitter API Proxy - Never expose credentials to client

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
require('dotenv').config();

// Validate environment variables
const requiredEnvVars = [
    'TWITTER_CLIENT_ID',
    'TWITTER_CLIENT_SECRET',
    'TWITTER_BEARER_TOKEN'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

// Get client configuration (safe to expose)
router.get('/config', (req, res) => {
    res.json({
        clientId: process.env.TWITTER_CLIENT_ID,
        redirectUri: `${req.protocol}://${req.get('host')}/auth/twitter/callback`,
        scopes: ['tweet.read', 'users.read', 'follows.read']
    });
});

// Exchange authorization code for access token
router.post('/token', async (req, res) => {
    try {
        const { code, codeVerifier, redirectUri } = req.body;
        
        if (!code || !codeVerifier) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`
            },
            body: new URLSearchParams({
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code_verifier: codeVerifier
            })
        });
        
        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('Twitter token exchange failed:', error);
            return res.status(400).json({ error: 'Token exchange failed' });
        }
        
        const tokenData = await tokenResponse.json();
        
        // Only return the access token, not refresh token or other sensitive data
        res.json({
            access_token: tokenData.access_token,
            expires_in: tokenData.expires_in
        });
        
    } catch (error) {
        console.error('Token exchange error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify follow status (server-side proxy)
router.post('/verify-follow', async (req, res) => {
    try {
        const { accessToken, targetUsername } = req.body;
        
        if (!accessToken || !targetUsername) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        // Get current user info
        const userResponse = await fetch('https://api.twitter.com/2/users/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!userResponse.ok) {
            return res.status(401).json({ error: 'Invalid access token' });
        }
        
        const userData = await userResponse.json();
        const userId = userData.data.id;
        
        // Get target user info
        const targetResponse = await fetch(`https://api.twitter.com/2/users/by/username/${targetUsername}`, {
            headers: {
                'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!targetResponse.ok) {
            return res.status(404).json({ error: 'Target user not found' });
        }
        
        const targetData = await targetResponse.json();
        const targetUserId = targetData.data.id;
        
        // Check follow status
        const followResponse = await fetch(`https://api.twitter.com/2/users/${userId}/following/${targetUserId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const isFollowing = followResponse.ok;
        
        res.json({ isFollowing });
        
    } catch (error) {
        console.error('Follow verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
