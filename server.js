require('dotenv').config();
const { createServer } = require('http');
const { createApp } = require('./src/app');

const httpServer = createServer();
const { app } = createApp(httpServer);

// Bind the Express app to the HTTP server after Socket.IO is mounted.
httpServer.on('request', app);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Socket pub/sub server listening on ${PORT}`);
});
