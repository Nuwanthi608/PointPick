const express = require('express');
const { extractData } = require('../services/scraperService');

const router = express.Router();

router.post('/scrape', async (req, res) => {
  const { url, fields } = req.body;

  if (!url) return res.status(400).json({ error: 'url is required' });

  try {
    const result = await extractData(url, fields);
    res.json(result);
  } catch (err) {
    console.error('Scrape error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;