require('dotenv').config();
const bodyParser = require('body-parser');
const dns = require('dns');
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/public', express.static(`${process.cwd()}/public`));

// store URLs
const urls = [];
let counter = 1;

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Routes
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Create new short URLs
app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;

  try {
    // Parse the URL
    const parsedUrl = new URL(url);

    // Check if the protocol is 'http' or 'https'
    if (!(parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:')) {
      throw new Error('Invalid protocol');
    }

    // Check if the URL has a valid hostname
    if (!parsedUrl.hostname) {
      throw new Error('Invalid hostname');
    }

    // Check if the URL is reachable
    const host = parsedUrl.hostname;
    dns.lookup(host, (err) => {
      if (err) {
        throw new Error('Invalid URL');
      }

      // Check if the URL is already in the array
      const existingEntry = urls.find((entry) => entry.original_url === url);

      // If it exists, return the existing entry
      if (existingEntry) {
        res.json(existingEntry);
      } else {
        // Otherwise, save the URL and send the response
        const short_url = counter++;
        urls.push({ original_url: url, short_url });
        res.json({ original_url: url, short_url });
      }
    });
  } catch (error) {
    res.json({ error: 'invalid url' });
  }
});

// Redirect to the original URL based on the short URL provided
app.get('/api/shorturl/:short_url', (req, res) => {
  const { short_url } = req.params;
  const entry = urls.find((entry) => entry.short_url == short_url);

  if (!entry) {
    return res.json({ error: 'short_url not found' });
  }

  res.redirect(entry.original_url);
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
