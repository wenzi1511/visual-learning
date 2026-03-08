const http = require('http');

const data = JSON.stringify({ geminiApiKey: 'test1', groqApiKey: 'test2' });

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/keys',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    let chunks = [];
    res.on('data', (c) => chunks.push(c));
    res.on('end', () => console.log('Response:', Buffer.concat(chunks).toString()));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
