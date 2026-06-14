const express = require("express");
const path = require("path");
const http = require("http");

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

// ── 抽王八 双人游戏 ──────────────────────────────────────────
const T_PAIRS = ["🍇","🍎","🍌","🍓","🍉","🍊","🍋","🍒","🍍","🍑"];
const T_CARD  = "🐢";
let turtleGame = null;

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
    phase: g.phase, result: g.result, message: g.message,
    lee_hand: g.lee_hand,
    ke_hand_count: g.ke_hand.length,
    // ke sees own hand only when explicitly requesting ke view
    ke_hand: player === "ke" ? g.ke_hand : undefined,
    last_drawn: g.last_drawn,
    last_drawn_by: g.last_drawn_by,
  };
}

function tCheckOver(g) {
  if (g.lee_hand.length === 0) { g.phase = "over"; g.result = "lee_wins"; g.message = "黎 赢了！克抱着王八 🐢"; }
  else if (g.ke_hand.length === 0) { g.phase = "over"; g.result = "ke_wins"; g.message = "克 赢了！黎 抱着王八 🐢"; }
}

app.post("/api/turtle/new", (req, res) => {
  const deck = tShuffle([...T_PAIRS, ...T_PAIRS, T_CARD]);
  const mid = Math.ceil(deck.length / 2);
  turtleGame = {
    phase: "lee_turn",
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

app.use("/api/desire", makeProxy(DESIRE_HOST, DESIRE_PORT, "/api/desire"));
app.use("/api/slot",   makeProxy("127.0.0.1",  SLOT_PORT,   "/api"));
app.use("/api/board",  makeProxy(DESIRE_HOST, DESIRE_PORT, "/api/board"));

// serve built frontend
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

app.listen(PORT, () => console.log(`notre-ici on :${PORT}`));
