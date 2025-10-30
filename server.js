import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const VITE_PORT = process.env.VITE_PORT || 5173;

// Enable CORS for the frontend (allow multiple ports for flexibility)
const allowedOrigins = [
  `http://localhost:${VITE_PORT}`,
  `http://localhost:5174`, // Vite alternative port
  `http://127.0.0.1:${VITE_PORT}`,
  `http://127.0.0.1:5174`,
];

app.use(cors({
  origin: allowedOrigins
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API proxy server is running' });
});

// OpenAI proxy endpoint
app.get('/api/openai/costs', async (req, res) => {
  const { start_time, end_time } = req.query;

  if (!process.env.VITE_OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const url = `https://api.openai.com/v1/organization/costs?start_time=${start_time}&end_time=${end_time}&bucket_width=1d&limit=180`;

    console.log('Fetching OpenAI costs:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying OpenAI request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Anthropic cost report proxy endpoint
app.get('/api/anthropic/costs', async (req, res) => {
  const { starting_at, ending_at } = req.query;

  if (!process.env.VITE_ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Anthropic API key not configured' });
  }

  try {
    const url = `https://api.anthropic.com/v1/organizations/cost_report?starting_at=${starting_at}&ending_at=${ending_at}&bucket_width=1d`;

    console.log('Fetching Anthropic costs:', url);

    const response = await fetch(url, {
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.VITE_ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying Anthropic request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Anthropic usage report proxy endpoint
app.get('/api/anthropic/usage', async (req, res) => {
  const { starting_at, ending_at } = req.query;

  if (!process.env.VITE_ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Anthropic API key not configured' });
  }

  try {
    const url = `https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at=${starting_at}&ending_at=${ending_at}&group_by[]=model&bucket_width=1d`;

    console.log('Fetching Anthropic usage:', url);

    const response = await fetch(url, {
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.VITE_ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying Anthropic request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Configuration endpoint so the frontend can detect which services are available
app.get('/api/config', (req, res) => {
  res.json({
    openaiConfigured: Boolean(process.env.VITE_OPENAI_API_KEY),
    anthropicConfigured: Boolean(process.env.VITE_ANTHROPIC_API_KEY),
    apiProxyUrl: process.env.VITE_API_PROXY_URL || `http://localhost:${PORT}`,
    port: PORT,
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ API Proxy Server running on http://localhost:${PORT}`);
  console.log(`   OpenAI configured: ${!!process.env.VITE_OPENAI_API_KEY}`);
  console.log(`   Anthropic configured: ${!!process.env.VITE_ANTHROPIC_API_KEY}\n`);
});
