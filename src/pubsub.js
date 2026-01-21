const { makeHttpAuth } = require('./auth');

function setupPubSub({ app, io, authSecret }) {
  const httpAuth = makeHttpAuth(authSecret);

  app.post('/publish', httpAuth, (req, res) => {
    const { channel, data } = req.body || {};
    if (!channel || typeof channel !== 'string') {
      return res.status(400).json({ error: 'channel is required' });
    }
    io.to(channel).emit('message', { channel, data, from: req.user?.sub || 'http' });
    return res.json({ ok: true });
  });

  io.on('connection', (socket) => {
    socket.on('subscribe', (channel) => {
      if (!channel || typeof channel !== 'string') return;
      socket.join(channel);
      socket.emit('subscribed', channel);
    });

    socket.on('publish', ({ channel, data }) => {
      if (!channel || typeof channel !== 'string') return;
      io.to(channel).emit('message', { channel, data, from: socket.data.user });
    });
  });
}

module.exports = { setupPubSub };
