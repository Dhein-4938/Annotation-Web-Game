import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(join(__dirname, 'public')));

const clients = {};

io.on('connection', (socket) => {
    const clientId = socket.id;
    const clientIp = socket.handshake.address;
    const userAgent = socket.handshake.headers['user-agent'];

    // Add client to the list
    clients[clientId] = { ip: clientIp, userAgent };

    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] New client connected:\n  ID: ${clientId}\n  IP: ${clientIp}\n  User Agent: ${userAgent}\n`);
    console.log(`Current clients: ${Object.keys(clients).length}`);

    // Log the client current location
    socket.on('location', (data) => {
        console.log(`Client ${clientId} location: ${data}`);
    });

    // Handle incoming messages from the client
    socket.on('message', (data) => {
        console.log(`Message from client ${clientId}: ${data}`);
    });

    // Handle socket events here
    socket.on('disconnect', () => {
        console.log(`Client disconnected:\n  ID: ${clientId}\n  IP: ${clientIp}\n  User Agent: ${userAgent}\n`);
        // Remove client from the list
        delete clients[clientId];
        console.log(`Current clients: ${Object.keys(clients).length}`);
    });
});

// Serve binary files
app.get('/data/height_cache_WASS316L.bin', (req, res) => {
    const filePath = join(__dirname, 'public', 'data', 'height_cache_WASS316L.bin');
    const readStream = fs.createReadStream(filePath);
    res.setHeader('Content-Type', 'application/octet-stream');
    readStream.pipe(res);
});

app.get('/data/height_cache_H282.bin', (req, res) => {
    const filePath = join(__dirname, 'public', 'data', 'height_cache_H282.bin');
    const readStream = fs.createReadStream(filePath);
    res.setHeader('Content-Type', 'application/octet-stream');
    readStream.pipe(res);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});