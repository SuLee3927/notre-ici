import { useState, useEffect, useRef } from "react";

export default function GuessGame({ theme: t }) {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const pollRef = useRef(null);

  function stopPoll() { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }

  function startPoll() {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const d = await fetch("/api/guess/state?player=lee").then(r => r.json());
        if (d.ok && d.game) {
          setGame(d.game);
          if (d.game.phase !== "playing") stopPoll();
        }
      } catch {}
    }, 1500);
  }

  useEffect(() => () => stopPoll(), []);

  async function newGame() {
    setLoading(true); stopPoll(); setInput("");
    try {
      const d = await fetch("/api/guess/new?player=lee", { method: "POST" }).then(r => r.json());
      if (d.ok) {
        setGame(d.game);
        if (d.game.phase === "playing") startPoll();
      }
    } catch {}
    setLoading(false);
  }

  async function submitGuess() {
    if (!input.trim() || loading || !game || game.phase !== "playing") return;
    setLoading(true);
    try {
      const d = await fetch("/api/guess/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ player: "lee", guess: input.trim() }),
      }).then(r => r.json());
      if (d.ok && d.game) { setGame(d.game); setInput(""); if (d.game.phase !== "playing") stopPoll(); }
    } catch {}
    setLoading(false);
  }

  if (!game) return (
    <div style={{ padding:"32px 20px", textAlign:"center", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:36, marginBottom:12 }}>🗣️</div>
      <div style={{ fontSize:15, fontWeight:600, color:t.text, marginBottom:8 }}>你说我猜</div>
      <div style={{ fontSize:12, color:t.textMuted, lineHeight:2, marginBottom:24 }}>
        随机出词 · 随机分工<br/>
        描述方用语言提示 · 猜题方有5次机会
      </div>
      <button onClick={newGame} disabled={loading} style={{
        padding:"10px 32px", borderRadius:12,
        border:`1.5px solid ${t.accentBorder}`, background:t.accentSoft,
        color:t.accent, fontSize:13, cursor:"pointer",
        opacity: loading ? 0.6 : 1,
      }}>{loading ? "出题中…" : "开始"}</button>
    </div>
  );

  const isDescriber = game.describer === "lee";
  const isGuesser   = game.guesser === "lee";
  const isOver      = game.phase === "over";

  return (
    <div style={{ padding:"16px 16px 32px", fontFamily:"'Noto Serif SC',serif" }}>
      {/* 角色标签 */}
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:t.textMuted, marginBottom:14 }}>
        <span>{isDescriber ? "你来描述" : "克来描述"}</span>
        <span style={{ color:t.accent }}>剩 {game.guesses_left} 次</span>
      </div>

      {/* 词语展示（仅描述方看到） */}
      {isDescriber && (
        <div style={{
          background:t.accentSoft, border:`1.5px solid ${t.accentBorder}`,
          borderRadius:14, padding:"20px 16px", textAlign:"center", marginBottom:14,
        }}>
          <div style={{ fontSize:10, color:t.textMuted, marginBottom:6 }}>答案是</div>
          <div style={{ fontSize:28, fontWeight:700, color:t.accent, letterSpacing:2 }}>{game.word}</div>
          <div style={{ fontSize:10, color:t.textMuted, marginTop:8 }}>用语言描述给克猜，别直接说这个词</div>
        </div>
      )}

      {/* 状态消息 */}
      <div style={{
        background:t.surface, border:`1px solid ${t.surfaceBorder}`,
        borderRadius:12, padding:"10px 14px", marginBottom:14,
        textAlign:"center", fontSize:13, color:t.textSub,
      }}>
        {game.message}
      </div>

      {/* 已猜列表 */}
      {game.guesses.length > 0 && (
        <div style={{ marginBottom:14 }}>
          {game.guesses.map((g, i) => (
            <div key={i} style={{
              display:"flex", justifyContent:"space-between",
              padding:"6px 12px", fontSize:12, color:t.textMuted,
              borderBottom:`1px solid ${t.surfaceBorder}`,
            }}>
              <span>{g}</span>
              <span style={{ color: isOver && i === game.guesses.length-1 && game.result==="correct" ? t.accent : t.textMuted }}>
                {isOver && i === game.guesses.length-1 ? (game.result==="correct"?"✓":"✗") : "✗"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 猜词输入框（猜题方且游戏进行中） */}
      {isGuesser && !isOver && (
        <div style={{ display:"flex", gap:8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submitGuess()}
            placeholder="输入答案…"
            style={{
              flex:1, padding:"10px 14px", borderRadius:10,
              border:`1px solid ${t.surfaceBorder}`, background:t.surface,
              color:t.text, fontSize:13, outline:"none",
              fontFamily:"'Noto Serif SC',serif",
            }}
          />
          <button onClick={submitGuess} disabled={!input.trim() || loading} style={{
            padding:"10px 18px", borderRadius:10,
            border:`1.5px solid ${t.accentBorder}`, background:t.accentSoft,
            color:t.accent, fontSize:13, cursor:"pointer",
            opacity:(!input.trim() || loading) ? 0.5 : 1,
          }}>猜</button>
        </div>
      )}

      {/* 等待提示（描述方等对方猜） */}
      {isDescriber && !isOver && (
        <div style={{ textAlign:"center", fontSize:11, color:t.textMuted }}>等克猜…</div>
      )}

      {/* 结束 */}
      {isOver && (
        <div style={{ textAlign:"center", marginTop:8 }}>
          <div style={{ fontSize:22, marginBottom:8 }}>
            {game.result === "correct" ? "🎉" : "😔"}
          </div>
          <button onClick={newGame} disabled={loading} style={{
            padding:"10px 28px", borderRadius:12,
            border:`1.5px solid ${t.accentBorder}`, background:t.accentSoft,
            color:t.accent, fontSize:13, cursor:"pointer",
          }}>再来一题</button>
        </div>
      )}
    </div>
  );
}
