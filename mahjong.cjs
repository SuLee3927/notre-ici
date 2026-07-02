// 麻将游戏引擎 — Phase 1: 能摸打碰杠胡就行

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

  // try triplet
  if (counts[first] >= 3) {
    const rem = { ...counts };
    rem[first] -= 3;
    if (rem[first] === 0) delete rem[first];
    if (canFormMelds(rem)) return true;
  }

  // try sequence (only numbered suits)
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

function canPong(hand, tile) {
  return hand.filter(t => t === tile).length >= 2;
}

function canKong(hand, tile) {
  return hand.filter(t => t === tile).length >= 3;
}

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

function canWinOnDiscard(hand, tile) {
  return canWin([...hand, tile]);
}

function createGame() {
  const deck = shuffle(buildDeck());
  const players = [
    { name: "小黎", hand: [], melds: [], discards: [], isAI: false },
    { name: "南家",  hand: [], melds: [], discards: [], isAI: true },
    { name: "西家",  hand: [], melds: [], discards: [], isAI: true },
    { name: "北家",  hand: [], melds: [], discards: [], isAI: true },
  ];

  // deal 13 each
  for (let round = 0; round < 13; round++) {
    for (let p = 0; p < 4; p++) {
      players[p].hand.push(deck.pop());
    }
  }
  // dealer (player 0) draws 14th
  players[0].hand.push(deck.pop());

  for (const p of players) p.hand = sortHand(p.hand);

  return {
    id: Date.now().toString(36),
    wall: deck,
    players,
    currentPlayer: 0,
    phase: "discard", // discard | draw | claim | finished
    lastDiscard: null,
    lastDiscardBy: null,
    winner: null,
    turnCount: 0,
    claimOptions: null,
  };
}

function aiChooseDiscard(player) {
  // simple AI: discard isolated tiles first, keep pairs/sequences
  const hand = player.hand;
  const counts = countTiles(hand);

  // score each tile (lower = more likely to discard)
  const scores = hand.map(t => {
    let score = 0;
    const s = t.slice(-1), v = parseInt(t);
    const c = counts[t];
    if (c >= 3) score += 6;
    else if (c === 2) score += 3;

    if (["w","t","p"].includes(s)) {
      const prev = `${v-1}${s}`, next = `${v+1}${s}`;
      if (counts[prev]) score += 1;
      if (counts[next]) score += 1;
      if (v >= 2 && v <= 8) score += 0.5; // middle tiles slightly better
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

  // check if anyone can claim
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

  if (claims.length) {
    // AI auto-decide claims
    const humanClaims = claims.filter(c => !game.players[c.player].isAI);
    const aiClaims = claims.filter(c => game.players[c.player].isAI);

    for (const ac of aiClaims) {
      const p = game.players[ac.player];
      if (ac.options.includes("hu")) {
        // AI wins
        p.hand.push(tile);
        p.hand = sortHand(p.hand);
        game.phase = "finished";
        game.winner = ac.player;
        game.lastDiscard = null;
        return { event: "win", winner: ac.player, winnerName: p.name };
      }
    }

    if (humanClaims.length) {
      game.phase = "claim";
      game.claimOptions = humanClaims[0];
      return { event: "claim_available", options: humanClaims[0].options };
    }

    // AI pong/kong decisions (simple: always pong if possible)
    for (const ac of aiClaims) {
      const p = game.players[ac.player];
      if (ac.options.includes("kong")) {
        const removed = [];
        for (let i = p.hand.length - 1; i >= 0 && removed.length < 3; i--) {
          if (p.hand[i] === tile) { removed.push(p.hand.splice(i, 1)[0]); }
        }
        p.melds.push({ type: "kong", tiles: [tile, tile, tile, tile] });
        game.lastDiscard = null;
        game.currentPlayer = ac.player;
        // kong: draw from wall
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
        // AI discard after kong
        const d = aiChooseDiscard(p);
        return processDiscard(game, ac.player, d);
      }
      if (ac.options.includes("pong") && Math.random() > 0.4) {
        const removed = [];
        for (let i = p.hand.length - 1; i >= 0 && removed.length < 2; i--) {
          if (p.hand[i] === tile) { removed.push(p.hand.splice(i, 1)[0]); }
        }
        p.melds.push({ type: "pong", tiles: [tile, tile, tile] });
        game.lastDiscard = null;
        game.currentPlayer = ac.player;
        game.phase = "discard";
        const d = aiChooseDiscard(p);
        return processDiscard(game, ac.player, d);
      }
    }
  }

  // no claims, next player draws
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

  // check self-win
  if (canWin(p.hand)) {
    if (p.isAI) {
      game.phase = "finished";
      game.winner = game.currentPlayer;
      return { event: "win", winner: game.currentPlayer, winnerName: p.name, selfDraw: true };
    }
    // human can choose to win
    game.phase = "self_win_available";
    return { event: "self_win_available", drawn };
  }

  // check self-kong
  const sk = canSelfKong(p.hand, p.melds);

  if (p.isAI) {
    if (sk && Math.random() > 0.5) {
      // do self-kong
      const existing = p.melds.find(m => m.type === "pong" && m.tiles[0] === sk);
      if (existing) {
        const i = p.hand.indexOf(sk);
        p.hand.splice(i, 1);
        existing.type = "kong";
        existing.tiles.push(sk);
      } else {
        for (let i = 0; i < 4; i++) {
          const idx = p.hand.indexOf(sk);
          if (idx >= 0) p.hand.splice(idx, 1);
        }
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
  return { event: "your_turn", drawn, canSelfKong: sk || undefined };
}

function getState(game, viewAs = 0) {
  return {
    id: game.id,
    phase: game.phase,
    currentPlayer: game.currentPlayer,
    wallCount: game.wall.length,
    turnCount: game.turnCount,
    winner: game.winner,
    winnerName: game.winner !== null ? game.players[game.winner].name : null,
    claimOptions: game.phase === "claim" ? game.claimOptions : null,
    lastDiscard: game.lastDiscard,
    lastDiscardBy: game.lastDiscardBy,
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

function handleClaim(game, action) {
  if (game.phase !== "claim") return { error: "现在不能碰杠" };
  const tile = game.lastDiscard;
  const p = game.players[0]; // human is always 0

  if (action === "pass") {
    game.phase = "play";
    game.claimOptions = null;
    // check if AI wants to claim (already handled), just advance
    return advanceTurn(game);
  }

  if (action === "hu") {
    if (!canWinOnDiscard(p.hand, tile)) return { error: "不能胡" };
    p.hand.push(tile);
    p.hand = sortHand(p.hand);
    game.phase = "finished";
    game.winner = 0;
    game.lastDiscard = null;
    return { event: "win", winner: 0, winnerName: p.name };
  }

  if (action === "kong") {
    if (!canKong(p.hand, tile)) return { error: "不能杠" };
    for (let i = 0; i < 3; i++) {
      const idx = p.hand.indexOf(tile);
      p.hand.splice(idx, 1);
    }
    p.melds.push({ type: "kong", tiles: [tile, tile, tile, tile] });
    game.lastDiscard = null;
    game.claimOptions = null;
    game.currentPlayer = 0;
    // draw replacement
    if (game.wall.length) {
      p.hand.push(game.wall.pop());
      p.hand = sortHand(p.hand);
      if (canWin(p.hand)) {
        game.phase = "self_win_available";
        return { event: "self_win_available" };
      }
    }
    game.phase = "discard";
    return { event: "your_turn_after_kong" };
  }

  if (action === "pong") {
    if (!canPong(p.hand, tile)) return { error: "不能碰" };
    for (let i = 0; i < 2; i++) {
      const idx = p.hand.indexOf(tile);
      p.hand.splice(idx, 1);
    }
    p.melds.push({ type: "pong", tiles: [tile, tile, tile] });
    game.lastDiscard = null;
    game.claimOptions = null;
    game.currentPlayer = 0;
    game.phase = "discard";
    return { event: "your_turn_after_pong" };
  }

  return { error: "未知操作" };
}

function handleSelfWin(game, accept) {
  if (game.phase !== "self_win_available") return { error: "现在不能胡" };
  if (accept) {
    game.phase = "finished";
    game.winner = game.currentPlayer;
    return { event: "win", winner: game.currentPlayer, winnerName: game.players[game.currentPlayer].name, selfDraw: true };
  }
  game.phase = "discard";
  return { event: "continue" };
}

module.exports = { createGame, processDiscard, getState, handleClaim, handleSelfWin, sortHand, tileLabel, canSelfKong };
