# ♛ Mingle — Anonymous Video Chat Platform

> A premium, anonymous video chat platform connecting strangers worldwide. Built with Next.js, Node.js, Socket.IO & WebRTC.

---

## 🗂️ Folder Structure

```
mingle/
├── backend/
│   ├── package.json
│   └── server.js            ← Node.js + Express + Socket.IO
│
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env.local.example   ← Copy to .env.local
    ├── app/
    │   ├── layout.js        ← Root layout + fonts
    │   ├── globals.css      ← Global styles + CSS vars
    │   ├── page.js          ← Landing page
    │   └── chat/
    │       └── page.js      ← Chat page
    └── components/
        └── ChatRoom.jsx     ← Main video chat component (WebRTC)
```

---

## ⚙️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Next.js 14 (App Router) + Tailwind  |
| Backend    | Node.js + Express + Socket.IO       |
| Video      | WebRTC (free STUN + TURN servers)   |
| Signaling  | Socket.IO (real-time relay)         |
| Deploy FE  | Vercel                              |
| Deploy BE  | Render                              |

---

## 🚀 Local Setup (Step by Step)

### Step 1 — Clone / Download the project

```bash
# If using git
git clone https://github.com/YOUR_USERNAME/mingle.git
cd mingle
```

### Step 2 — Set up the Backend

```bash
cd backend
npm install
npm run dev        # starts on http://localhost:4000
```

You should see:
```
🚀 Mingle backend running on http://localhost:4000
```

### Step 3 — Set up the Frontend

Open a new terminal:

```bash
cd frontend
npm install

# Create environment file
cp .env.local.example .env.local
# .env.local already points to http://localhost:4000 for local dev

npm run dev        # starts on http://localhost:3000
```

### Step 4 — Open in browser

Open **http://localhost:3000** in two different browser tabs (or two devices).

- Click **START** in both tabs → they will be matched!
- Allow camera/microphone when prompted.

---

## 🌐 Deployment

### Backend → Render (Free)

1. Push your code to GitHub.
2. Go to https://render.com → **New Web Service**
3. Connect your GitHub repo → select the **backend** folder as root.
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Click **Deploy** → copy the URL (e.g. `https://mingle-backend.onrender.com`)

### Frontend → Vercel (Free)

1. Go to https://vercel.com → **New Project**
2. Import your GitHub repo → set **Root Directory** to `frontend`
3. Add Environment Variable:
   - Key: `NEXT_PUBLIC_BACKEND_URL`
   - Value: `https://mingle-backend.onrender.com` (your Render URL)
4. Click **Deploy** → get your live URL!

---

## 🧠 How the Matching Works

```
User A opens app → connects to Socket.IO server
User A clicks START → emits "find_match"

Server: queue is empty → adds User A to waitingQueue

User B clicks START → emits "find_match"

Server: queue has User A → pairs them:
  - activePairs.set(A, B) and activePairs.set(B, A)
  - emits "matched" to both:
    - User A gets { initiator: true }
    - User B gets { initiator: false }

User A (initiator) creates WebRTC offer → sends via Socket.IO
User B receives offer → creates answer → sends back
ICE candidates exchanged → P2P video established! ✅

On "Next" button:
  - Current pair broken
  - Both users notified
  - Current user re-enters queue
```

---

## 📱 UI Layout

### Mobile
```
┌─────────────────────────────┐
│     Ad Banner (68px)        │
├─────────────────────────────┤
│                      [Next] │
│   STRANGER VIDEO     [Mute] │
│                      [VidOf]│
├─────────────────────────────┤
│ [chat overlay]       [Reprt]│
│   YOUR VIDEO                │
│                             │
├─────────────────────────────┤
│  [Text Input Box]      [→]  │
└─────────────────────────────┘
```

### Desktop
```
┌─────────────────────────────────────────────┐
│              Ad Banner (68px)               │
├─────────────────┬───────────────────────────┤
│  STRANGER VIDEO │  YOUR VIDEO        [Next] │
│                 │                    [Mute] │
│ [chat overlay]  │                   [VidOff]│
│                 │                   [Report]│
├─────────────────┴───────────────────────────┤
│         [Text Input Box]             [→]    │
└─────────────────────────────────────────────┘
```

---

## 🔒 Safety & Moderation

- Report button → sends reason to backend (logged)
- Extend `server.js` to store reports in a database (MongoDB, Postgres)
- Add rate limiting with `express-rate-limit`
- Add profanity filter on messages

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| Camera not working | Allow browser permissions, use HTTPS |
| Can't connect to backend | Check `NEXT_PUBLIC_BACKEND_URL` in `.env.local` |
| Two users can't see each other | WebRTC needs HTTPS in production (Vercel handles this) |
| Render backend sleeping | Free tier sleeps after 15min; upgrade or use keep-alive ping |

---

## 📝 Telugu Explanation (తెలుగు వివరణ)

### Project ఎలా పని చేస్తుంది?

**Backend (backend/server.js):**
- Node.js server Socket.IO తో run అవుతుంది
- User "START" click చేస్తే → server queue లో పెడుతుంది
- మరో user వస్తే → వాళ్ళిద్దరినీ match చేస్తుంది
- WebRTC signaling (offer/answer/ICE) relay చేస్తుంది
- Messages ని partner కి forward చేస్తుంది

**Frontend (components/ChatRoom.jsx):**
- getUserMedia() తో camera/mic access తీసుకుంటుంది
- Socket.IO తో backend తో connect అవుతుంది
- Match అయిన తర్వాత WebRTC peer connection create చేస్తుంది
- Offer → Answer → ICE candidates exchange → Video connect!
- Messages send/receive చేస్తుంది

**Layout:**
- Mobile: Top = Stranger, Bottom = You (vertical split)
- Desktop: Left = Stranger, Right = You (horizontal split)
- Right side: Control buttons (Next, Mute, Video Off, Report)
- Left side: Chat messages (glass overlay)
- Bottom: Text input box

**Deployment:**
1. Backend → Render.com లో deploy చేయి (free)
2. Frontend → Vercel లో deploy చేయి (free)
3. Vercel లో `NEXT_PUBLIC_BACKEND_URL` = Render URL set చేయి
4. Done! 🎉

---

## 📄 License

MIT © 2025 Mingle
