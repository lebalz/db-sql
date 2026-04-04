const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4000;
const ROOT = path.join(__dirname, 'swagger-ui-dist');

const MIME_TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'application/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.map': 'application/json; charset=utf-8'
};

function send(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
	res.writeHead(statusCode, { 'Content-Type': contentType });
	res.end(body);
}

function resolveFile(urlPath) {
	const requested = decodeURIComponent(urlPath.split('?')[0]);
	const safePath = requested === '/' ? '/index.html' : requested;
	const fullPath = path.join(ROOT, safePath);
	if (!fullPath.startsWith(ROOT)) return null;
	return fullPath;
}

http
	.createServer((req, res) => {
		const filePath = resolveFile(req.url || '/');
		if (!filePath) return send(res, 400, 'Bad request');

		fs.readFile(filePath, (err, data) => {
			if (err) {
				return send(res, 404, 'Not found');
			}
			const ext = path.extname(filePath).toLowerCase();
			const contentType = MIME_TYPES[ext] || 'application/octet-stream';
			send(res, 200, data, contentType);
		});
	})
	.listen(PORT, () => {
		console.log(`Visit http://localhost:${PORT}`);
	});
