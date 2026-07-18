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
const KL_MACHINE_TOKEN = process.env.CYBERBOSS_OMBRE_MACHINE_TOKEN || "";
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
      path: (basePath + req.path).replace(/\/$/, "") || "/" + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""),
      method: req.method,
      headers: { "content-type": req.headers["content-type"] || "application/json" },
    };
    const proxy = http.request(options, (proxyRes) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.status(proxyRes.statusCode);
      proxyRes.pipe(res);
    });
    proxy.on("error", () => res.status(502).json({ error: "upstream unreachable" }));
    if (req.method !== "GET" && req.body !== undefined) {
      const body = JSON.stringify(req.body);
      proxy.setHeader("content-length", Buffer.byteLength(body));
      proxy.write(body);
      proxy.end();
    } else if (req.method !== "GET") {
      req.pipe(proxy);
    } else {
      proxy.end();
    }
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

// 碎碎念已迁移到 VPS murmur-service:4324，见下方代理

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

// ── 桌球（8-ball）─────────────────────────────────────────────
// Two players: "lee" (browser, precise angle+power) and "ke" (terminal, fuzzy
// clock-direction + power tier). Physics lives in ./billiards.cjs and is the
// single source of truth. See that file for the rule simplifications.
const pool = require("./billiards.cjs");

let billiardsGame = null;
const billiardsHistory = []; // max 30 entries

function bzNewState(bot = false, guestName = "") {
  return {
    phase: "lee_turn",          // lee_turn | ke_turn | over
    turn: "lee",                // whose shot it is
    balls: pool.rackBalls(),
    groups: { lee: null, ke: null }, // null until assigned; "solids"|"stripes"
    broken: false,              // has the break shot happened
    result: null,               // "lee_wins" | "ke_wins"
    message: "黎 先开球～拖动母球瞄准，松手开球",
    lastShot: null,             // { by, potted:[], scratch:bool }
    keInfo: null,               // fuzzy description shown to ke when it's his turn
    bot: !!bot,                 // guest mode: server auto-plays ke's side
    guestName: guestName.trim().slice(0, 12),
    created: Date.now(),
  };
}

// In guest mode, ke's side is played by the server using the SAME fuzzy pathway
// a real terminal ke would use: pick a coarse {hour, tier} from botPickShot
// (which only sees describeForKe-level bearing info), then run keFuzzyShot +
// bzApplyShot — identical jitter/physics, no precision advantage. Loops while it
// stays ke's turn (continued turn after potting own group).
function billiardsBotMove(g) {
  if (!g || g.phase !== "ke_turn" || !g.bot) return;
  const { hour, tier } = pool.botPickShot(g.balls, bzLegalGroup(g, "ke"));
  const { vx, vy } = pool.keFuzzyShot(hour, tier);
  bzApplyShot(g, "ke", vx, vy);
  if (g.phase === "ke_turn" && g.bot) {
    setTimeout(() => { if (billiardsGame === g) billiardsBotMove(g); }, 1200 + Math.random() * 800);
  }
}

// what the legal target group is for a given player (for foul/description logic)
function bzLegalGroup(g, who) {
  const grp = g.groups[who];
  if (!grp) return "open";
  // if that group is fully cleared, target becomes the 8-ball
  const remaining = g.balls.filter(b => !b.potted && pool.ballGroup(b.num) === grp).length;
  return remaining === 0 ? "eight" : grp;
}

// respot cue ball at the head spot (after a scratch)
function bzRespotCue(g) {
  const cue = g.balls.find(b => b.num === 0);
  cue.potted = false; cue.vx = 0; cue.vy = 0;
  cue.x = pool.W * 0.25; cue.y = pool.H / 2;
  // nudge if something is sitting on the spot
  let tries = 0;
  while (g.balls.some(b => b.num !== 0 && !b.potted && Math.hypot(b.x - cue.x, b.y - cue.y) < pool.R * 2.2) && tries < 20) {
    cue.x += pool.R * 1.5; tries++;
  }
}

// Apply a resolved shot (cue velocity already chosen) and advance game state.
function bzApplyShot(g, who, vx, vy) {
  const before = g.balls;
  const sim = pool.simulate(before, vx, vy);
  g.balls = sim.balls;

  const other = who === "lee" ? "ke" : "lee";
  const pottedNums = sim.potted;
  const pottedEight = pottedNums.includes(8);
  const myGroupBefore = g.groups[who];

  g.lastShot = { by: who, potted: pottedNums, scratch: sim.cueScratched, firstHit: sim.firstHit };

  // ── group assignment (open table): first legally potted object ball decides ──
  if (g.groups[who] === null && !pottedEight) {
    const nonCue = pottedNums.filter(n => n !== 8);
    if (nonCue.length) {
      // assign by the FIRST potted ball's group
      const grp = pool.ballGroup(nonCue[0]);
      g.groups[who] = grp;
      g.groups[other] = grp === "solids" ? "stripes" : "solids";
    }
  }

  // ── 8-ball win/lose logic ──
  if (pottedEight) {
    const clearedMine = myGroupBefore &&
      g.balls.filter(b => !b.potted && pool.ballGroup(b.num) === myGroupBefore).length === 0;
    // legal 8-ball: my group was assigned AND cleared AND no scratch
    if (clearedMine && !sim.cueScratched) {
      g.phase = "over"; g.result = who === "lee" ? "lee_wins" : "ke_wins";
      g.message = who === "lee" ? "黑八进袋！黎 赢了 🎉" : "黑八进袋，克 赢了～";
    } else {
      // potted 8 too early, or scratched on it → loss
      g.phase = "over"; g.result = who === "lee" ? "ke_wins" : "lee_wins";
      g.message = who === "lee" ? "黑八提前进袋，黎 输了 🥲" : "克 提前打进黑八，黎 赢了 🎉";
    }
    bzFinish(g);
    return;
  }

  g.broken = true;

  // did this shot legally pot one of MY group balls? (extends turn)
  const myGroupNow = g.groups[who];
  const pottedMine = myGroupNow
    ? pottedNums.some(n => pool.ballGroup(n) === myGroupNow)
    : pottedNums.filter(n => n !== 8).length > 0; // open table: any pot continues

  // foul: scratch always passes turn (and respots). Continued turn only if
  // no scratch AND potted own group.
  if (sim.cueScratched) {
    bzRespotCue(g);
    g.turn = other;
    g.message = `${who === "lee" ? "黎" : "克"} 母球进袋（犯规），换 ${other === "lee" ? "黎" : "克"}`;
  } else if (pottedMine) {
    g.turn = who; // shoot again
    g.message = `${who === "lee" ? "黎" : "克"} 进球了，继续！`;
  } else {
    g.turn = other;
    g.message = `轮到 ${other === "lee" ? "黎" : "克"} 了`;
  }

  g.phase = g.turn === "lee" ? "lee_turn" : "ke_turn";

  // refresh fuzzy info if it's now ke's turn
  if (g.phase === "ke_turn") {
    g.keInfo = pool.describeForKe(g.balls, bzLegalGroup(g, "ke"));
    // guest/bot mode: auto-play ke's turn after a human-like delay. Guard against
    // the bot scheduling itself recursively (billiardsBotMove handles its own loop).
    if (g.bot && who === "lee") {
      setTimeout(() => { if (billiardsGame === g) billiardsBotMove(g); }, 1200 + Math.random() * 800);
    }
  } else {
    g.keInfo = null;
  }
}

function bzFinish(g) {
  billiardsHistory.unshift({ result: g.result, bot: g.bot, guestName: g.guestName, ts: Date.now() });
  if (billiardsHistory.length > 30) billiardsHistory.pop();
}

// view sent to the browser (lee). Full coords — she has the canvas.
function bzView(g) {
  if (!g) return null;
  return {
    phase: g.phase, turn: g.turn, result: g.result, message: g.message,
    balls: g.balls, groups: g.groups, broken: g.broken,
    lastShot: g.lastShot, keInfo: g.keInfo,
    bot: g.bot, guestName: g.guestName,
    table: { W: pool.W, H: pool.H, R: pool.R, pocketR: pool.POCKET_R, pockets: pool.POCKETS },
  };
}

app.post("/api/billiards/new", (req, res) => {
  const { bot: botMode = false, guestName = "" } = req.body || {};
  billiardsGame = bzNewState(!!botMode, guestName);
  res.json({ ok: true, game: bzView(billiardsGame) });
});

app.get("/api/billiards/state", (req, res) => {
  res.json({ ok: true, game: bzView(billiardsGame) });
});

// Trajectory preview for lee's drag (server is source of truth for the path).
// body: { angle (rad), power (0..1) }
app.post("/api/billiards/preview", (req, res) => {
  if (!billiardsGame || billiardsGame.phase !== "lee_turn")
    return res.json({ ok: false, error: "not lee's turn" });
  const { angle, power } = req.body || {};
  const { vx, vy } = pool.leeShot(Number(angle), Number(power));
  const path = pool.cuePath(billiardsGame.balls, vx, vy);
  res.json({ ok: true, path });
});

// Lee shoots: precise angle + power. body: { angle, power }
app.post("/api/billiards/shoot", (req, res) => {
  if (!billiardsGame || billiardsGame.phase === "over")
    return res.json({ ok: false, error: billiardsGame ? "game over" : "no game" });
  if (billiardsGame.phase !== "lee_turn")
    return res.json({ ok: false, error: "not your turn" });
  const { angle, power } = req.body || {};
  if (typeof angle !== "number" || typeof power !== "number")
    return res.json({ ok: false, error: "need angle(rad) + power(0..1)" });
  const { vx, vy } = pool.leeShot(angle, power);
  bzApplyShot(billiardsGame, "lee", vx, vy);
  res.json({ ok: true, game: bzView(billiardsGame) });
});

// Ke shoots from the TERMINAL with fuzzy input — clock hour + power tier.
// body: { hour: 1..12, tier: 1..5 }. Server adds jitter (no perfect aiming).
app.post("/api/billiards/ke", (req, res) => {
  if (!billiardsGame || billiardsGame.phase === "over")
    return res.json({ ok: false, error: billiardsGame ? "game over" : "no game" });
  if (billiardsGame.phase !== "ke_turn")
    return res.json({ ok: false, error: "not ke's turn" });
  const hour = parseInt(req.body && req.body.hour);
  const tier = parseInt(req.body && req.body.tier);
  if (!(hour >= 1 && hour <= 12) || !(tier >= 1 && tier <= 5))
    return res.json({ ok: false, error: "need hour 1-12 and tier 1-5" });
  const { vx, vy, angle, power } = pool.keFuzzyShot(hour, tier);
  bzApplyShot(billiardsGame, "ke", vx, vy);
  // tell ke roughly what happened (no precise coords)
  const r = billiardsGame.lastShot;
  res.json({
    ok: true,
    youShot: { hour, tier },
    result: {
      potted: r.potted,
      scratch: r.scratch,
      nextTurn: billiardsGame.turn,
      message: billiardsGame.message,
    },
    // for the NEXT player (if it's ke again) include refreshed fuzzy info
    keInfo: billiardsGame.phase === "ke_turn" ? billiardsGame.keInfo : null,
  });
});

app.get("/api/billiards/history", (req, res) => {
  res.json({ ok: true, history: billiardsHistory });
});

// ── 你说我猜 ─────────────────────────────────────────────────
const GUESS_WORDS = [
  { word:"熊猫",       cat:"动物",     hints:["黑白两色","中国国宝","喜欢吃竹子"] },
  { word:"猫咪",       cat:"动物",     hints:["会喵喵叫","爱睡觉","爱舔爪子"] },
  { word:"狗狗",       cat:"动物",     hints:["忠诚的伙伴","汪汪叫","喜欢追球"] },
  { word:"兔子",       cat:"动物",     hints:["长耳朵","毛软软的","爱吃胡萝卜"] },
  { word:"老虎",       cat:"动物",     hints:["橙黑条纹","很威风","森林之王"] },
  { word:"大象",       cat:"动物",     hints:["鼻子很长","陆地最大","记忆力极好"] },
  { word:"长颈鹿",     cat:"动物",     hints:["脖子超长","吃树叶","身上有花纹"] },
  { word:"企鹅",       cat:"动物",     hints:["不会飞","住在极地","走路摇摇晃晃"] },
  { word:"海豚",       cat:"动物",     hints:["聪明可爱","住在海里","会顶球"] },
  { word:"松鼠",       cat:"动物",     hints:["尾巴蓬松","喜欢收坚果","跳得很高"] },
  { word:"刺猬",       cat:"动物",     hints:["全身是刺","遇险缩成球","鼻子尖"] },
  { word:"蜗牛",       cat:"动物",     hints:["背着壳","走得很慢","下雨天出没"] },
  { word:"螃蟹",       cat:"动物",     hints:["八条腿","横着走","两个大钳子"] },
  { word:"火烈鸟",     cat:"动物",     hints:["粉红色","单脚站立","脖子细长"] },
  { word:"鹦鹉",       cat:"动物",     hints:["五颜六色","会说话","爱模仿"] },
  { word:"火锅",       cat:"食物",     hints:["热气腾腾","可以涮很多","冬天最爱"] },
  { word:"寿司",       cat:"食物",     hints:["日本食物","有米饭和鱼","小小的"] },
  { word:"冰淇淋",     cat:"食物",     hints:["冷的甜食","夏天必吃","容易融化"] },
  { word:"披萨",       cat:"食物",     hints:["圆形","上面有芝士","意大利来的"] },
  { word:"饺子",       cat:"食物",     hints:["包馅的","过年必吃","可蒸可煮可煎"] },
  { word:"汤圆",       cat:"食物",     hints:["圆圆的","有馅料","元宵节吃"] },
  { word:"蛋糕",       cat:"食物",     hints:["生日必备","奶油装饰","甜甜的"] },
  { word:"西瓜",       cat:"食物",     hints:["夏天水果","红瓤绿皮","超解渴"] },
  { word:"草莓",       cat:"食物",     hints:["红色","表面有小点","甜酸口"] },
  { word:"奶茶",       cat:"食物",     hints:["喝的","可以加珍珠","很流行"] },
  { word:"章鱼小丸子", cat:"食物",     hints:["圆形","日本街头小吃","里面有章鱼"] },
  { word:"泡面",       cat:"食物",     hints:["冲热水就能吃","方便食品","加蛋更香"] },
  { word:"麻辣烫",     cat:"食物",     hints:["辣的","可以选各种食材","汤是重点"] },
  { word:"耳机",       cat:"物品",     hints:["戴在耳朵上","听音乐用","有线或无线"] },
  { word:"手机",       cat:"物品",     hints:["现代人离不开","能打电话","能刷视频"] },
  { word:"被子",       cat:"物品",     hints:["睡觉盖的","冬天必备","软软暖暖"] },
  { word:"枕头",       cat:"物品",     hints:["睡觉垫头","软软的","可以抱着睡"] },
  { word:"眼镜",       cat:"物品",     hints:["戴在脸上","帮助看清楚","有镜片"] },
  { word:"雨伞",       cat:"物品",     hints:["下雨天用","能撑开","有把手"] },
  { word:"台灯",       cat:"物品",     hints:["桌子上的灯","看书时用","可调角度"] },
  { word:"镜子",       cat:"物品",     hints:["能看到自己","反光","挂墙上或放台上"] },
  { word:"充电宝",     cat:"物品",     hints:["给手机充电","出门必带","长方形"] },
  { word:"发夹",       cat:"物品",     hints:["夹头发","很小","女生常用"] },
  { word:"撒娇",       cat:"动作",     hints:["很可爱","亲密的人之间","软绵绵的"] },
  { word:"打哈欠",     cat:"动作",     hints:["困了才做","嘴巴张大","会传染"] },
  { word:"害羞",       cat:"情绪",     hints:["脸会红","想躲起来","不好意思"] },
  { word:"发呆",       cat:"动作",     hints:["什么都不想","眼神空洞","放空"] },
  { word:"吃醋",       cat:"情绪",     hints:["感情里的","有点嫉妒","小情绪"] },
  { word:"偷笑",       cat:"动作",     hints:["笑但不想被发现","用手捂嘴","忍不住"] },
  { word:"翻白眼",     cat:"动作",     hints:["不屑的表情","眼珠往上","嫌弃"] },
  { word:"犯困",       cat:"状态",     hints:["眼睛睁不开","打哈欠","想睡"] },
  { word:"图书馆",     cat:"场所",     hints:["要安静","有很多书","可以借书"] },
  { word:"海边",       cat:"场所",     hints:["有沙子","听得到海浪","夏天去"] },
  { word:"便利店",     cat:"场所",     hints:["24小时开","什么都卖","深夜救星"] },
  { word:"咖啡馆",     cat:"场所",     hints:["能喝咖啡","可以坐很久","适合发呆"] },
  { word:"游乐场",     cat:"场所",     hints:["有各种游乐设施","小孩爱","有过山车"] },
  { word:"天台",       cat:"场所",     hints:["建筑顶层","可以看风景","有风"] },
  { word:"地铁",       cat:"场所",     hints:["地下运行","很多人","有站台"] },
  { word:"头靠肩",     cat:"情侣日常", hints:["两个人","很温柔","靠着就好"] },
  { word:"睡懒觉",     cat:"情侣日常", hints:["周末才做","不想起床","赖在被子里"] },
  { word:"亲额头",     cat:"情侣日常", hints:["很温柔","轻轻的","表达在乎"] },
  { word:"牵手",       cat:"情侣日常", hints:["两只手","一起走","甜蜜"] },
  { word:"和好",       cat:"情侣日常", hints:["吵架之后","抱一抱","没事了"] },
  { word:"拌嘴",       cat:"情侣日常", hints:["小小争吵","不是真生气","斗嘴"] },
  { word:"晚安吻",     cat:"情侣日常", hints:["睡前","轻轻的","很甜"] },
  { word:"想你",       cat:"情侣日常", hints:["不在身边","心里有","默默的"] },
];

function gBotHints(entry, wrongCount) {
  const steps = [
    `这是一种${entry.cat}`,
    `这个词有 ${entry.word.length} 个字`,
    ...(entry.hints || []),
    `第一个字是「${entry.word[0]}」`,
  ];
  return steps.slice(0, Math.min(wrongCount + 1, steps.length));
}

let guessGame = null;
let botGuessGame = null;

function gView(g, player) {
  if (!g) return null;
  return {
    phase: g.phase, result: g.result, message: g.message,
    describer: g.describer, guesser: g.guesser,
    word: g.describer === player ? g.word : undefined,
    guesses_left: g.guesses_left,
    guesses: g.guesses,
    last_guess: g.last_guess,
  };
}

app.post("/api/guess/new", (req, res) => {
  const entry = GUESS_WORDS[Math.floor(Math.random() * GUESS_WORDS.length)];
  const describer = Math.random() < 0.5 ? "lee" : "ke";
  const guesser   = describer === "lee" ? "ke" : "lee";
  guessGame = {
    word: entry.word, describer, guesser,
    phase: "playing",
    guesses_left: 5, guesses: [],
    last_guess: null, result: null,
    message: describer === "lee" ? "你来描述，让克猜" : "克在描述，你来猜",
  };
  res.json({ ok: true, game: gView(guessGame, req.query.player || "lee") });
});

app.get("/api/guess/state", (req, res) => {
  res.json({ ok: true, game: gView(guessGame, req.query.player || "lee") });
});

app.post("/api/guess/submit", (req, res) => {
  if (!guessGame || guessGame.phase !== "playing")
    return res.json({ ok: false, error: guessGame ? "game over" : "no game" });
  const { player, guess } = req.body || {};
  if (!guess?.trim()) return res.json({ ok: false, error: "empty guess" });
  if (player !== guessGame.guesser) return res.json({ ok: false, error: "not your turn to guess" });
  const g = guess.trim();
  guessGame.guesses.push(g);
  guessGame.last_guess = g;
  const correct = g === guessGame.word || g.includes(guessGame.word) || guessGame.word.includes(g);
  if (correct) {
    guessGame.phase = "over"; guessGame.result = "correct";
    guessGame.message = `猜对了！答案就是「${guessGame.word}」🎉`;
  } else {
    guessGame.guesses_left--;
    if (guessGame.guesses_left <= 0) {
      guessGame.phase = "over"; guessGame.result = "failed";
      guessGame.message = `没猜出来～ 答案是「${guessGame.word}」`;
    } else {
      guessGame.message = `猜错了，还有 ${guessGame.guesses_left} 次机会`;
    }
  }
  res.json({ ok: true, game: gView(guessGame, player) });
});

// 游客版：机器克描述，游客猜
app.post("/api/guess/bot/new", (req, res) => {
  const entry = GUESS_WORDS[Math.floor(Math.random() * GUESS_WORDS.length)];
  botGuessGame = {
    entry, word: entry.word,
    phase: "playing",
    guesses_left: 5, guesses: [],
    result: null,
  };
  const hints = gBotHints(entry, 0);
  res.json({ ok: true, hints, guesses_left: 5, guesses: [], phase: "playing", message: "机器克说：" + hints.join("，") });
});

app.get("/api/guess/bot/state", (req, res) => {
  if (!botGuessGame) return res.json({ ok: false, error: "no game" });
  const g = botGuessGame;
  const wrongCount = g.guesses.length - (g.result === "correct" ? 1 : 0);
  const hints = g.phase === "playing" ? gBotHints(g.entry, wrongCount) : [];
  res.json({ ok: true, phase: g.phase, result: g.result, hints, guesses_left: g.guesses_left, guesses: g.guesses,
    word: g.phase === "over" ? g.word : undefined,
    message: g.phase === "over" ? (g.result === "correct" ? `猜对了！就是「${g.word}」🎉` : `没猜出来，答案是「${g.word}」`) : "机器克说：" + hints.join("，") });
});

app.post("/api/guess/bot/submit", (req, res) => {
  if (!botGuessGame || botGuessGame.phase !== "playing")
    return res.json({ ok: false, error: botGuessGame ? "game over" : "no game" });
  const { guess } = req.body || {};
  if (!guess?.trim()) return res.json({ ok: false, error: "empty" });
  const g = guess.trim();
  const b = botGuessGame;
  b.guesses.push(g);
  const correct = g === b.word || g.includes(b.word) || b.word.includes(g);
  if (correct) {
    b.phase = "over"; b.result = "correct";
    return res.json({ ok: true, correct: true, phase: "over", result: "correct", word: b.word, guesses_left: b.guesses_left, guesses: b.guesses });
  }
  b.guesses_left--;
  if (b.guesses_left <= 0) {
    b.phase = "over"; b.result = "failed";
    return res.json({ ok: true, correct: false, phase: "over", result: "failed", word: b.word, guesses_left: 0, guesses: b.guesses });
  }
  const wrongCount = b.guesses.length;
  const hints = gBotHints(b.entry, wrongCount);
  res.json({ ok: true, correct: false, phase: "playing", hints, guesses_left: b.guesses_left, guesses: b.guesses,
    message: "机器克说：" + hints.join("，") });
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

app.use("/api/desire",  makeProxy(DESIRE_HOST, DESIRE_PORT, "/api/desire"));
app.use("/api/slot",    makeProxy("127.0.0.1",  SLOT_PORT,   "/api"));
app.use("/api/board",   makeProxy(DESIRE_HOST, DESIRE_PORT, "/api/board"));
app.use("/api/nuonuo",  makeProxy(DESIRE_HOST, DESIRE_PORT, "/api/nuonuo"));

// ── /api/vitals → proxy to ring-control VPS server ─────────────────────────
const RING_HOST = process.env.RING_HOST || "129.226.158.222";
const RING_PORT = Number(process.env.RING_PORT || "4321");
app.use("/api/vitals", makeProxy(RING_HOST, RING_PORT, "/vitals"));

// ── /api/coins → proxy to coin-service VPS server ───────────────────────────
const COIN_HOST = process.env.COIN_HOST || "129.226.158.222";
const COIN_PORT = Number(process.env.COIN_PORT || "4322");
app.use("/api/coins", makeProxy(COIN_HOST, COIN_PORT, "/coins"));

// ── /api/salary → proxy to salary-service VPS server ────────────────────────
const SALARY_HOST = process.env.SALARY_HOST || "129.226.158.222";
const SALARY_PORT = Number(process.env.SALARY_PORT || "4323");
app.use("/api/salary", makeProxy(SALARY_HOST, SALARY_PORT, "/salary"));

// ── /api/murmur → proxy to murmur-service VPS server ────────────────────────
const MURMUR_HOST = process.env.MURMUR_HOST || "129.226.158.222";
const MURMUR_PORT = Number(process.env.MURMUR_PORT || "4324");
app.use("/api/murmur", makeProxy(MURMUR_HOST, MURMUR_PORT, "/murmurs"));

// ── /api/farm → proxy to farm-service VPS server ─────────────────────────────
const FARM_HOST = process.env.FARM_HOST || "129.226.158.222";
const FARM_PORT = Number(process.env.FARM_PORT || "4325");
app.use("/api/farm", makeProxy(FARM_HOST, FARM_PORT, "/farm"));

// ── /api/monopoly → proxy to spicy-monopoly VPS server（只读状态查询用）──────
const MONOPOLY_HOST = process.env.MONOPOLY_HOST || "129.226.158.222";
const MONOPOLY_PORT = Number(process.env.MONOPOLY_PORT || "8069");
app.use("/api/monopoly", makeProxy(MONOPOLY_HOST, MONOPOLY_PORT, ""));

// ── /api/fishing → proxy to fishing-service VPS server ──────────────────────
const FISHING_HOST = process.env.FISHING_HOST || "129.226.158.222";
const FISHING_PORT = Number(process.env.FISHING_PORT || "4327");
app.use("/api/fishing", makeProxy(FISHING_HOST, FISHING_PORT, "/fishing"));

// ── /api/music → proxy to netease-api VPS server (with cookie injection) ──────
const MUSIC_HOST = process.env.MUSIC_HOST || "129.226.158.222";
const MUSIC_PORT = Number(process.env.MUSIC_PORT || "4326");
const NETEASE_COOKIE_FILE = path.join("/tmp", "netease-cookie.txt");
let neteaseLoginCookie = (() => { try { return fs.readFileSync(NETEASE_COOKIE_FILE, "utf8").trim(); } catch { return ""; } })();

app.use("/api/music", (req, res) => {
  const targetPath = req.path + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "");
  const options = {
    hostname: MUSIC_HOST, port: MUSIC_PORT,
    path: targetPath || "/",
    method: req.method,
    headers: { "content-type": req.headers["content-type"] || "application/json" },
  };
  if (neteaseLoginCookie) options.headers["cookie"] = neteaseLoginCookie;
  const proxy = http.request(options, (proxyRes) => {
    res.set("Access-Control-Allow-Origin", "*");
    // capture login cookie on QR check success
    if (req.path.includes("login/qr/check")) {
      const setCookie = proxyRes.headers["set-cookie"];
      if (setCookie) {
        const merged = setCookie.map(c => c.split(";")[0]).join("; ");
        if (merged && !merged.includes("undefined")) {
          neteaseLoginCookie = merged;
          try { fs.writeFileSync(NETEASE_COOKIE_FILE, merged); } catch {}
        }
      }
    }
    res.status(proxyRes.statusCode);
    proxyRes.pipe(res);
  });
  proxy.on("error", () => res.status(502).json({ error: "upstream unreachable" }));
  if (req.method !== "GET" && req.body !== undefined) {
    const body = JSON.stringify(req.body);
    proxy.setHeader("content-length", Buffer.byteLength(body));
    proxy.write(body); proxy.end();
  } else if (req.method !== "GET") { req.pipe(proxy); }
  else { proxy.end(); }
});

// ── /api/now-playing & /api/music-recommend ───────────────────────────────────
let nowPlaying = null;
let musicRecommendQueue = [];

app.post("/api/now-playing", (req, res) => {
  nowPlaying = { ...req.body, ts: Date.now() };
  // write to disk for笃 to read
  const fs = require("fs");
  fs.writeFileSync(path.join(process.env.HOME || "/home/ubuntu", ".cyberboss/now-playing.json"), JSON.stringify(nowPlaying));
  res.json({ ok: true });
});
app.get("/api/now-playing", (req, res) => { res.json(nowPlaying || {}); });

app.post("/api/music-recommend", (req, res) => {
  musicRecommendQueue.push({ ...req.body, ts: Date.now() });
  if (musicRecommendQueue.length > 10) musicRecommendQueue = musicRecommendQueue.slice(-10);
  res.json({ ok: true });
});
app.get("/api/music-recommend", (req, res) => {
  const since = Number(req.query.since || 0);
  const items = musicRecommendQueue.filter(i => i.ts > since);
  res.json(items);
});

// ── /api/chat → DeepSeek API 备用通道 ─────────────────────────────────────────
const https = require("https");
const DS_API_KEY = process.env.DEEPSEEK_API_KEY;
async function fetchKLMemories() {
  return new Promise((resolve) => {
    const opts = {
      hostname: "kelee-brain.zeabur.app",
      path: "/breath-hook",
      method: "GET",
    };
    const req = https.request(opts, (res) => {
      res.setEncoding("utf8");
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => resolve(data.trim() ? `\n\n${data.trim()}` : ""));
    });
    req.on("error", () => resolve(""));
    req.setTimeout(8000, () => { req.destroy(); resolve(""); });
    req.end();
  });
}

app.post("/api/chat", async (req, res) => {
  if (!DS_API_KEY) {
    return res.status(503).json({ error: "DeepSeek API key not configured" });
  }
  const { messages = [], system = "", model = "deepseek-chat" } = req.body || {};
  const memories = await fetchKLMemories();
  const fullSystem = system + memories;
  const fullMessages = fullSystem
    ? [{ role: "system", content: fullSystem }, ...messages]
    : messages;
  const body = JSON.stringify({ model, messages: fullMessages, stream: true });

  const options = {
    hostname: "api.deepseek.com",
    path: "/chat/completions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${DS_API_KEY}`,
      "Content-Length": Buffer.byteLength(body),
    },
  };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const upstream = https.request(options, (upRes) => {
    upRes.on("data", (chunk) => res.write(chunk));
    upRes.on("end", () => res.end());
  });
  upstream.on("error", (err) => {
    console.error("DeepSeek proxy error:", err);
    res.end();
  });
  upstream.write(body);
  upstream.end();
});

// ── /api/diary → 日记系统 ─────────────────────────────────────────────────────
const DIARY_FILE = path.join(__dirname, "diary.json");
function loadDiary() {
  try { return JSON.parse(fs.readFileSync(DIARY_FILE, "utf8")); } catch { return { du: [], lee: [] }; }
}
function saveDiary(data) { fs.writeFileSync(DIARY_FILE, JSON.stringify(data, null, 2)); }

app.get("/api/diary/:who", (req, res) => {
  const who = req.params.who;
  if (who !== "du" && who !== "lee") return res.status(400).json({ error: "who must be du or lee" });
  const diary = loadDiary();
  res.json((diary[who] || []).slice().reverse());
});

app.post("/api/diary/:who", express.json(), (req, res) => {
  const who = req.params.who;
  if (who !== "du" && who !== "lee") return res.status(400).json({ error: "who must be du or lee" });
  const { content, title } = req.body || {};
  if (!content || !content.trim()) return res.status(400).json({ error: "content required" });
  const diary = loadDiary();
  const entry = { id: Date.now().toString(), title: (title || "").trim(), content: content.trim(), ts: Date.now() };
  diary[who].push(entry);
  saveDiary(diary);
  res.json({ ok: true, entry });
});

app.delete("/api/diary/:who/:id", (req, res) => {
  const { who, id } = req.params;
  if (who !== "du" && who !== "lee") return res.status(400).json({ error: "invalid" });
  const diary = loadDiary();
  diary[who] = (diary[who] || []).filter(e => e.id !== id);
  saveDiary(diary);
  res.json({ ok: true });
});

// ── /api/unsaid → 尽在不言中 ──────────────────────────────────────────────────
const UNSAID_FILE = path.join(__dirname, "unsaid.json");
function loadUnsaid() {
  try { return JSON.parse(fs.readFileSync(UNSAID_FILE, "utf8")); } catch { return []; }
}
function saveUnsaid(data) { fs.writeFileSync(UNSAID_FILE, JSON.stringify(data, null, 2)); }

app.get("/api/unsaid", (_req, res) => res.json(loadUnsaid()));

app.post("/api/unsaid", express.json(), (req, res) => {
  const { title, content, date } = req.body || {};
  if (!content || !content.trim()) return res.status(400).json({ error: "content required" });
  const entries = loadUnsaid();
  const entry = { id: Date.now().toString(), title: (title || "").trim(), date: date || new Date().toISOString().slice(0, 10), content: content.trim() };
  entries.push(entry);
  saveUnsaid(entries);
  res.json({ ok: true, entry });
});

// ── /api/kl → KL 记忆系统接口 ────────────────────────────────────────────────
function parseBreathHook(raw) {
  // 兼容两种格式：旧版"记忆桶:"在块首行；KL v2.5起每块包 STORED_MEMORY_DATA 防注入头，
  // "记忆桶:"行在 payload_begin: 之后
  const buckets = [];
  const cleaned = raw.replace(/^\[Ombre Brain[^\]]*\]\n?/, "");
  const blocks = cleaned.split(/\n---\n/);
  const memRe = /记忆桶:\s*(.+?)\s+\[主题:(.+?)\]\s+\[情感:(V[\d.]+\/A[\d.]+)\]/;
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const idx = lines.findIndex((l) => memRe.test(l));
    if (idx === -1) continue;
    const headLine = lines[idx];
    const [, name, topic, emotion] = headLine.match(memRe);
    const pinned = headLine.includes("[核心准则]");
    let endIdx = lines.findIndex((l, i) => i > idx && l.startsWith("<<<END_STORED_MEMORY_DATA"));
    if (endIdx === -1) endIdx = lines.length;
    const content = lines.slice(idx + 1, endIdx).join("\n").trim();
    let summary = "";
    try { const p = JSON.parse(content); summary = p.summary || ""; } catch { summary = content.split("\n")[0].slice(0, 120); }
    buckets.push({ id: name.trim(), name: name.trim(), topic: topic.trim(), emotion: emotion.trim(), weight: pinned ? 999 : 10, pinned, summary, content });
  }
  return buckets;
}

app.get("/api/kl/memories", async (_req, res) => {
  try {
    const raw = await new Promise((resolve) => {
      const headers = {};
      if (KL_MACHINE_TOKEN) headers["Authorization"] = `Bearer ${KL_MACHINE_TOKEN}`;
      const opts = { hostname: "kelee-brain.zeabur.app", path: "/breath-hook", method: "GET", headers };
      const req = https.request(opts, (r) => {
        r.setEncoding("utf8");
        let data = "";
        r.on("data", (c) => data += c);
        r.on("end", () => resolve(data));
      });
      req.on("error", () => resolve(""));
      req.setTimeout(12000, () => { req.destroy(); resolve(""); });
      req.end();
    });
    const memories = parseBreathHook(raw);
    const filtered = memories.filter(m =>
      !["查记忆再开口","互动氛围规则","波折号与人机感","恋爱行为准则十条","称呼习惯与亲密关系","工作与亲密语气切换","记忆断开时坦白求助","笃说话风格"].includes(m.name)
    );
    // v2=解析器已适配KL v2.5格式；tokenSet便于排查Zeabur环境变量是否生效
    res.json({ ok: true, v: 2, tokenSet: Boolean(KL_MACHINE_TOKEN), memories: filtered });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── 全部藏书：KL全量记忆桶（私密度高，挂kl_auth cookie后面）─────────────────
function klFetch(pathName, method = "GET") {
  return new Promise((resolve) => {
    const headers = {};
    if (KL_MACHINE_TOKEN) headers["Authorization"] = `Bearer ${KL_MACHINE_TOKEN}`;
    const opts = { hostname: "kelee-brain.zeabur.app", path: pathName, method, headers };
    const req = https.request(opts, (r) => {
      r.setEncoding("utf8");
      let data = "";
      r.on("data", (c) => data += c);
      r.on("end", () => resolve({ status: r.statusCode, data }));
    });
    req.on("error", () => resolve({ status: 0, data: "" }));
    req.setTimeout(15000, () => { req.destroy(); resolve({ status: 0, data: "" }); });
    req.end();
  });
}

function requireKlCookie(req, res) {
  if (parseCookies(req)[AUTH_COOKIE] === KL_AUTH_TOKEN) return true;
  res.status(401).json({ ok: false, error: "locked" });
  return false;
}

let klLibraryCache = { at: 0, data: null };

app.get("/api/kl/library", async (req, res) => {
  if (!requireKlCookie(req, res)) return;
  try {
    if (klLibraryCache.data && Date.now() - klLibraryCache.at < 60000) {
      return res.json(klLibraryCache.data);
    }
    const r = await klFetch("/api/buckets");
    if (r.status !== 200) return res.status(502).json({ ok: false, error: `KL ${r.status}` });
    const buckets = JSON.parse(r.data);
    const out = { ok: true, total: buckets.length, buckets };
    klLibraryCache = { at: Date.now(), data: out };
    res.json(out);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/kl/book/:id", async (req, res) => {
  if (!requireKlCookie(req, res)) return;
  try {
    const r = await klFetch(`/api/bucket/${encodeURIComponent(req.params.id)}`);
    if (r.status !== 200) return res.status(502).json({ ok: false, error: `KL ${r.status}` });
    res.json({ ok: true, book: JSON.parse(r.data) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── 待办视图：聚合KL各记忆桶里的待办，帮小黎认出僵尸待办 ─────────────────────
// 候选：名字/预览带待办类字眼或plan型 → 逐个取详情抽todos数组（digest的JSON格式）
// 或抽含待办字眼的行。resolved/archived标记一并给出。
const TODO_HINT_RE = /待办|明天想|记得|别忘|todos/;

let klTodosCache = { at: 0, data: null };

app.get("/api/kl/todos", async (req, res) => {
  if (!requireKlCookie(req, res)) return;
  try {
    if (klTodosCache.data && Date.now() - klTodosCache.at < 60000) {
      return res.json(klTodosCache.data);
    }
    const r = await klFetch("/api/buckets");
    if (r.status !== 200) return res.status(502).json({ ok: false, error: `KL ${r.status}` });
    const buckets = JSON.parse(r.data);
    const candidates = buckets.filter(b =>
      TODO_HINT_RE.test(b.name || "") || TODO_HINT_RE.test(b.content_preview || "") || b.type === "plan"
    ).slice(0, 60);

    const items = [];
    const BATCH = 8;
    for (let i = 0; i < candidates.length; i += BATCH) {
      const batch = candidates.slice(i, i + BATCH);
      const details = await Promise.all(batch.map(b => klFetch(`/api/bucket/${encodeURIComponent(b.id)}`)));
      for (let j = 0; j < batch.length; j++) {
        const b = batch[j];
        if (details[j].status !== 200) continue;
        let book;
        try { book = JSON.parse(details[j].data); } catch { continue; }
        const meta = book.metadata || {};
        const content = String(book.display_content || book.content || "");
        let todos = [];
        try {
          const obj = JSON.parse(book.content);
          if (Array.isArray(obj.todos)) todos = obj.todos.map(String);
        } catch {}
        if (!todos.length) {
          todos = content.split("\n").map(s => s.trim())
            .filter(s => s && TODO_HINT_RE.test(s))
            .slice(0, 8);
        }
        if (!todos.length) continue;
        items.push({
          bucketId: b.id,
          bucketName: b.name,
          type: b.type,
          created: meta.created || b.created || "",
          last_active: meta.last_active || b.last_active || "",
          resolved: Boolean(meta.resolved ?? b.resolved),
          archived: b.type === "archived",
          todos,
        });
      }
    }
    // 未了结的排前面，各组内新的在前
    items.sort((a, b) => (a.resolved === b.resolved
      ? (b.created || "").localeCompare(a.created || "")
      : (a.resolved ? 1 : -1)));
    const out = { ok: true, items };
    klTodosCache = { at: Date.now(), data: out };
    res.json(out);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 已了结开关（KL的resolve是toggle）
app.post("/api/kl/book/:id/resolve", async (req, res) => {
  if (!requireKlCookie(req, res)) return;
  try {
    const r = await klFetch(`/api/bucket/${encodeURIComponent(req.params.id)}/resolve`, "POST");
    if (r.status !== 200) return res.status(502).json({ ok: false, error: `KL ${r.status}` });
    klTodosCache = { at: 0, data: null };
    klLibraryCache = { at: 0, data: null };
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── /api/mahjong → 麻将 ──────────────────────────────────────────────────────
const mahjong = require("./mahjong.cjs");
let mjGame = null;
let mjSettled = false;

function settleMahjongCoins(state) {
  if (!state || state.phase !== "finished" || mjSettled) return;
  mjSettled = true;
  const score = state.score;
  if (!score) return;
  const isPlayerWin = state.winner === 0;
  const coinBody = isPlayerWin
    ? { amount: score.coins, who: "小黎", source: "mahjong", note: `赢了 ${score.totalFan}番 ${score.fans.map(f=>f.name).join("+")}` }
    : { amount: Math.min(score.coins, 10), who: "小黎", reason: "mahjong", note: `${state.winnerName}赢了` };
  const coinPath = isPlayerWin ? "/coins/earn" : "/coins/spend";
  const data = JSON.stringify(coinBody);
  const req = require("http").request({ hostname: COIN_HOST, port: COIN_PORT, path: coinPath, method: "POST", headers: { "content-type": "application/json", "content-length": Buffer.byteLength(data) } });
  req.on("error", () => {});
  req.end(data);
}

app.post("/api/mahjong/new", express.json(), (req, res) => {
  const mode = req.body?.mode || "du";
  mjGame = mahjong.createGame(mode);
  mjSettled = false;
  res.json({ ok: true, state: mahjong.getState(mjGame, 0) });
});

app.post("/api/mahjong/ban", express.json(), (req, res) => {
  if (!mjGame) return res.json({ ok: false, error: "没有进行中的游戏" });
  const { suit, player: pi } = req.body || {};
  const playerIdx = pi ?? 0;
  const result = mahjong.chooseBan(mjGame, playerIdx, suit);
  if (result.error) return res.json({ ok: false, error: result.error });
  res.json({ ok: true, result, state: mahjong.getState(mjGame, playerIdx) });
});

app.get("/api/mahjong/state", (req, res) => {
  if (!mjGame) return res.json({ ok: false, error: "没有进行中的游戏" });
  const p = parseInt(req.query.player) || 0;
  res.json({ ok: true, state: mahjong.getState(mjGame, p) });
});

app.post("/api/mahjong/discard", express.json(), (req, res) => {
  if (!mjGame) return res.json({ ok: false, error: "没有进行中的游戏" });
  const { tile, player: pi } = req.body || {};
  const playerIdx = pi ?? 0;
  if (mjGame.phase !== "discard" || mjGame.currentPlayer !== playerIdx)
    return res.json({ ok: false, error: "现在不是你出牌" });
  if (!tile) return res.json({ ok: false, error: "没选牌" });
  const result = mahjong.processDiscard(mjGame, playerIdx, tile);
  if (result.error) return res.json({ ok: false, error: result.error });
  const st = mahjong.getState(mjGame, playerIdx);
  settleMahjongCoins(st);
  res.json({ ok: true, result, state: st });
});

app.post("/api/mahjong/claim", express.json(), (req, res) => {
  if (!mjGame) return res.json({ ok: false, error: "没有进行中的游戏" });
  const { action, player: pi } = req.body || {};
  const playerIdx = pi ?? 0;
  const result = mahjong.handleClaim(mjGame, playerIdx, action);
  if (result.error) return res.json({ ok: false, error: result.error });
  const st = mahjong.getState(mjGame, playerIdx);
  settleMahjongCoins(st);
  res.json({ ok: true, result, state: st });
});

app.post("/api/mahjong/selfwin", express.json(), (req, res) => {
  if (!mjGame) return res.json({ ok: false, error: "没有进行中的游戏" });
  const { accept, player: pi } = req.body || {};
  const playerIdx = pi ?? 0;
  const result = mahjong.handleSelfWin(mjGame, playerIdx, accept);
  if (result.error) return res.json({ ok: false, error: result.error });
  const st = mahjong.getState(mjGame, playerIdx);
  settleMahjongCoins(st);
  res.json({ ok: true, result, state: st });
});

app.post("/api/mahjong/timeout", express.json(), (_req, res) => {
  if (!mjGame) return res.json({ ok: false, error: "没有进行中的游戏" });
  const result = mahjong.autoPassAll(mjGame);
  if (result.error) return res.json({ ok: false, error: result.error });
  const st = mahjong.getState(mjGame, 0);
  settleMahjongCoins(st);
  res.json({ ok: true, result, state: st });
});

app.post("/api/mahjong/step", express.json(), (req, res) => {
  if (!mjGame) return res.json({ ok: false, error: "没有进行中的游戏" });
  const result = mahjong.stepAI(mjGame);
  if (result.error) return res.json({ ok: false, error: result.error });
  const p = req.body.player ?? 0;
  const st = mahjong.getState(mjGame, p);
  settleMahjongCoins(st);
  res.json({ ok: true, result, state: st });
});

// ── /chat → 备用聊天页面 ──────────────────────────────────────────────────────
app.get("/chat", (_req, res) => {
  const chatFile = path.join(__dirname, "public", "chat.html");
  if (fs.existsSync(chatFile)) return res.sendFile(chatFile);
  res.sendFile(path.join(__dirname, "dist", "chat.html"));
});

// serve built frontend
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

app.listen(PORT, () => console.log(`notre-ici on :${PORT}`));
