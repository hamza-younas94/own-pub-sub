const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const { attachSocketAuth } = require('./auth');
const { setupPubSub } = require('./pubsub');

function createApp(httpServer) {
  const app = express();
  const corsOrigin = process.env.CORS_ORIGIN || '*';

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: corsOrigin, methods: ['GET', 'POST', 'OPTIONS'] }));
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  const io = new Server(httpServer, {
    cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  const authSecret = process.env.JWT_SECRET || 'change-me';

  attachSocketAuth(io, authSecret);
  setupPubSub({ app, io, authSecret });

  app.get('/health', (req, res) => res.json({ ok: true }));

  return { app, io };
}

module.exports = { createApp };
