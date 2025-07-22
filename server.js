const http = require('http');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const { URLSearchParams } = require('url');

class QuoteEmitter extends EventEmitter {}
const quoteEmitter = new QuoteEmitter();

// Create logs folder and data folder if not exist
['logs', 'data'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// Handle quote event
quoteEmitter.on('quoteAdded', (quote) => {
  const logEntry = `${new Date().toISOString()} - Quote: ${quote}\n`;
  fs.appendFile(path.join(__dirname, 'logs', 'access.log'), logEntry, err => {
    if (err) console.error('Log write error:', err);
  });
});

const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    // Add this in your GET handler (inside the `if (req.method === 'GET')` block)
    if (req.url === '/style.css') {
    const cssPath = path.join(__dirname, 'public', 'style.css');
    fs.readFile(cssPath, (err, content) => {
        res.writeHead(200, { 'Content-Type': 'text/css' });
        res.end(content);
    });
    return;
    }

    if (req.url === '/') {
      const filePath = path.join(__dirname, 'public', 'index.html');
      fs.readFile(filePath, (err, content) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      });
    } else if (req.url === '/quotes') {
      const quotePath = path.join(__dirname, 'data', 'quotes.txt');
      fs.readFile(quotePath, 'utf8', (err, data) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(data || 'No quotes yet.');
      });
    } else {
      res.writeHead(404);
      res.end('404 Not Found');
    }
  } else if (req.method === 'POST' && req.url === '/submit') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const parsed = new URLSearchParams(body);
      const quote = parsed.get('quote');

      fs.appendFile(path.join(__dirname, 'data', 'quotes.txt'), `${quote}\n`, (err) => {
        if (err) {
          res.writeHead(500);
          res.end('Error saving quote.');
        } else {
          quoteEmitter.emit('quoteAdded', quote);
          res.writeHead(302, { Location: '/' });
          res.end();
        }
      });
    });
  }
});

server.listen(3000, () => {
  console.log('📜 Quote Logger running at http://localhost:3000');
});
