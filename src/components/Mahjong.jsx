import { useState, useEffect, useCallback, useRef } from "react";

const TILE_DISPLAY = {
  "1w":"一万","2w":"二万","3w":"三万","4w":"四万","5w":"五万","6w":"六万","7w":"七万","8w":"八万","9w":"九万",
  "1t":"一条","2t":"二条","3t":"三条","4t":"四条","5t":"五条","6t":"六条","7t":"七条","8t":"八条","9t":"九条",
  "1p":"一筒","2p":"二筒","3p":"三筒","4p":"四筒","5p":"五筒","6p":"六筒","7p":"七筒","8p":"八筒","9p":"九筒",
  "1f":"东","2f":"南","3f":"西","4f":"北",
  "1j":"中","2j":"发","3j":"白",
};

const SUIT_COLORS = { w: "#2D5F2D", t: "#1A5276", p: "#922B21", f: "#4A235A", j: "#B7950B" };

function getTileColor(tile) {
  if (!tile) return "#333";
  const s = tile.slice(-1);
  if (s === "j") {
    const v = parseInt(tile);
    if (v === 1) return "#C0392B";
    if (v === 2) return "#27AE60";
    return "#7F8C8D";
  }
  return SUIT_COLORS[s] || "#333";
}

function Tile({ tile, size = "md", faceDown, onClick, selected, disabled }) {
  const sz = size === "sm" ? { w: 28, h: 36, fs: 10 } : size === "xs" ? { w: 22, h: 28, fs: 8 } : { w: 36, h: 48, fs: 13 };
  if (faceDown) {
    return <div style={{ width: sz.w, height: sz.h, borderRadius: 4, background: "linear-gradient(135deg,#2E86C1,#1B4F72)", border: "1px solid #1A5276", flexShrink: 0 }} />;
  }
  const label = TILE_DISPLAY[tile] || tile;
  const color = getTileColor(tile);
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: sz.w, height: sz.h, borderRadius: 5,
      background: selected ? "#FFF3CD" : "#FDFEFE",
      border: `1.5px solid ${selected ? "#F39C12" : "#D5D8DC"}`,
      cursor: onClick && !disabled ? "pointer" : "default",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 0, flexShrink: 0, transition: "transform .1s",
      boxShadow: selected ? "0 2px 8px rgba(243,156,18,0.3)" : "0 1px 2px rgba(0,0,0,0.1)",
      transform: selected ? "translateY(-4px)" : "",
    }}
      onMouseEnter={e => { if (onClick && !disabled) e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.transform = ""; }}
    >
      {label.length <= 1 ? (
        <span style={{ fontSize: sz.fs + 2, fontWeight: 700, color, lineHeight: 1 }}>{label}</span>
      ) : (
        <>
          <span style={{ fontSize: sz.fs - 2, fontWeight: 600, color, lineHeight: 1 }}>{label[0]}</span>
          <span style={{ fontSize: sz.fs - 3, color, lineHeight: 1, marginTop: 1 }}>{label.slice(1)}</span>
        </>
      )}
    </button>
  );
}

function MeldDisplay({ meld }) {
  return (
    <div style={{ display: "flex", gap: 1, marginRight: 6, padding: "2px 4px", background: "rgba(0,0,0,0.05)", borderRadius: 4 }}>
      {meld.tiles.map((tile, i) => <Tile key={i} tile={tile} size="sm" />)}
    </div>
  );
}

export default function Mahjong({ theme: t }) {
  const [mode, setMode] = useState(null); // null | "du" | "ai"
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState(null);
  const pollRef = useRef(null);

  const api = useCallback(async (path, body) => {
    const opts = body !== undefined ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {};
    const r = await fetch(`/api/mahjong/${path}`, opts);
    const d = await r.json();
    if (d.state) setState(d.state);
    if (d.result?.event === "win") setMsg(d.state.winnerName + (d.result.selfDraw ? " 自摸胡了！" : " 胡了！"));
    else if (d.result?.event === "draw_game") setMsg("流局，没人胡。");
    else if (d.result?.event === "self_win_available") setMsg("你可以胡牌了！");
    return d;
  }, []);

  // poll for state changes when waiting for 笃's turn
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
    setLoading(true); setMsg(null); setSelected(null);
    setMode(chosenMode);
    await api("new", { mode: chosenMode });
    setLoading(false);
  }

  async function discard() {
    if (selected === null || !state) return;
    const tile = state.players[0].hand[selected];
    setSelected(null); setMsg(null);
    await api("discard", { tile, player: 0 });
  }

  async function claim(action) {
    setMsg(null);
    await api("claim", { action, player: 0 });
  }

  async function selfWin(accept) {
    setMsg(null);
    await api("selfwin", { accept, player: 0 });
  }

  // mode select
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
          }}>
            和笃打
          </button>
          <button onClick={() => newGame("ai")} disabled={loading} style={{
            padding: "12px 20px", borderRadius: 10, border: `1.5px solid ${t.surfaceBorder}`,
            background: t.surface, color: t.text, fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Noto Serif SC',serif",
          }}>
            自己和AI打
          </button>
        </div>
        {loading && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 10 }}>洗牌中...</div>}
      </div>
    );
  }

  const me = state.players[0];
  const isMyTurn = state.currentPlayer === 0;
  const hasClaim = state.myClaimOptions && state.myClaimOptions.length > 0;
  const isSelfWin = state.phase === "self_win_available" && state.selfWinPlayer === 0;
  const isFinished = state.phase === "finished";
  const canDiscard = state.phase === "discard" && isMyTurn;

  const waitingForDu = mode === "du" && state.currentPlayer === 1 && state.phase === "discard";
  const waitingForDuClaim = state.phase === "claim" && state.waitingFor?.some(w => w.player === 1);

  return (
    <div style={{ padding: "8px 8px 16px", fontFamily: "'Noto Serif SC',serif" }}>
      {/* top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "0 8px" }}>
        <div style={{ fontSize: 11, color: t.textMuted }}>余牌 {state.wallCount}</div>
        <div style={{ fontSize: 11, color: isMyTurn ? t.accent : t.textMuted, fontWeight: isMyTurn ? 600 : 400 }}>
          {isFinished
            ? (state.winnerName ? `${state.winnerName} 胡了` : "流局")
            : waitingForDu ? "等笃出牌..."
            : waitingForDuClaim ? "等笃决定碰杠..."
            : `${state.players[state.currentPlayer].name} 的回合`}
        </div>
      </div>

      {/* table */}
      <div style={{
        background: "#1B5E20", borderRadius: 16, padding: 12, minHeight: 320,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        border: "3px solid #2E7D32", position: "relative",
      }}>
        {/* top player (index 2) */}
        <PlayerRow player={state.players[2]} isCurrent={state.currentPlayer === 2} />

        {/* middle: left(3) + center + right(1) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0" }}>
          <SidePlayer player={state.players[3]} isCurrent={state.currentPlayer === 3} />
          <div style={{ flex: 1, margin: "0 8px", minHeight: 60, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 2, padding: 4 }}>
            {state.lastDiscard && (
              <div style={{ position: "relative" }}>
                <Tile tile={state.lastDiscard} size="sm" />
                <div style={{ position: "absolute", top: -6, right: -6, background: "#E74C3C", color: "#fff", fontSize: 7, borderRadius: 8, padding: "1px 4px" }}>新</div>
              </div>
            )}
          </div>
          <SidePlayer player={state.players[1]} isCurrent={state.currentPlayer === 1} label={mode === "du" ? "笃" : undefined} />
        </div>

        {/* my melds */}
        {me.melds.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 4 }}>
            {me.melds.map((m, i) => <MeldDisplay key={i} meld={m} />)}
          </div>
        )}

        {/* my discards */}
        {me.discards.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap", marginBottom: 6 }}>
            {me.discards.slice(-12).map((tile, i) => <Tile key={i} tile={tile} size="xs" />)}
          </div>
        )}

        {/* my hand */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>小黎的手牌</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
            {me.hand && me.hand.map((tile, i) => (
              <Tile key={`${tile}-${i}`} tile={tile} size="md" selected={selected === i}
                onClick={canDiscard ? () => setSelected(selected === i ? null : i) : undefined}
                disabled={!canDiscard} />
            ))}
          </div>
        </div>
      </div>

      {/* actions */}
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        {msg && <div style={{ fontSize: 12, color: t.accent, fontWeight: 600, textAlign: "center" }}>{msg}</div>}

        {canDiscard && selected !== null && (
          <button onClick={discard} style={{ padding: "8px 24px", borderRadius: 8, border: `1.5px solid ${t.accentBorder}`, background: t.accentSoft, color: t.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            打出 {TILE_DISPLAY[me.hand[selected]] || me.hand[selected]}
          </button>
        )}

        {canDiscard && selected === null && (
          <div style={{ fontSize: 11, color: t.textMuted }}>点一张牌选中，再点打出</div>
        )}

        {hasClaim && (
          <div style={{ display: "flex", gap: 8 }}>
            {state.myClaimOptions.includes("hu") && (
              <button onClick={() => claim("hu")} style={{ padding: "8px 16px", borderRadius: 8, background: "#E74C3C", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>胡！</button>
            )}
            {state.myClaimOptions.includes("kong") && (
              <button onClick={() => claim("kong")} style={{ padding: "8px 16px", borderRadius: 8, background: "#F39C12", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>杠</button>
            )}
            {state.myClaimOptions.includes("pong") && (
              <button onClick={() => claim("pong")} style={{ padding: "8px 16px", borderRadius: 8, background: "#27AE60", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>碰</button>
            )}
            <button onClick={() => claim("pass")} style={{ padding: "8px 16px", borderRadius: 8, background: t.surface, color: t.textMuted, border: `1px solid ${t.surfaceBorder}`, fontSize: 12, cursor: "pointer" }}>过</button>
          </div>
        )}

        {isSelfWin && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => selfWin(true)} style={{ padding: "8px 20px", borderRadius: 8, background: "#E74C3C", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>自摸胡！</button>
            <button onClick={() => selfWin(false)} style={{ padding: "8px 16px", borderRadius: 8, background: t.surface, color: t.textMuted, border: `1px solid ${t.surfaceBorder}`, fontSize: 12, cursor: "pointer" }}>不胡</button>
          </div>
        )}

        {isFinished && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => newGame(mode)} style={{ padding: "8px 24px", borderRadius: 8, border: `1.5px solid ${t.accentBorder}`, background: t.accentSoft, color: t.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>再来一局</button>
            <button onClick={() => { setState(null); setMode(null); setMsg(null); }} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${t.surfaceBorder}`, background: t.surface, color: t.textMuted, fontSize: 12, cursor: "pointer" }}>换模式</button>
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerRow({ player, isCurrent }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: isCurrent ? "rgba(255,220,100,0.9)" : "rgba(255,255,255,0.6)", marginBottom: 4 }}>
        {player.name} ({player.handCount}张) {isCurrent ? "◀" : ""}
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

function SidePlayer({ player, isCurrent, label }) {
  return (
    <div style={{ textAlign: "center", width: 60 }}>
      <div style={{ fontSize: 9, color: isCurrent ? "rgba(255,220,100,0.9)" : "rgba(255,255,255,0.6)", marginBottom: 2 }}>
        {label || player.name} {isCurrent ? "◀" : ""}
      </div>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{player.handCount}张</div>
      {player.melds.map((m, i) => <MeldDisplay key={i} meld={m} />)}
    </div>
  );
}
