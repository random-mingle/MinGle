const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
  },
  transports: ['websocket', 'polling'],
});

// ── State ─────────────────────────────────────────────────────────────
const waitingQueue = []; // socket ids waiting for a partner
const activePairs  = new Map(); // socketId → partnerId (both directions)

// ── Helpers ───────────────────────────────────────────────────────────
function removeFromQueue(socketId) {
  const idx = waitingQueue.indexOf(socketId);
  if (idx !== -1) waitingQueue.splice(idx, 1);
}

function unpair(socketId) {
  const partnerId = activePairs.get(socketId);
  if (partnerId) {
    activePairs.delete(partnerId);
    activePairs.delete(socketId);
  }
  return partnerId;
}

function broadcastOnlineCount() {
  io.emit('online_count', io.engine.clientsCount);
}

// ── Socket.IO ─────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}  (total: ${io.engine.clientsCount})`);
  broadcastOnlineCount();

  // ── Typing indicator ────────────────────────────────────────────────
  socket.on('typing', () => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('typing');
    }
  });

  // ── Find Match ──────────────────────────────────────────────────────
  socket.on('find_match', () => {
    // Clean up any existing session first
    const oldPartner = unpair(socket.id);
    if (oldPartner) {
      io.to(oldPartner).emit('partner_disconnected');
    }
    removeFromQueue(socket.id);

    // Try to match with someone in the queue
    let matched = false;
    while (waitingQueue.length > 0) {
      const candidateId = waitingQueue.shift();

      // Skip stale entries (disconnected sockets)
      const candidateSocket = io.sockets.sockets.get(candidateId);
      if (!candidateSocket || !candidateSocket.connected) continue;

      // Pair them
      activePairs.set(socket.id, candidateId);
      activePairs.set(candidateId, socket.id);

      // Notify both: initiator creates the WebRTC offer
      socket.emit('matched', { initiator: true,  partnerId: candidateId });
      io.to(candidateId).emit('matched', { initiator: false, partnerId: socket.id });

      console.log(`[~] Paired: ${socket.id} ↔ ${candidateId}`);
      matched = true;
      break;
    }

    if (!matched) {
      waitingQueue.push(socket.id);
      socket.emit('waiting');
      console.log(`[…] Queued: ${socket.id}  (queue length: ${waitingQueue.length})`);
    }
  });

  // ── WebRTC Signaling Relay ──────────────────────────────────────────
  socket.on('signal', ({ signal, to }) => {
    if (!to) return;
    // Only relay if they are actually paired (security check)
    const expectedPartner = activePairs.get(socket.id);
    if (expectedPartner !== to) return;

    io.to(to).emit('signal', { signal, from: socket.id });
  });

  // ── Chat Messages ───────────────────────────────────────────────────
  socket.on('message', ({ text }) => {
    const partnerId = activePairs.get(socket.id);
    if (!partnerId) return;
    if (!text || typeof text !== 'string' || text.trim().length === 0) return;

    const sanitised = text.trim().slice(0, 500);
    io.to(partnerId).emit('message', { text: sanitised });
  });

  // ── Next ─────────────────────────────────────────────────────────────
  socket.on('next', () => {
    const partnerId = unpair(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('partner_disconnected');
      console.log(`[→] Next: ${socket.id} left ${partnerId}`);
    }
    removeFromQueue(socket.id);

    // Trigger re-queue on client (avoids recursive server emit)
    socket.emit('find_match_trigger');
  });

  // ── Report ───────────────────────────────────────────────────────────
  socket.on('report', ({ reason }) => {
    const partnerId = activePairs.get(socket.id);
    console.log(`[!] Report: ${socket.id} reported ${partnerId} — reason: ${reason}`);
    socket.emit('report_received');
  });

  // ── Disconnect ───────────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    console.log(`[-] Disconnected: ${socket.id}  (reason: ${reason})`);
    const partnerId = unpair(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('partner_disconnected');
    }
    removeFromQueue(socket.id);
    broadcastOnlineCount();
  });
});

// ── Health check ──────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    online:  io.engine.clientsCount,
    waiting: waitingQueue.length,
    pairs:   activePairs.size / 2,
  });
});

// ── Start ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Mingle backend running on http://localhost:${PORT}`);
});

// Keep alive ping (useful on free-tier hosts that sleep)
setInterval(() => console.log('[ping] Server alive'), 30000);
