
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../backend/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const NEWS_CACHE_PATH = path.join(__dirname, '../cache/news-cache.txt');
const ADMIN_HTML_PATH = path.join(__dirname, 'admin.html');

const server = http.createServer((req, res) => {
    if (req.url === '/' && req.method === 'GET') {
        // Serve the admin.html file
        fs.readFile(ADMIN_HTML_PATH, (err, data) => {
            if (err) {
                logger.error('Error loading admin page', { error: err });
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error loading admin page.' }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (req.url === '/api/news-cache' && req.method === 'GET') {
        // Serve the news-cache.txt data
        fs.readFile(NEWS_CACHE_PATH, 'utf8', (err, data) => {
            if (err) {
                logger.error('Error reading cache file', { error: err });
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error reading cache file.' }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            // Convert NDJSON to a JSON array for easier consumption on the frontend
            try {
                const jsonArray = data.split('\n').filter(line => line.trim() !== '').map(line => JSON.parse(line));
                res.end(JSON.stringify(jsonArray));
            } catch (parseErr) {
                logger.error('Failed to parse NDJSON cache', { error: parseErr });
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to parse cache file.' }));
            }
        });
    } else if (req.url === '/api/news-cache' && req.method === 'POST') {
        // Save the updated news cache data
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const newRecords = JSON.parse(body);
                // Read the old file to compare and log changes
                fs.readFile(NEWS_CACHE_PATH, 'utf8', (err, oldData) => {
                    if (err && err.code !== 'ENOENT') {
                        logger.error('Error reading existing cache file for comparison', { error: err });
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Error reading existing cache file for comparison.' }));
                        return;
                    }
                    const oldRecords = oldData ? oldData.split('\n').filter(line => line.trim() !== '').map(line => JSON.parse(line)) : [];
                    const oldRecordsMap = new Map(oldRecords.map(rec => [rec.sourceId, rec]));
                    newRecords.forEach(newRecord => {
                        const oldRecord = oldRecordsMap.get(newRecord.sourceId);
                        if (oldRecord && JSON.stringify(oldRecord) !== JSON.stringify(newRecord)) {
                            logger.info(`Record changed: ${newRecord.sourceId}`);
                        }
                    });
                    // Convert JSON array back to NDJSON and write to file
                    const ndjsonString = newRecords.map(row => JSON.stringify(row)).join('\n');
                    fs.writeFile(NEWS_CACHE_PATH, ndjsonString, 'utf8', (writeErr) => {
                        if (writeErr) {
                            logger.error('Error writing cache file', { error: writeErr });
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Error writing cache file.' }));
                            return;
                        }
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Cache updated successfully.' }));
                    });
                });
            } catch (e) {
                logger.error('Invalid JSON data received', { error: e });
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON data.' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Admin server running at http://localhost:${PORT}`);
    console.log('Navigate to this URL in your browser.');
});
