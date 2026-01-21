# hy-pub-sub

Minimal Express + Socket.IO pub/sub backend suited for cPanel/Namecheap shared hosting (Passenger). No third-party messaging service required; everything runs in this Node app.

## Features
- Socket.IO with websocket or polling fallback for hosts without native websocket support.
- JWT-based auth for both sockets and REST publish endpoint.
- Simple in-memory pub/sub (rooms); easy to swap to Redis later.
- Health check at `/health`.

## Requirements
- Node.js 18+ (use `nvm use 18` if your host supports it).
- Env vars: `JWT_SECRET` (required), `PORT` (optional, defaults to 3000), `CORS_ORIGIN` (optional, defaults to `*`).

## Environment variables
- `JWT_SECRET` (required): strong shared secret for signing/verifying JWTs.
- `PORT` (optional): Passenger sets this; keep default.
- `CORS_ORIGIN` (optional): allowed origin(s); `*` by default.

## Install and run locally
1) Copy env: `cp .env.example .env` and set `JWT_SECRET`.
2) Install deps: `npm install`.
3) Run: `npm run dev` (or `npm start` for production mode).
4) Test socket connection:
```js
const socket = io('http://localhost:3000', { auth: { token: 'your-jwt' } });
socket.emit('subscribe', 'demo');
socket.emit('publish', { channel: 'demo', data: { hello: 'world' } });
socket.on('message', console.log);
```
5) Publish via REST:
```bash
curl -X POST http://localhost:3000/publish \
  -H "Authorization: Bearer <your-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"channel":"demo","data":{"msg":"hi"}}'
```

## Deploy on cPanel / Namecheap Node.js App (Passenger)
1) In cPanel, open “Setup Node.js App”. Create an app:
   - Application root: your folder (e.g., `nodeapp` or `nodeapp/hy-pub-sub`).
   - Application URL: your domain/subdomain.
   - Application startup file: `server.js`.
   - Node version: 18.x.
2) Upload the project into the application root (File Manager, git clone, or SFTP).
3) SSH into the account (or use the cPanel terminal), `cd` to the application root, run `npm install`.
4) In the same UI, set environment variables: `JWT_SECRET` (required), optional `CORS_ORIGIN`. Leave `PORT` to Passenger.
5) Click “Restart App” so Passenger reloads `server.js`.
6) Verify health: visit `https://your-domain/health` and expect `{ "ok": true }`.
7) If websockets are blocked, Socket.IO will automatically fall back to polling.

## Test dashboard
- A minimal web UI is available at `/dashboard.html` (served from this app).
- Steps:
  1) Obtain a JWT signed with the same `JWT_SECRET` as the server.
  2) Open `https://your-domain/dashboard.html`.
  3) Paste the token, choose a channel (e.g., `demo`), click Connect, then Subscribe.
  4) Publish JSON messages and watch them arrive in the log. Connection errors will show as failed in the log.

## How to use (sockets and REST)
- Connect (frontend JS):
```html
<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
<script>
const token = '<your-jwt>'; // signed with the same JWT_SECRET as Node
const socket = io('https://your-domain', { auth: { token } });
socket.on('connect', () => socket.emit('subscribe', 'demo'));
socket.on('message', msg => console.log(msg));
// Optional publish from client
socket.emit('publish', { channel: 'demo', data: { hello: 'world' } });
</script>
```
- Publish via REST from any backend:
```bash
curl -X POST https://your-domain/publish \
  -H "Authorization: Bearer <your-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"channel":"demo","data":{"msg":"hi"}}'
```

## Laravel / PHP integration
- Create a JWT with the same `JWT_SECRET` and pass it to your page for the Socket.IO client.
- Laravel example (requires `firebase/php-jwt` and `guzzlehttp/guzzle`):
```php
use Firebase\JWT\JWT;
use GuzzleHttp\Client;

$secret = env('NODE_JWT_SECRET');
$token = JWT::encode(['sub' => 'user123', 'iat' => time()], $secret, 'HS256');

// Pass $token to your Blade view and use it in the JS client above.

// Optional: publish from Laravel
$client = new Client();
$client->post('https://your-domain/publish', [
    'headers' => ['Authorization' => "Bearer {$token}", 'Accept' => 'application/json'],
    'json' => ['channel' => 'demo', 'data' => ['msg' => 'hello from Laravel']],
]);
```
- Plain PHP publish (requires `firebase/php-jwt`):
```php
require 'vendor/autoload.php';
use Firebase\JWT\JWT;

$secret = 'your-secret';
$token = JWT::encode(['sub' => 'backend', 'iat' => time()], $secret, 'HS256');

$ch = curl_init('https://your-domain/publish');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json'
    ],
    CURLOPT_POSTFIELDS => json_encode(['channel' => 'demo', 'data' => ['msg' => 'hi']]),
    CURLOPT_RETURNTRANSFER => true
]);
$response = curl_exec($ch);
curl_close($ch);
```

## Structure
- `server.js` — entry point, creates HTTP server.
- `src/app.js` — Express + Socket.IO wiring.
- `src/auth.js` — JWT verification for HTTP and sockets.
- `src/pubsub.js` — REST publish endpoint and socket handlers.
- `.env.example` — environment template.

## Notes
- Use a strong `JWT_SECRET`; rotate as needed.
- In-memory rooms mean a single process; for multi-instance fan-out, add a Redis adapter later.
- If you need strict origins, set `CORS_ORIGIN` to your site URL (e.g., `https://your-domain`).
