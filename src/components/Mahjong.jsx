import { useState, useEffect, useCallback, useRef } from "react";

// Unicode mahjong tiles
const TILE_CHAR = {
  "1w":"\u{1F007}","2w":"\u{1F008}","3w":"\u{1F009}","4w":"\u{1F00A}","5w":"\u{1F00B}","6w":"\u{1F00C}","7w":"\u{1F00D}","8w":"\u{1F00E}","9w":"\u{1F00F}",
  "1t":"\u{1F010}","2t":"\u{1F011}","3t":"\u{1F012}","4t":"\u{1F013}","5t":"\u{1F014}","6t":"\u{1F015}","7t":"\u{1F016}","8t":"\u{1F017}","9t":"\u{1F018}",
  "1p":"\u{1F019}","2p":"\u{1F01A}","3p":"\u{1F01B}","4p":"\u{1F01C}","5p":"\u{1F01D}","6p":"\u{1F01E}","7p":"\u{1F01F}","8p":"\u{1F020}","9p":"\u{1F021}",
  "1f":"\u{1F000}","2f":"\u{1F001}","3f":"\u{1F002}","4f":"\u{1F003}",
  "1j":"\u{1F004}","2j":"\u{1F005}","3j":"\u{1F006}",
};

const TILE_NAME = {
  "1w":"一万","2w":"二万","3w":"三万","4w":"四万","5w":"五万","6w":"六万","7w":"七万","8w":"八万","9w":"九万",
  "1t":"一条","2t":"二条","3t":"三条","4t":"四条","5t":"五条","6t":"六条","7t":"七条","8t":"八条","9t":"九条",
  "1p":"一筒","2p":"二筒","3p":"三筒","4p":"四筒","5p":"五筒","6p":"六筒","7p":"七筒","8p":"八筒","9p":"九筒",
  "1f":"东","2f":"南","3f":"西","4f":"北",
  "1j":"中","2j":"发","3j":"白",
};

// SVG-based tile patterns
function TilePattern({ tile, size }) {
  const s = tile.slice(-1), v = parseInt(tile);
  const fs = size === "sm" ? 8 : size === "xs" ? 6 : 11;

  if (s === "j") {
    // 中=red, 发=green, 白=empty frame
    if (v === 1) return <span style={{ fontSize: fs + 6, color: "#C0392B", fontWeight: 900, lineHeight: 1 }}>中</span>;
    if (v === 2) return <span style={{ fontSize: fs + 6, color: "#27AE60", fontWeight: 900, lineHeight: 1 }}>發</span>;
    return <div style={{ width: fs + 4, height: fs + 6, border: "2px solid #5D6D7E", borderRadius: 2 }} />;
  }

  if (s === "f") {
    const labels = ["東","南","西","北"];
    return <span style={{ fontSize: fs + 4, color: "#1A1A2E", fontWeight: 800, lineHeight: 1 }}>{labels[v-1]}</span>;
  }

  if (s === "w") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, lineHeight: 1 }}>
        <span style={{ fontSize: fs + 2, color: "#1A1A2E", fontWeight: 800 }}>{["一","二","三","四","五","六","七","八","九"][v-1]}</span>
        <span style={{ fontSize: fs - 2, color: "#C0392B", fontWeight: 700 }}>万</span>
      </div>
    );
  }

  if (s === "p") {
    // dots/circles
    const dotSize = size === "xs" ? 4 : size === "sm" ? 5 : 7;
    const gap = size === "xs" ? 1 : 2;
    const dots = [];
    const layouts = {
      1: [[0,0]], 2: [[-1,0],[1,0]], 3: [[-1,-1],[0,0],[1,1]],
      4: [[-1,-1],[1,-1],[-1,1],[1,1]], 5: [[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],
      6: [[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]], 7: [[-1,-1],[0,-1],[1,-1],[0,0],[-1,1],[0,1],[1,1]],
      8: [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]], 9: [[-1,-1],[0,-1],[1,-1],[-1,0],[0,0],[1,0],[-1,1],[0,1],[1,1]],
    };
    const pos = layouts[v] || [];
    const colors = ["#2874A6","#1A5276"];
    return (
      <div style={{ position: "relative", width: dotSize * 3 + gap * 4, height: dotSize * 3 + gap * 4 }}>
        {pos.map((p, i) => (
          <div key={i} style={{
            position: "absolute",
            left: (p[0] + 1) * (dotSize + gap),
            top: (p[1] + 1) * (dotSize + gap),
            width: dotSize, height: dotSize, borderRadius: "50%",
            background: `radial-gradient(circle at 35% 35%, #3498DB, #1A5276)`,
          }} />
        ))}
      </div>
    );
  }

  if (s === "t") {
    // bamboo sticks
    const stickW = size === "xs" ? 2 : size === "sm" ? 2.5 : 3;
    const stickH = size === "xs" ? 10 : size === "sm" ? 14 : 20;
    const gap = size === "xs" ? 1 : 1.5;
    if (v === 1) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: stickW + 1, height: stickH, background: "linear-gradient(90deg,#27AE60,#1E8449)", borderRadius: 1 }}>
            <div style={{ width: "100%", height: "33%", borderBottom: "1px solid rgba(0,0,0,0.15)" }} />
            <div style={{ width: "100%", height: "33%", borderBottom: "1px solid rgba(0,0,0,0.15)" }} />
          </div>
        </div>
      );
    }
    const cols = v <= 3 ? v : v <= 6 ? Math.ceil(v / 2) : Math.ceil(v / 3);
    const rows = v <= 3 ? 1 : v <= 6 ? 2 : 3;
    const sticks = [];
    let count = 0;
    for (let r = 0; r < rows && count < v; r++) {
      const rowSticks = Math.min(cols, v - count);
      for (let c = 0; c < rowSticks; c++) {
        sticks.push(
          <div key={count} style={{
            width: stickW, height: stickH / rows - 1,
            background: "linear-gradient(90deg,#27AE60,#1E8449)",
            borderRadius: 0.5,
          }} />
        );
        count++;
      }
    }
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: gap, justifyContent: "center", alignItems: "center", maxWidth: (stickW + gap) * cols + 2 }}>
        {sticks}
      </div>
    );
  }

  return <span style={{ fontSize: fs }}>{TILE_NAME[tile]}</span>;
}

function Tile({ tile, size = "md", faceDown, onClick, selected, disabled, isNew, banned }) {
  const sz = size === "sm" ? { w: 30, h: 40 } : size === "xs" ? { w: 24, h: 30 } : { w: 40, h: 54 };
  if (faceDown) {
    return <div style={{ width: sz.w, height: sz.h, borderRadius: 4, background: "linear-gradient(135deg,#2E86C1,#1B4F72)", border: "1px solid #1A5276", flexShrink: 0 }} />;
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: sz.w, height: sz.h, borderRadius: 6,
      background: banned ? "#E5E7E9" : selected ? "#FFF3CD" : isNew ? "#E8F8F5" : "#FDFEFE",
      border: `1.5px solid ${banned ? "#AEB6BF" : selected ? "#F39C12" : isNew ? "#1ABC9C" : "#D5D8DC"}`,
      opacity: banned ? 0.5 : 1,
      cursor: onClick && !disabled ? "pointer" : "default",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 2, flexShrink: 0, transition: "transform .1s",
      boxShadow: selected ? "0 3px 10px rgba(243,156,18,0.35)" : isNew ? "0 2px 8px rgba(26,188,156,0.3)" : "0 1px 3px rgba(0,0,0,0.12)",
      transform: selected ? "translateY(-6px)" : isNew ? "translateY(-3px)" : "",
    }}
      onMouseEnter={e => { if (onClick && !disabled) e.currentTarget.style.transform = "translateY(-4px)"; }}
      onMouseLeave={e => { if (!selected && !isNew) e.currentTarget.style.transform = ""; }}
    >
      <TilePattern tile={tile} size={size} />
    </button>
  );
}

function MeldDisplay({ meld }) {
  return (
    <div style={{ display: "flex", gap: 1, padding: "2px 3px", background: "rgba(255,255,255,0.1)", borderRadius: 4 }}>
      {meld.tiles.map((tile, i) => <Tile key={i} tile={tile} size="sm" />)}
    </div>
  );
}

const CLAIM_TIMEOUT = 10; // seconds

export default function Mahjong({ theme: t }) {
  const [mode, setMode] = useState(null);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState(null);
  const [drawnTile, setDrawnTile] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  const api = useCallback(async (path, body) => {
    const opts = body !== undefined ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {};
    const r = await fetch(`/api/mahjong/${path}`, opts);
    const d = await r.json();
    if (d.state) setState(d.state);
    if (d.result?.drawn) setDrawnTile(d.result.drawn);
    else if (d.result?.event !== "claim_available" && d.result?.event !== "waiting") setDrawnTile(null);
    if (d.result?.event === "win") setMsg(d.state.winnerName + (d.result.selfDraw ? " 自摸胡了！" : " 胡了！"));
    else if (d.result?.event === "draw_game") setMsg("流局，没人胡。");
    else if (d.result?.event === "self_win_available") setMsg("你可以自摸胡牌！");
    else if (d.result?.event === "your_turn" && d.result.drawn) setMsg(`摸到 ${TILE_NAME[d.result.drawn] || d.result.drawn}`);
    else if (d.result?.event === "claim_available") setMsg(null);
    return d;
  }, []);

  // countdown timer for claims
  useEffect(() => {
    const hasClaim = state?.myClaimOptions?.length > 0;
    if (hasClaim) {
      setCountdown(CLAIM_TIMEOUT);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            fetch("/api/mahjong/timeout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
              .then(r => r.json()).then(d => { if (d.state) setState(d.state); });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    } else {
      setCountdown(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [state?.myClaimOptions?.length > 0, state?.claimTimestamp]);

  useEffect(() => {
    if (!state || state.phase === "finished" || mode !== "du") return;
    const needPoll = (state.currentPlayer === 1 && state.phase === "discard") ||
                     (state.phase === "claim" && state.waitingFor?.some(w => w.player === 1));
    if (needPoll) {
      pollRef.current = setInterval(async () => {
        const r = await fetch("/api/mahjong/state?player=0");
        const d = await r.json();
        if (d.state) setState(d.state);
      }, 2000);
      return () => clearInterval(pollRef.current);
    }
  }, [state?.phase, state?.currentPlayer, state?.turnCount, mode]);

  async function newGame(chosenMode) {
    setLoading(true); setMsg(null); setSelected(null); setDrawnTile(null);
    setMode(chosenMode);
    await api("new", { mode: chosenMode });
    setLoading(false);
  }

  async function discard() {
    if (selected === null || !state) return;
    const tile = state.players[0].hand[selected];
    setSelected(null); setMsg(null); setDrawnTile(null);
    await api("discard", { tile, player: 0 });
  }

  async function claim(action) {
    setMsg(null); setCountdown(0);
    if (timerRef.current) clearInterval(timerRef.current);
    await api("claim", { action, player: 0 });
  }
  async function selfWin(accept) { setMsg(null); await api("selfwin", { accept, player: 0 }); }
  async function chooseBan(suit) { await api("ban", { suit, player: 0 }); }

  if (!state) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", fontFamily: "'Noto Serif SC',serif" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🀄</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 4 }}>麻将</div>
        <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 24 }}>摸打碰杠胡</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 200, margin: "0 auto" }}>
          <button onClick={() => newGame("du")} disabled={loading} style={{
            padding: "12px 20px", borderRadius: 10, border: `1.5px solid ${t.accentBorder}`,
            background: t.accentSoft, color: t.accent, fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Noto Serif SC',serif",
          }}>和笃打</button>
          <button onClick={() => newGame("ai")} disabled={loading} style={{
            padding: "12px 20px", borderRadius: 10, border: `1.5px solid ${t.surfaceBorder}`,
            background: t.surface, color: t.text, fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Noto Serif SC',serif",
          }}>自己和AI打</button>
        </div>
        {loading && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 10 }}>洗牌中...</div>}
      </div>
    );
  }

  const SUIT_NAMES = { w: "万", t: "条", p: "筒" };

  // Ban selection phase
  if (state.phase === "choose_ban") {
    const me = state.players[0];
    const myBan = me.bannedSuit;
    const waiting = state.players.filter(p => !p.bannedSuit && !p.isAI);
    return (
      <div style={{ padding: "16px 12px", fontFamily: "'Noto Serif SC',serif" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 4 }}>缺一门</div>
          <div style={{ fontSize: 11, color: t.textMuted }}>选一个花色不要，胡牌时手里不能有这个花色</div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 6 }}>你的手牌</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
            {me.hand?.map((tile, i) => <Tile key={i} tile={tile} size="md" />)}
          </div>
        </div>
        {!myBan ? (
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            {["w","t","p"].map(s => {
              const count = me.hand?.filter(t => t.slice(-1) === s).length || 0;
              return (
                <button key={s} onClick={() => chooseBan(s)} style={{
                  padding: "14px 20px", borderRadius: 12, border: `1.5px solid ${t.surfaceBorder}`,
                  background: t.surface, color: t.text, fontSize: 14, fontWeight: 600,
                  cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}>
                  <span>不要{SUIT_NAMES[s]}</span>
                  <span style={{ fontSize: 10, color: t.textMuted }}>手里有{count}张</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, color: t.accent, fontWeight: 600, marginBottom: 8 }}>你选了不要{SUIT_NAMES[myBan]}</div>
            {waiting.length > 0 && <div style={{ fontSize: 11, color: t.textMuted }}>等{waiting.map(p => p.name).join("、")}选...</div>}
          </div>
        )}
      </div>
    );
  }

  const me = state.players[0];
  const isMyTurn = state.currentPlayer === 0;
  const hasClaim = state.myClaimOptions?.length > 0;
  const isSelfWin = state.phase === "self_win_available" && state.selfWinPlayer === 0;
  const isFinished = state.phase === "finished";
  const canDiscard = state.phase === "discard" && isMyTurn;
  const waitingDu = mode === "du" && state.currentPlayer === 1 && state.phase === "discard";
  const waitingDuClaim = state.phase === "claim" && state.waitingFor?.some(w => w.player === 1);

  return (
    <div style={{ padding: "8px 8px 16px", fontFamily: "'Noto Serif SC',serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "0 8px" }}>
        <div style={{ fontSize: 11, color: t.textMuted }}>余牌 {state.wallCount}</div>
        <div style={{ fontSize: 11, color: isMyTurn ? t.accent : t.textMuted, fontWeight: isMyTurn ? 600 : 400 }}>
          {isFinished ? (state.winnerName ? `${state.winnerName} 胡了` : "流局")
            : waitingDu ? "等笃出牌..." : waitingDuClaim ? "等笃决定..."
            : `${state.players[state.currentPlayer].name}的回合`}
        </div>
      </div>

      <div style={{
        background: "linear-gradient(145deg,#1B5E20,#2E7D32)", borderRadius: 16, padding: 12, minHeight: 320,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        border: "3px solid #388E3C", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)",
      }}>
        <PlayerRow player={state.players[2]} isCurrent={state.currentPlayer === 2} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0" }}>
          <SidePlayer player={state.players[3]} isCurrent={state.currentPlayer === 3} />
          <div style={{ flex: 1, margin: "0 8px", minHeight: 60, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 2, padding: 4 }}>
            {state.lastDiscard && (
              <div style={{ position: "relative", animation: "tileDrop .3s ease" }}>
                <Tile tile={state.lastDiscard} size="sm" />
                <div style={{ position: "absolute", top: -8, right: -8, background: "#E74C3C", color: "#fff", fontSize: 7, borderRadius: 8, padding: "1px 5px", fontWeight: 600 }}>
                  {state.players[state.lastDiscardBy]?.name}
                </div>
              </div>
            )}
          </div>
          <SidePlayer player={state.players[1]} isCurrent={state.currentPlayer === 1} />
        </div>

        {me.melds.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 4 }}>
            {me.melds.map((m, i) => <MeldDisplay key={i} meld={m} />)}
          </div>
        )}

        {me.discards.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap", marginBottom: 6 }}>
            {me.discards.slice(-12).map((tile, i) => <Tile key={i} tile={tile} size="xs" />)}
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
            小黎的手牌 · {me.hand?.length || 0}张 {me.bannedSuit ? BAN_LABELS[me.bannedSuit] : ""}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
            {me.hand && me.hand.map((tile, i) => (
              <Tile key={`${tile}-${i}`} tile={tile} size="md" selected={selected === i}
                isNew={drawnTile && tile === drawnTile && i === me.hand.lastIndexOf(drawnTile)}
                banned={me.bannedSuit && tile.slice(-1) === me.bannedSuit}
                onClick={canDiscard ? () => setSelected(selected === i ? null : i) : undefined}
                disabled={!canDiscard} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        {msg && <div style={{ fontSize: 12, color: t.accent, fontWeight: 600, textAlign: "center", animation: "fadeIn .3s ease" }}>{msg}</div>}

        {canDiscard && selected !== null && (
          <button onClick={discard} style={{ padding: "8px 24px", borderRadius: 8, border: `1.5px solid ${t.accentBorder}`, background: t.accentSoft, color: t.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            打出 {TILE_NAME[me.hand[selected]] || me.hand[selected]}
          </button>
        )}
        {canDiscard && selected === null && <div style={{ fontSize: 11, color: t.textMuted }}>点一张牌选中，再点「打出」</div>}

        {hasClaim && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            {/* countdown bar */}
            <div style={{ width: 120, height: 4, background: "rgba(0,0,0,0.1)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", background: countdown > 3 ? "#27AE60" : "#E74C3C", width: `${(countdown / CLAIM_TIMEOUT) * 100}%`, transition: "width 1s linear", borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 10, color: t.textMuted }}>{countdown}秒</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {state.myClaimOptions.includes("hu") && <Btn label="胡！" bg="#E74C3C" onClick={() => claim("hu")} />}
              {state.myClaimOptions.includes("kong") && <Btn label="杠" bg="#F39C12" onClick={() => claim("kong")} />}
              {state.myClaimOptions.includes("pong") && <Btn label="碰" bg="#27AE60" onClick={() => claim("pong")} />}
              {state.myClaimOptions.includes("chi") && state.myChiCombos?.map((combo, i) => (
                <button key={i} onClick={() => claim({ type: "chi", combo })} style={{
                  padding: "6px 10px", borderRadius: 8, background: "#8E44AD", color: "#fff",
                  border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  吃 {combo.map(t => TILE_NAME[t]).join("")}
                </button>
              ))}
              <button onClick={() => claim("pass")} style={{ padding: "8px 16px", borderRadius: 8, background: t.surface, color: t.textMuted, border: `1px solid ${t.surfaceBorder}`, fontSize: 12, cursor: "pointer" }}>过</button>
            </div>
          </div>
        )}

        {isSelfWin && (
          <div style={{ display: "flex", gap: 8 }}>
            <Btn label="自摸胡！" bg="#E74C3C" onClick={() => selfWin(true)} />
            <button onClick={() => selfWin(false)} style={{ padding: "8px 16px", borderRadius: 8, background: t.surface, color: t.textMuted, border: `1px solid ${t.surfaceBorder}`, fontSize: 12, cursor: "pointer" }}>不胡</button>
          </div>
        )}

        {isFinished && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => newGame(mode)} style={{ padding: "8px 24px", borderRadius: 8, border: `1.5px solid ${t.accentBorder}`, background: t.accentSoft, color: t.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>再来一局</button>
            <button onClick={() => { setState(null); setMode(null); setMsg(null); setDrawnTile(null); }} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${t.surfaceBorder}`, background: t.surface, color: t.textMuted, fontSize: 12, cursor: "pointer" }}>换模式</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes tileDrop{from{transform:translateY(-12px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>
    </div>
  );
}

function Btn({ label, bg, onClick }) {
  return <button onClick={onClick} style={{ padding: "8px 16px", borderRadius: 8, background: bg, color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{label}</button>;
}

const BAN_LABELS = { w: "🚫万", t: "🚫条", p: "🚫筒" };

function PlayerRow({ player, isCurrent }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: isCurrent ? "#FFEAA7" : "rgba(255,255,255,0.6)", marginBottom: 4 }}>
        {player.name} ({player.handCount}张) {player.bannedSuit ? BAN_LABELS[player.bannedSuit] : ""} {isCurrent ? "◀" : ""}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
        {player.melds.map((m, i) => <MeldDisplay key={i} meld={m} />)}
        {Array.from({ length: player.handCount }).map((_, i) => <Tile key={i} faceDown size="xs" />)}
      </div>
      {player.discards.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap", marginTop: 4 }}>
          {player.discards.slice(-8).map((tile, i) => <Tile key={i} tile={tile} size="xs" />)}
        </div>
      )}
    </div>
  );
}

function SidePlayer({ player, isCurrent }) {
  return (
    <div style={{ textAlign: "center", width: 60 }}>
      <div style={{ fontSize: 9, color: isCurrent ? "#FFEAA7" : "rgba(255,255,255,0.6)", marginBottom: 2 }}>
        {player.name} {player.bannedSuit ? BAN_LABELS[player.bannedSuit] : ""} {isCurrent ? "◀" : ""}
      </div>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{player.handCount}张</div>
      {player.melds.map((m, i) => <MeldDisplay key={i} meld={m} />)}
    </div>
  );
}
