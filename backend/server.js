const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
  'https://min-gle.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: '🚀 Mingle Server Online',
    users: io.engine.clientsCount,
    timestamp: new Date().toISOString(),
  });
});

// ── State ────────────────────────────────────────────────────────────────────
const queues = { text: [], video: [] }; // waiting queues by mode
const activePairs = new Map();          // socketId → partnerId

// ── Helpers ──────────────────────────────────────────────────────────────────
function broadcastOnlineCount() {
  io.emit('online-count', io.engine.clientsCount);
}

function cleanupSocket(socketId) {
  queues.text   = queues.text.filter(s => s.id !== socketId);
  queues.video  = queues.video.filter(s => s.id !== socketId);
  activePairs.delete(socketId);
}

function notifyPartnerLeft(socketId) {
  const partnerId = activePairs.get(socketId);
  if (partnerId) {
    io.to(partnerId).emit('partner-left');
    activePairs.delete(partnerId);
  }
}

// ── Connection Handler ────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} connected | total: ${io.engine.clientsCount}`);
  broadcastOnlineCount();

  // ── Matchmaking ─────────────────────────────────────────────────────────
  socket.on('find-match', ({ mode = 'video' } = {}) => {
    // Clean up any existing session
    notifyPartnerLeft(socket.id);
    cleanupSocket(socket.id);

    const queue = queues[mode] ?? queues.video;

    if (queue.length > 0) {
      const partner = queue.shift();

      activePairs.set(socket.id, partner.id);
      activePairs.set(partner.id, socket.id);

      console.log(`[MATCH] ${socket.id} ↔ ${partner.id} [${mode}]`);

      // Initiator (newer socket) sends the WebRTC offer
      socket.emit('match', { role: 'initiator', partnerId: partner.id, mode });
      partner.emit('match', { role: 'receiver',  partnerId: socket.id,  mode });
    } else {
      queue.push(socket);
      socket.emit('waiting');
      console.log(`[WAIT] ${socket.id} waiting [${mode}] queue size: ${queue.length}`);
    }
  });

  // ── WebRTC Signaling ─────────────────────────────────────────────────────
  socket.on('offer', ({ offer, to }) => {
    socket.to(to).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ answer, to }) => {
    socket.to(to).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, to }) => {
    socket.to(to).emit('ice-candidate', { candidate, from: socket.id });
  });

  // ── Text Chat ────────────────────────────────────────────────────────────
  socket.on('chat-message', ({ message }) => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId && message?.trim()) {
      io.to(partnerId).emit('chat-message', {
        message: message.trim(),
        from: 'stranger',
        timestamp: Date.now(),
      });
    }
  });

  // ── Leave / Skip ─────────────────────────────────────────────────────────
  socket.on('leave', () => {
    notifyPartnerLeft(socket.id);
    cleanupSocket(socket.id);
    console.log(`[LEAVE] ${socket.id}`);
  });

  // ── Disconnect ───────────────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    notifyPartnerLeft(socket.id);
    cleanupSocket(socket.id);
    setTimeout(broadcastOnlineCount, 300);
    console.log(`[-] ${socket.id} disconnected (${reason}) | total: ${io.engine.clientsCount}`);
  });
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Mingle Backend running on port ${PORT}\n`);
});
