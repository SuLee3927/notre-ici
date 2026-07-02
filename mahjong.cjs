// 麻将游戏引擎 — Phase 1: 摸打碰杠胡

const SUITS = {
  w: { name: "万", values: [1,2,3,4,5,6,7,8,9] },
  t: { name: "条", values: [1,2,3,4,5,6,7,8,9] },
  p: { name: "筒", values: [1,2,3,4,5,6,7,8,9] },
  f: { name: "风", values: [1,2,3,4], labels: ["东","南","西","北"] },
  j: { name: "箭", values: [1,2,3], labels: ["中","发","白"] },
};

function tileLabel(tile) {
  const s = tile.slice(-1), v = parseInt(tile.slice(0,-1));
  if (s === "w") return ["一","二","三","四","五","六","七","八","九"][v-1] + "万";
  if (s === "t") return ["一","二","三","四","五","六","七","八","九"][v-1] + "条";
  if (s === "p") return ["一","二","三","四","五","六","七","八","九"][v-1] + "筒";
  if (s === "f") return SUITS.f.labels[v-1];
  if (s === "j") return SUITS.j.labels[v-1];
  return tile;
}

function buildDeck() {
  const deck = [];
  for (const [s, info] of Object.entries(SUITS)) {
    for (const v of info.values) {
      for (let i = 0; i < 4; i++) deck.push(`${v}${s}`);
    }
  }
  return deck;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sortHand(hand) {
  const order = { w: 0, t: 1, p: 2, f: 3, j: 4 };
  return [...hand].sort((a, b) => {
    const sa = a.slice(-1), sb = b.slice(-1);
    if (order[sa] !== order[sb]) return order[sa] - order[sb];
    return parseInt(a) - parseInt(b);
  });
}

function countTiles(hand) {
  const c = {};
  for (const t of hand) c[t] = (c[t] || 0) + 1;
  return c;
}

function canWin(hand) {
  if (hand.length % 3 !== 2) return false;
  const counts = countTiles(hand);
  const unique = Object.keys(counts).sort();
  for (const pair of unique) {
    if (counts[pair] < 2) continue;
    const rem = { ...counts };
    rem[pair] -= 2;
    if (rem[pair] === 0) delete rem[pair];
    if (canFormMelds(rem)) return true;
  }
  return false;
}

function canFormMelds(counts) {
  const keys = Object.keys(counts).sort();
  if (keys.length === 0) return true;
  const first = keys[0];
  const s = first.slice(-1), v = parseInt(first);
  if (counts[first] >= 3) {
    const rem = { ...counts };
    rem[first] -= 3;
    if (rem[first] === 0) delete rem[first];
    if (canFormMelds(rem)) return true;
  }
  if (["w","t","p"].includes(s) && v <= 7) {
    const t2 = `${v+1}${s}`, t3 = `${v+2}${s}`;
    if (counts[t2] && counts[t3]) {
      const rem = { ...counts };
      rem[first]--; if (rem[first] === 0) delete rem[first];
      rem[t2]--; if (rem[t2] === 0) delete rem[t2];
      rem[t3]--; if (rem[t3] === 0) delete rem[t3];
      if (canFormMelds(rem)) return true;
    }
  }
  return false;
}

function canPong(hand, tile) { return hand.filter(t => t === tile).length >= 2; }
function canKong(hand, tile) { return hand.filter(t => t === tile).length >= 3; }
function canWinOnDiscard(hand, tile) { return canWin([...hand, tile]); }

function canSelfKong(hand, melds) {
  const counts = countTiles(hand);
  for (const [t, c] of Object.entries(counts)) {
    if (c === 4) return t;
  }
  for (const m of melds) {
    if (m.type === "pong" && counts[m.tiles[0]]) return m.tiles[0];
  }
  return null;
}

function createGame(mode = "du") {
  const deck = shuffle(buildDeck());
  const duIsAI = mode !== "du";
  const players = [
    { name: "小黎", hand: [], melds: [], discards: [], isAI: false },
    { name: "笃",   hand: [], melds: [], discards: [], isAI: duIsAI },
    { name: "西家", hand: [], melds: [], discards: [], isAI: true },
    { name: "北家", hand: [], melds: [], discards: [], isAI: true },
  ];
  for (let round = 0; round < 13; round++) {
    for (let p = 0; p < 4; p++) players[p].hand.push(deck.pop());
  }
  players[0].hand.push(deck.pop());
  for (const p of players) p.hand = sortHand(p.hand);

  return {
    id: Date.now().toString(36),
    wall: deck,
    players,
    currentPlayer: 0,
    phase: "discard",
    lastDiscard: null,
    lastDiscardBy: null,
    winner: null,
    turnCount: 0,
    pendingClaims: [],
    claimResponses: {},
  };
}

function aiChooseDiscard(player) {
  const hand = player.hand;
  const counts = countTiles(hand);
  const scores = hand.map(t => {
    let score = 0;
    const s = t.slice(-1), v = parseInt(t);
    if (counts[t] >= 3) score += 6;
    else if (counts[t] === 2) score += 3;
    if (["w","t","p"].includes(s)) {
      if (counts[`${v-1}${s}`]) score += 1;
      if (counts[`${v+1}${s}`]) score += 1;
      if (v >= 2 && v <= 8) score += 0.5;
    }
    return { tile: t, score };
  });
  scores.sort((a, b) => a.score - b.score);
  return scores[0].tile;
}

function processDiscard(game, playerIdx, tile) {
  const player = game.players[playerIdx];
  const idx = player.hand.indexOf(tile);
  if (idx === -1) return { error: "手里没这张牌" };

  player.hand.splice(idx, 1);
  player.discards.push(tile);
  game.lastDiscard = tile;
  game.lastDiscardBy = playerIdx;

  const claims = [];
  for (let i = 0; i < 4; i++) {
    if (i === playerIdx) continue;
    const p = game.players[i];
    const opts = [];
    if (canWinOnDiscard(p.hand, tile)) opts.push("hu");
    if (canKong(p.hand, tile)) opts.push("kong");
    if (canPong(p.hand, tile)) opts.push("pong");
    if (opts.length) claims.push({ player: i, options: opts });
  }

  if (!claims.length) return advanceTurn(game);

  // AI auto-claim: hu immediately
  for (const c of claims) {
    if (game.players[c.player].isAI && c.options.includes("hu")) {
      const p = game.players[c.player];
      p.hand.push(tile);
      p.hand = sortHand(p.hand);
      game.phase = "finished";
      game.winner = c.player;
      game.lastDiscard = null;
      return { event: "win", winner: c.player, winnerName: p.name };
    }
  }

  // check if any human has claims
  const humanClaims = claims.filter(c => !game.players[c.player].isAI);
  const aiClaims = claims.filter(c => game.players[c.player].isAI);

  if (humanClaims.length) {
    game.phase = "claim";
    game.pendingClaims = humanClaims;
    game.claimResponses = {};
    game.aiClaims = aiClaims;
    return { event: "claim_available", claims: humanClaims };
  }

  // only AI claims, auto-resolve
  return resolveAIClaims(game, aiClaims, tile);
}

function resolveAIClaims(game, aiClaims, tile) {
  for (const ac of aiClaims) {
    const p = game.players[ac.player];
    if (ac.options.includes("kong")) {
      for (let i = 0; i < 3; i++) { const idx = p.hand.indexOf(tile); p.hand.splice(idx, 1); }
      p.melds.push({ type: "kong", tiles: [tile, tile, tile, tile] });
      game.lastDiscard = null;
      game.currentPlayer = ac.player;
      if (game.wall.length) {
        p.hand.push(game.wall.pop());
        p.hand = sortHand(p.hand);
        if (canWin(p.hand)) {
          game.phase = "finished";
          game.winner = ac.player;
          return { event: "win", winner: ac.player, winnerName: p.name, afterKong: true };
        }
      }
      game.phase = "discard";
      const d = aiChooseDiscard(p);
      return processDiscard(game, ac.player, d);
    }
    if (ac.options.includes("pong") && Math.random() > 0.4) {
      for (let i = 0; i < 2; i++) { const idx = p.hand.indexOf(tile); p.hand.splice(idx, 1); }
      p.melds.push({ type: "pong", tiles: [tile, tile, tile] });
      game.lastDiscard = null;
      game.currentPlayer = ac.player;
      game.phase = "discard";
      const d = aiChooseDiscard(p);
      return processDiscard(game, ac.player, d);
    }
  }
  return advanceTurn(game);
}

function handleClaim(game, playerIdx, action) {
  if (game.phase !== "claim") return { error: "现在不能碰杠" };
  const pending = game.pendingClaims.find(c => c.player === playerIdx);
  if (!pending) return { error: "你没有可用操作" };
  if (game.claimResponses[playerIdx]) return { error: "你已经做过选择了" };

  const tile = game.lastDiscard;
  const p = game.players[playerIdx];

  if (action === "pass") {
    game.claimResponses[playerIdx] = "pass";
  } else if (action === "hu") {
    if (!canWinOnDiscard(p.hand, tile)) return { error: "不能胡" };
    p.hand.push(tile);
    p.hand = sortHand(p.hand);
    game.phase = "finished";
    game.winner = playerIdx;
    game.lastDiscard = null;
    game.pendingClaims = [];
    return { event: "win", winner: playerIdx, winnerName: p.name };
  } else if (action === "kong") {
    if (!canKong(p.hand, tile)) return { error: "不能杠" };
    game.claimResponses[playerIdx] = "kong";
  } else if (action === "pong") {
    if (!canPong(p.hand, tile)) return { error: "不能碰" };
    game.claimResponses[playerIdx] = "pong";
  } else {
    return { error: "未知操作" };
  }

  // check if all humans have responded
  const allResponded = game.pendingClaims.every(c => game.claimResponses[c.player]);
  if (!allResponded) return { event: "waiting", waitingFor: game.pendingClaims.filter(c => !game.claimResponses[c.player]).map(c => c.player) };

  // resolve: pick highest priority claim
  return resolveClaims(game);
}

function resolveClaims(game) {
  const tile = game.lastDiscard;
  const priority = { hu: 3, kong: 2, pong: 1 };

  // combine human responses with AI claims
  let bestAction = null, bestPlayer = null, bestPriority = 0;

  for (const c of game.pendingClaims) {
    const resp = game.claimResponses[c.player];
    if (resp && resp !== "pass" && priority[resp] > bestPriority) {
      bestPriority = priority[resp];
      bestAction = resp;
      bestPlayer = c.player;
    }
  }

  // also check AI claims
  const aiClaims = game.aiClaims || [];
  for (const c of aiClaims) {
    for (const opt of c.options) {
      if (opt === "pong" && Math.random() < 0.4) continue;
      if (priority[opt] > bestPriority) {
        bestPriority = priority[opt];
        bestAction = opt;
        bestPlayer = c.player;
      }
    }
  }

  game.pendingClaims = [];
  game.claimResponses = {};
  game.aiClaims = [];

  if (!bestAction) return advanceTurn(game);

  const p = game.players[bestPlayer];

  if (bestAction === "kong") {
    for (let i = 0; i < 3; i++) { const idx = p.hand.indexOf(tile); p.hand.splice(idx, 1); }
    p.melds.push({ type: "kong", tiles: [tile, tile, tile, tile] });
    game.lastDiscard = null;
    game.currentPlayer = bestPlayer;
    if (game.wall.length) {
      p.hand.push(game.wall.pop());
      p.hand = sortHand(p.hand);
      if (canWin(p.hand)) {
        if (p.isAI) {
          game.phase = "finished";
          game.winner = bestPlayer;
          return { event: "win", winner: bestPlayer, winnerName: p.name, afterKong: true };
        }
        game.phase = "self_win_available";
        game.selfWinPlayer = bestPlayer;
        return { event: "self_win_available", player: bestPlayer };
      }
    }
    if (p.isAI) {
      game.phase = "discard";
      const d = aiChooseDiscard(p);
      return processDiscard(game, bestPlayer, d);
    }
    game.phase = "discard";
    return { event: "your_turn_after_kong", player: bestPlayer };
  }

  if (bestAction === "pong") {
    for (let i = 0; i < 2; i++) { const idx = p.hand.indexOf(tile); p.hand.splice(idx, 1); }
    p.melds.push({ type: "pong", tiles: [tile, tile, tile] });
    game.lastDiscard = null;
    game.currentPlayer = bestPlayer;
    if (p.isAI) {
      game.phase = "discard";
      const d = aiChooseDiscard(p);
      return processDiscard(game, bestPlayer, d);
    }
    game.phase = "discard";
    return { event: "your_turn_after_pong", player: bestPlayer };
  }

  return advanceTurn(game);
}

function advanceTurn(game) {
  game.currentPlayer = (game.lastDiscardBy + 1) % 4;
  game.lastDiscard = null;
  game.turnCount++;

  if (!game.wall.length) {
    game.phase = "finished";
    game.winner = null;
    return { event: "draw_game" };
  }

  const p = game.players[game.currentPlayer];
  const drawn = game.wall.pop();
  p.hand.push(drawn);
  p.hand = sortHand(p.hand);

  if (canWin(p.hand)) {
    if (p.isAI) {
      game.phase = "finished";
      game.winner = game.currentPlayer;
      return { event: "win", winner: game.currentPlayer, winnerName: p.name, selfDraw: true };
    }
    game.phase = "self_win_available";
    game.selfWinPlayer = game.currentPlayer;
    return { event: "self_win_available", drawn, player: game.currentPlayer };
  }

  const sk = canSelfKong(p.hand, p.melds);

  if (p.isAI) {
    if (sk && Math.random() > 0.5) {
      const existing = p.melds.find(m => m.type === "pong" && m.tiles[0] === sk);
      if (existing) {
        const i = p.hand.indexOf(sk);
        p.hand.splice(i, 1);
        existing.type = "kong";
        existing.tiles.push(sk);
      } else {
        for (let i = 0; i < 4; i++) { const idx = p.hand.indexOf(sk); if (idx >= 0) p.hand.splice(idx, 1); }
        p.melds.push({ type: "kong", tiles: [sk, sk, sk, sk] });
      }
      if (game.wall.length) {
        p.hand.push(game.wall.pop());
        p.hand = sortHand(p.hand);
        if (canWin(p.hand)) {
          game.phase = "finished";
          game.winner = game.currentPlayer;
          return { event: "win", winner: game.currentPlayer, winnerName: p.name, afterKong: true };
        }
      }
    }
    game.phase = "discard";
    const d = aiChooseDiscard(p);
    return processDiscard(game, game.currentPlayer, d);
  }

  game.phase = "discard";
  return { event: "your_turn", drawn, player: game.currentPlayer, canSelfKong: sk || undefined };
}

function handleSelfWin(game, playerIdx, accept) {
  if (game.phase !== "self_win_available") return { error: "现在不能胡" };
  if (game.selfWinPlayer !== playerIdx) return { error: "不是你的自摸" };
  if (accept) {
    game.phase = "finished";
    game.winner = playerIdx;
    return { event: "win", winner: playerIdx, winnerName: game.players[playerIdx].name, selfDraw: true };
  }
  game.phase = "discard";
  return { event: "continue", player: playerIdx };
}

function getState(game, viewAs = 0) {
  const myPending = game.pendingClaims.find(c => c.player === viewAs);
  return {
    id: game.id,
    phase: game.phase,
    currentPlayer: game.currentPlayer,
    wallCount: game.wall.length,
    turnCount: game.turnCount,
    winner: game.winner,
    winnerName: game.winner !== null ? game.players[game.winner].name : null,
    lastDiscard: game.lastDiscard,
    lastDiscardBy: game.lastDiscardBy,
    selfWinPlayer: game.selfWinPlayer,
    myClaimOptions: (game.phase === "claim" && myPending && !game.claimResponses[viewAs]) ? myPending.options : null,
    waitingFor: game.phase === "claim" ? game.pendingClaims.filter(c => !game.claimResponses[c.player]).map(c => ({ player: c.player, name: game.players[c.player].name })) : null,
    players: game.players.map((p, i) => ({
      name: p.name,
      handCount: p.hand.length,
      hand: (i === viewAs || game.phase === "finished") ? p.hand : undefined,
      melds: p.melds,
      discards: p.discards,
      isAI: p.isAI,
    })),
  };
}

module.exports = { createGame, processDiscard, getState, handleClaim, handleSelfWin, sortHand, tileLabel, canSelfKong };
