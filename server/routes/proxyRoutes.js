const express = require('express');
const { fetchAndRewrite } = require('../services/proxyService');

const router = express.Router();

router.get('/proxy', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'url query parameter is required' });
  }

  try {
    const html = await fetchAndRewrite(url);

    // මේ headers දෙක වැදගත් - iframe එකේ පෙන්නන්න
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.removeHeader('X-Frame-Options');

    res.send(html);
  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;