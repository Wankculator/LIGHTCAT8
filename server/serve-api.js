const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API running' });
});

app.get('/api/stats', (req, res) => {
  res.json({ 
    totalSold: 1500000,
    totalBatches: 2143,
    progress: 7.14,
    lastUpdate: new Date()
  });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
