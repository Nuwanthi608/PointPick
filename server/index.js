require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const proxyRoutes = require('./routes/proxyRoutes');
const scrapeRoutes = require('./routes/scrapeRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// injector.js serve කරන්න
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PointPick server running' });
});

app.use('/api', proxyRoutes);
app.use('/api', scrapeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PointPick server → http://localhost:${PORT}`);
});