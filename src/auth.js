const jwt = require('jsonwebtoken');

function extractBearer(header) {
  if (!header || typeof header !== 'string') return null;
  const parts = header.split(' ');
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
  return null;
}

function verifyToken(token, secret) {
  if (!token) return null;
  try {
    return jwt.verify(token, secret, { clockTolerance: 5 });
  } catch (err) {
    return null;
  }
}

function makeHttpAuth(secret) {
  return function httpAuth(req, res, next) {
    const token = extractBearer(req.headers.authorization) || req.body?.token;
    const claims = verifyToken(token, secret);
    if (!claims) return res.status(401).json({ error: 'unauthorized' });
    req.user = claims;
    return next();
  };
}

function attachSocketAuth(io, secret) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || extractBearer(socket.handshake.headers.authorization);
    const claims = verifyToken(token, secret);
    if (!claims) return next(new Error('auth_failed'));
    socket.data.user = claims.sub || claims.user || 'anonymous';
    socket.data.claims = claims;
    return next();
  });
}

module.exports = {
  attachSocketAuth,
  makeHttpAuth,
  verifyToken,
};
