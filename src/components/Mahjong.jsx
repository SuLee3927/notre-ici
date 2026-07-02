import { useState, useEffect, useCallback } from "react";

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

function Tile({ tile, size = "md", faceDown, onClick, selected, disabled, theme: t }) {
  const sz = size === "sm" ? { w: 28, h: 36, fs: 10 } : size === "xs" ? { w: 22, h: 28, fs: 8 } : { w: 36, h: 48, fs: 13 };
  if (faceDown) {
    return (
      <div style={{
        width: sz.w, height: sz.h, borderRadius: 4,
        background: "linear-gradient(135deg, #2E86C1 0%, #1B4F72 100%)",
        border: "1px solid #1A5276", flexShrink: 0,
      }} />
    );
  }
  const label = TILE_DISPLAY[tile] || tile;
  const color = getTileColor(tile);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: sz.w, height: sz.h, borderRadius: 5,
        background: selected ? "#FFF3CD" : "#FDFEFE",
        border: `1.5px solid ${selected ? "#F39C12" : "#D5D8DC"}`,
        cursor: onClick && !disabled ? "pointer" : "default",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 0, flexShrink: 0, transition: "transform .1s, box-shadow .1s",
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

function MeldDisplay({ meld, theme: t }) {
  return (
    <div style={{ display: "flex", gap: 1, marginRight: 6, padding: "2px 4px", background: "rgba(0,0,0,0.05)", borderRadius: 4 }}>
      {meld.tiles.map((tile, i) => <Tile key={i} tile={tile} size="sm" theme={t} />)}
    </div>
  );
}

export default function Mahjong({ theme: t }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState(null);

  const api = useCallback(async (path, body) => {
    const opts = body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {};
    const r = await fetch(`/api/mahjong/${path}`, opts);
    const d = await r.json();
    if (d.state) setState(d.state);
    if (d.result?.event === "win") {
      setMsg(d.state.winnerName + (d.result.selfDraw ? " 自摸胡了！" : " 胡了！"));
    } else if (d.result?.event === "draw_game") {
      setMsg("流局，没人胡。");
    } else if (d.result?.event === "claim_available") {
      setMsg("有人打出了你能碰/杠/胡的牌");
    } else if (d.result?.event === "self_win_available") {
      setMsg("你可以胡牌了！");
    }
    return d;
  }, []);

  async function newGame() {
    setLoading(true); setMsg(null); setSelected(null);
    await api("new", {});
    setLoading(false);
  }

  async function discard() {
    if (selected === null) return;
    const tile = state.players[0].hand[selected];
    setSelected(null); setMsg(null);
    await api("discard", { tile });
  }

  async function claim(action) {
    setMsg(null);
    await api("claim", { action });
  }

  async function selfWin(accept) {
    setMsg(null);
    await api("selfwin", { accept });
  }

  if (!state) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", fontFamily: "'Noto Serif SC',serif" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🀄</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 4 }}>麻将</div>
        <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 20 }}>摸打碰杠胡</div>
        <button onClick={newGame} disabled={loading} style={{
          padding: "10px 28px", borderRadius: 10, border: `1.5px solid ${t.accentBorder}`,
          background: t.accentSoft, color: t.accent, fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "'Noto Serif SC',serif",
        }}>
          {loading ? "洗牌中..." : "开一局"}
        </button>
      </div>
    );
  }

  const me = state.players[0];
  const isMyTurn = state.currentPlayer === 0;
  const isClaim = state.phase === "claim";
  const isSelfWin = state.phase === "self_win_available";
  const isFinished = state.phase === "finished";
  const canDiscard = state.phase === "discard" && isMyTurn;

  const positions = ["bottom", "right", "top", "left"];

  return (
    <div style={{ padding: "8px 8px 16px", fontFamily: "'Noto Serif SC',serif" }}>
      {/* 顶部信息 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "0 8px" }}>
        <div style={{ fontSize: 11, color: t.textMuted }}>余牌 {state.wallCount}</div>
        <div style={{ fontSize: 11, color: isMyTurn ? t.accent : t.textMuted, fontWeight: isMyTurn ? 600 : 400 }}>
          {isFinished ? (state.winnerName ? `${state.winnerName} 胡了` : "流局") : `${state.players[state.currentPlayer].name} 的回合`}
        </div>
      </div>

      {/* 牌桌 */}
      <div style={{
        background: "#1B5E20", borderRadius: 16, padding: 12, minHeight: 320,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        border: "3px solid #2E7D32", position: "relative",
      }}>
        {/* 上家 */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
            {state.players[2].name} ({state.players[2].handCount}张)
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
            {state.players[2].melds.map((m, i) => <MeldDisplay key={i} meld={m} theme={t} />)}
            {Array.from({ length: state.players[2].handCount }).map((_, i) => <Tile key={i} faceDown size="xs" theme={t} />)}
          </div>
          {state.players[2].discards.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap", marginTop: 4 }}>
              {state.players[2].discards.slice(-8).map((tile, i) => <Tile key={i} tile={tile} size="xs" theme={t} />)}
            </div>
          )}
        </div>

        {/* 中间行：左家 + 弃牌区 + 右家 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0" }}>
          {/* 左家 */}
          <div style={{ textAlign: "center", width: 60 }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>
              {state.players[3].name}
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{state.players[3].handCount}张</div>
            {state.players[3].melds.map((m, i) => <MeldDisplay key={i} meld={m} theme={t} />)}
          </div>

          {/* 中央弃牌区 */}
          <div style={{
            flex: 1, margin: "0 8px", minHeight: 60,
            display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 2,
            padding: 4,
          }}>
            {state.lastDiscard && (
              <div style={{ position: "relative" }}>
                <Tile tile={state.lastDiscard} size="sm" theme={t} />
                <div style={{
                  position: "absolute", top: -6, right: -6, background: "#E74C3C",
                  color: "#fff", fontSize: 7, borderRadius: 8, padding: "1px 4px",
                }}>新</div>
              </div>
            )}
          </div>

          {/* 右家 */}
          <div style={{ textAlign: "center", width: 60 }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>
              {state.players[1].name}
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{state.players[1].handCount}张</div>
            {state.players[1].melds.map((m, i) => <MeldDisplay key={i} meld={m} theme={t} />)}
          </div>
        </div>

        {/* 我的亮出的牌组 */}
        {me.melds.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 4 }}>
            {me.melds.map((m, i) => <MeldDisplay key={i} meld={m} theme={t} />)}
          </div>
        )}

        {/* 我的弃牌 */}
        {me.discards.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap", marginBottom: 6 }}>
            {me.discards.slice(-12).map((tile, i) => <Tile key={i} tile={tile} size="xs" theme={t} />)}
          </div>
        )}

        {/* 我的手牌 */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>小黎的手牌</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
            {me.hand && me.hand.map((tile, i) => (
              <Tile
                key={`${tile}-${i}`}
                tile={tile}
                size="md"
                theme={t}
                selected={selected === i}
                onClick={canDiscard ? () => setSelected(selected === i ? null : i) : undefined}
                disabled={!canDiscard}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 操作区 */}
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        {msg && (
          <div style={{ fontSize: 12, color: t.accent, fontWeight: 600, textAlign: "center" }}>{msg}</div>
        )}

        {canDiscard && selected !== null && (
          <button onClick={discard} style={{
            padding: "8px 24px", borderRadius: 8, border: `1.5px solid ${t.accentBorder}`,
            background: t.accentSoft, color: t.accent, fontSize: 12, fontWeight: 600,
            cursor: "pointer",
          }}>
            打出 {TILE_DISPLAY[me.hand[selected]] || me.hand[selected]}
          </button>
        )}

        {canDiscard && selected === null && (
          <div style={{ fontSize: 11, color: t.textMuted }}>点一张牌选中，再点打出</div>
        )}

        {isClaim && (
          <div style={{ display: "flex", gap: 8 }}>
            {state.claimOptions?.options?.includes("hu") && (
              <button onClick={() => claim("hu")} style={{ padding: "8px 16px", borderRadius: 8, background: "#E74C3C", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>胡！</button>
            )}
            {state.claimOptions?.options?.includes("kong") && (
              <button onClick={() => claim("kong")} style={{ padding: "8px 16px", borderRadius: 8, background: "#F39C12", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>杠</button>
            )}
            {state.claimOptions?.options?.includes("pong") && (
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
          <button onClick={newGame} style={{
            padding: "8px 24px", borderRadius: 8, border: `1.5px solid ${t.accentBorder}`,
            background: t.accentSoft, color: t.accent, fontSize: 12, fontWeight: 600,
            cursor: "pointer", marginTop: 4,
          }}>
            再来一局
          </button>
        )}
      </div>
    </div>
  );
}
