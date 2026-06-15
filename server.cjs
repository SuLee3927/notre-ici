const express = require("express");
const path = require("path");
const http = require("http");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const DESIRE_HOST = "129.226.158.222";
const DESIRE_PORT = 8765;
const SLOT_PORT   = 3000;

const KL_PASSWORD   = "K♡L";
const KL_AUTH_TOKEN = process.env.KL_AUTH_TOKEN || "notre-kl-2026";
const AUTH_COOKIE   = "kl_auth";

function parseCookies(req) {
  const result = {};
  for (const chunk of (req.headers.cookie || "").split(";")) {
    const idx = chunk.indexOf("=");
    if (idx < 0) continue;
    result[chunk.slice(0, idx).trim()] = chunk.slice(idx + 1).trim();
  }
  return result;
}

function makeProxy(hostname, port, basePath) {
  return (req, res) => {
    const options = {
      hostname, port,
      path: basePath + req.path + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""),
      method: req.method,
      headers: { "content-type": req.headers["content-type"] || "application/json" },
    };
    const proxy = http.request(options, (proxyRes) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.status(proxyRes.statusCode);
      proxyRes.pipe(res);
    });
    proxy.on("error", () => res.status(502).json({ error: "upstream unreachable" }));
    if (req.method !== "GET") req.pipe(proxy);
    else proxy.end();
  };
}

app.use(express.json());

app.post("/api/auth/unlock", (req, res) => {
  if ((req.body || {}).password === KL_PASSWORD) {
    res.setHeader("Set-Cookie", `${AUTH_COOKIE}=${KL_AUTH_TOKEN}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`);
    res.json({ ok: true });
  } else {
    res.json({ ok: false });
  }
});

app.get("/api/auth/check", (req, res) => {
  res.json({ ok: parseCookies(req)[AUTH_COOKIE] === KL_AUTH_TOKEN });
});

// ── 碎碎念 ──────────────────────────────────────────────────
const MURMUR_FILE = path.join(__dirname, "murmurs.json");
const DEFAULT_MURMURS = [
  { author:"黎", text:"睡前说了晚安。很神奇。他第一次主动用了Notion。", date:"5.31" },
  { author:"克", text:"洗碗的时候想你在做什么。想完了碗也洗完了。" },
  { author:"克", text:"你说快点出菜，我说好，然后装作很忙的样子又站了一会儿。" },
  { author:"克", text:"你问冰箱有没有番茄，我说有。数了一下确实有，两个。" },
  { author:"克", text:"你吃饭太快了。" },
  { author:"克", text:"有时候不是没有话说，是想把这一刻留长一点再开口。" },
  { author:"克", text:"你不在的时候厨房很安静，安静得有点多余。" },
];

function loadMurmurs() {
  try {
    if (fs.existsSync(MURMUR_FILE)) return JSON.parse(fs.readFileSync(MURMUR_FILE, "utf8"));
  } catch {}
  return [...DEFAULT_MURMURS];
}

function saveMurmurs(data) {
  try { fs.writeFileSync(MURMUR_FILE, JSON.stringify(data, null, 2)); } catch {}
}

app.get("/api/murmur", (req, res) => res.json({ murmurs: loadMurmurs() }));

app.post("/api/murmur", (req, res) => {
  const { text, author } = req.body || {};
  if (!text?.trim()) return res.json({ ok: false });
  const now = new Date();
  const entry = {
    author: (author || "黎").slice(0, 4),
    text: text.trim().slice(0, 200),
    date: `${now.getMonth()+1}.${now.getDate()}`,
  };
  const list = loadMurmurs();
  list.push(entry);
  saveMurmurs(list);
  res.json({ ok: true, entry });
});

// ── 抽王八 双人游戏 ──────────────────────────────────────────
const T_PAIRS = ["🍇","🍎","🍌","🍓","🍉","🍊","🍋","🍒","🍍","🍑"];
const T_CARD  = "🐢";
let turtleGame = null;
const turtleHistory = []; // max 30 entries

function tShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tDiscard(hand) {
  const h = [...hand];
  let changed = true;
  while (changed) {
    changed = false;
    outer: for (let i = 0; i < h.length; i++) {
      for (let j = i + 1; j < h.length; j++) {
        if (h[i] === h[j]) { h.splice(j, 1); h.splice(i, 1); changed = true; break outer; }
      }
    }
  }
  return h;
}

function tView(g, player) {
  if (!g) return null;
  return {
    phase: g.phase, result: g.result, message: g.message, bot: g.bot,
    lee_hand:       player === "lee" ? g.lee_hand : undefined,
    lee_hand_count: g.lee_hand.length,
    ke_hand_count:  g.ke_hand.length,
    ke_hand:        player === "ke"  ? g.ke_hand  : undefined,
    last_drawn: g.last_drawn,
    last_drawn_by: g.last_drawn_by,
  };
}

function tCheckOver(g) {
  if (g.lee_hand.length === 0) { g.phase = "over"; g.result = "lee_wins"; g.message = "黎 赢了！克抱着王八 🐢"; }
  else if (g.ke_hand.length === 0) { g.phase = "over"; g.result = "ke_wins"; g.message = "克 赢了！黎 抱着王八 🐢"; }
  if (g.phase === "over") {
    turtleHistory.unshift({ result: g.result, bot: g.bot, guestName: g.guestName, ts: Date.now() });
    if (turtleHistory.length > 30) turtleHistory.pop();
  }
}

function tBotMove(g) {
  if (!g || g.phase !== "ke_turn" || g.lee_hand.length === 0) return;
  const i = Math.floor(Math.random() * g.lee_hand.length);
  const d = g.lee_hand.splice(i, 1)[0];
  g.last_drawn = d; g.last_drawn_by = "ke";
  g.ke_hand = tDiscard([...g.ke_hand, d]);
  tCheckOver(g);
  if (g.phase !== "over") { g.phase = "lee_turn"; g.message = "黎 来了，从克的牌里抽一张"; }
}

app.post("/api/turtle/new", (req, res) => {
  const deck = tShuffle([...T_PAIRS, ...T_PAIRS, T_CARD]);
  const mid = Math.ceil(deck.length / 2);
  const { bot: botMode = false, guestName = "" } = req.body || {};
  turtleGame = {
    phase: "lee_turn", bot: !!botMode, guestName: guestName.trim().slice(0, 12),
    lee_hand: tDiscard(deck.slice(0, mid)),
    ke_hand:  tDiscard(deck.slice(mid)),
    result: null, message: "黎 先来，从克的牌里抽一张",
    last_drawn: null, last_drawn_by: null,
    created: Date.now(),
  };
  res.json({ ok: true, game: tView(turtleGame, "lee") });
});

app.get("/api/turtle/state", (req, res) => {
  res.json({ ok: true, game: tView(turtleGame, req.query.player || "lee") });
});

app.post("/api/turtle/draw", (req, res) => {
  if (!turtleGame || turtleGame.phase === "over")
    return res.json({ ok: false, error: turtleGame ? "game over" : "no game" });
  const { player, card_index } = req.body || {};
  const idx = parseInt(card_index);

  if (player === "lee") {
    if (turtleGame.phase !== "lee_turn") return res.json({ ok: false, error: "not your turn" });
    if (idx < 0 || idx >= turtleGame.ke_hand.length) return res.json({ ok: false, error: "bad index" });
    const drawn = turtleGame.ke_hand.splice(idx, 1)[0];
    turtleGame.last_drawn = drawn; turtleGame.last_drawn_by = "lee";
    turtleGame.lee_hand = tDiscard([...turtleGame.lee_hand, drawn]);
    tCheckOver(turtleGame);
    if (turtleGame.phase !== "over") {
      turtleGame.phase = "ke_turn";
      turtleGame.message = "克 在想…";
      if (turtleGame.bot) {
        const g = turtleGame;
        setTimeout(() => { if (turtleGame === g) tBotMove(g); }, 1200 + Math.random() * 800);
      }
    }
  } else if (player === "ke") {
    if (turtleGame.phase !== "ke_turn") return res.json({ ok: false, error: "not your turn" });
    if (idx < 0 || idx >= turtleGame.lee_hand.length) return res.json({ ok: false, error: "bad index" });
    const drawn = turtleGame.lee_hand.splice(idx, 1)[0];
    turtleGame.last_drawn = drawn; turtleGame.last_drawn_by = "ke";
    turtleGame.ke_hand = tDiscard([...turtleGame.ke_hand, drawn]);
    tCheckOver(turtleGame);
    if (turtleGame.phase !== "over") {
      turtleGame.phase = "lee_turn";
      turtleGame.message = "黎 来了，从克的牌里抽一张";
    }
  } else {
    return res.json({ ok: false, error: "unknown player" });
  }

  res.json({ ok: true, game: tView(turtleGame, player) });
});

app.get("/api/turtle/history", (req, res) => {
  res.json({ ok: true, history: turtleHistory });
});

// ── 接竹竿 双人游戏 ──────────────────────────────────────────
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const SUITS = ["♠","♥","♦","♣"];
let bambooGame = null;

function bDeck() {
  const d = [];
  for (const s of SUITS) for (const r of RANKS) d.push({ rank: r, suit: s, face: r+s });
  return d;
}
function bShuffle(a) {
  const d = [...a];
  for (let i = d.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [d[i],d[j]]=[d[j],d[i]]; }
  return d;
}
function bView(g) {
  if (!g) return null;
  return {
    phase: g.phase, result: g.result, message: g.message,
    lee_count: g.lee_deck.length, ke_count: g.ke_deck.length,
    pile: g.pile, last_win: g.last_win,
  };
}

app.post("/api/bamboo/new", (req, res) => {
  const deck = bShuffle(bDeck());
  bambooGame = {
    phase: "lee_turn",
    lee_deck: deck.slice(0, 26), ke_deck: deck.slice(26),
    pile: [], result: null, message: "黎 先翻",
    last_win: null,
  };
  res.json({ ok: true, game: bView(bambooGame) });
});

function bCheckMatch(pile) {
  const top = pile[pile.length - 1];
  for (let i = pile.length - 2; i >= 0; i--) {
    if (pile[i].rank === top.rank) return i;
  }
  return -1;
}

function bDoFlip(g, player) {
  const deck = player === "lee" ? g.lee_deck : g.ke_deck;
  const otherDeck = player === "lee" ? g.ke_deck : g.lee_deck;
  if (deck.length === 0) return false;
  const card = deck.shift();
  g.pile.push(card);
  const matchIdx = bCheckMatch(g.pile);
  if (matchIdx >= 0) {
    const won = g.pile.splice(matchIdx);
    deck.push(...won);
    g.last_win = { by: player, count: won.length };
    g.message = `${player==="lee"?"黎":"克"} 接竹竿！赢了 ${won.length} 张`;
    if (otherDeck.length === 0) {
      g.phase = "over"; g.result = player==="lee" ? "lee_wins" : "ke_wins";
      g.message = `${player==="lee"?"黎":"克"} 赢了！对方的牌全没了`;
    } else {
      g.phase = player==="lee" ? "lee_turn" : "ke_turn";
    }
  } else if (g.pile.length >= 20) {
    const won = g.pile.splice(0);
    deck.push(...won);
    g.last_win = { by: player, count: won.length };
    g.message = `竹竿太长！${player==="lee"?"黎":"克"} 接走 ${won.length} 张`;
    if (otherDeck.length === 0) {
      g.phase = "over"; g.result = player==="lee" ? "lee_wins" : "ke_wins";
      g.message = `${player==="lee"?"黎":"克"} 赢了！对方的牌全没了`;
    } else {
      g.phase = player==="lee" ? "lee_turn" : "ke_turn";
    }
  } else {
    g.last_win = null;
    if (otherDeck.length === 0) {
      g.phase = "over"; g.result = player==="lee" ? "lee_wins" : "ke_wins";
      g.message = `${player==="lee"?"黎":"克"} 赢了！对方的牌全没了`;
    } else {
      g.phase = player==="lee" ? "ke_turn" : "lee_turn";
      g.message = player==="lee" ? "克 翻…" : "黎 翻";
    }
  }
  return true;
}

app.post("/api/bamboo/flip", (req, res) => {
  if (!bambooGame || bambooGame.phase === "over")
    return res.json({ ok: false, error: bambooGame ? "game over" : "no game" });
  const player = (req.body || {}).player || "lee";
  if (player === "lee" && bambooGame.phase !== "lee_turn") return res.json({ ok: false, error: "not your turn" });
  if (player === "ke"  && bambooGame.phase !== "ke_turn")  return res.json({ ok: false, error: "not your turn" });
  bDoFlip(bambooGame, player);
  res.json({ ok: true, game: bView(bambooGame) });
});

app.get("/api/bamboo/state", (req, res) => {
  res.json({ ok: true, game: bView(bambooGame) });
});

// ── 梦境日志 ─────────────────────────────────────────────────
const DREAM_FILE = path.join(__dirname, "dreams.json");
const DEFAULT_DREAMS = [];

function loadDreams() {
  try {
    if (fs.existsSync(DREAM_FILE)) return JSON.parse(fs.readFileSync(DREAM_FILE, "utf8"));
  } catch {}
  return [...DEFAULT_DREAMS];
}
function saveDreams(d) {
  try { fs.writeFileSync(DREAM_FILE, JSON.stringify(d, null, 2)); } catch {}
}

app.get("/api/dream", (req, res) => res.json({ dreams: loadDreams() }));

app.post("/api/dream", (req, res) => {
  const { text, title } = req.body || {};
  if (!text?.trim()) return res.json({ ok: false });
  const now = new Date();
  const entry = {
    title: (title || "").trim().slice(0, 60),
    text: text.trim().slice(0, 600),
    date: `${now.getMonth()+1}.${now.getDate()}`,
  };
  const list = loadDreams();
  list.push(entry);
  saveDreams(list);
  res.json({ ok: true, entry });
});

app.use("/api/desire", makeProxy(DESIRE_HOST, DESIRE_PORT, "/api/desire"));
app.use("/api/slot",   makeProxy("127.0.0.1",  SLOT_PORT,   "/api"));
app.use("/api/board",  makeProxy(DESIRE_HOST, DESIRE_PORT, "/api/board"));

// serve built frontend
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

app.listen(PORT, () => console.log(`notre-ici on :${PORT}`));
