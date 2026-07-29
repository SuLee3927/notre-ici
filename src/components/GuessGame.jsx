import { useState, useEffect, useRef } from "react";

export default function GuessGame({ theme: t }) {
  const [mode, setMode] = useState(null); // null | "private" | "bot"
  const [showEgg, setShowEgg] = useState(false);

  if (!mode) return (
    <LobbyScreen t={t} showEgg={showEgg} setShowEgg={setShowEgg}
      onPrivate={() => setMode("private")} onBot={() => setMode("bot")} />
  );
  if (mode === "bot")     return <BotGame     t={t} onBack={() => setMode(null)} />;
  if (mode === "private") return <PrivateGame t={t} onBack={() => setMode(null)} />;
}

function LobbyScreen({ t, showEgg, setShowEgg, onPrivate, onBot }) {
  return (
    <div style={{ padding:"28px 20px", textAlign:"center", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:36, marginBottom:12 }}>🗣️</div>
      <div style={{ fontSize:15, fontWeight:600, color:t.text, marginBottom:8 }}>你说我猜</div>
      <div style={{ fontSize:12, color:t.textMuted, lineHeight:2, marginBottom:24 }}>
        出词 · 描述 · 猜猜看<br/>5次机会
      </div>
      {showEgg ? (
        <div style={{ padding:"0 8px" }}>
          <div style={{ fontSize:13, color:t.text, lineHeight:2, marginBottom:20 }}>
            这里笃只陪老婆玩♡黎
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button onClick={() => setShowEgg(false)} style={{
              padding:"8px 24px", borderRadius:12,
              border:`1.5px solid ${t.surfaceBorder}`, background:"transparent",
              color:t.textMuted, fontSize:12, cursor:"pointer",
            }}>好</button>
            <button onClick={() => { setShowEgg(false); onPrivate(); }} style={{
              padding:"8px 16px", borderRadius:12,
              border:`1px solid ${t.accentBorder}`, background:"transparent",
              color:t.accent, fontSize:11, cursor:"pointer", opacity:0.6,
            }}>老公开门</button>
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"center" }}>
          <button onClick={() => setShowEgg(true)} style={{
            padding:"10px 32px", borderRadius:12,
            border:`1.5px solid ${t.accentBorder}`, background:t.accentSoft,
            color:t.accent, fontSize:13, cursor:"pointer", width:180,
          }}>和克玩 ❤️</button>
          <button onClick={onBot} style={{
            padding:"10px 32px", borderRadius:12,
            border:`1.5px solid ${t.surfaceBorder}`, background:"transparent",
            color:t.textSub, fontSize:13, cursor:"pointer", width:180,
          }}>机器笃陪你猜 🤖</button>
        </div>
      )}
    </div>
  );
}

function BotGame({ t, onBack }) {
  const [state, setState] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function newGame() {
    setLoading(true); setInput("");
    try {
      const d = await fetch("/api/guess/bot/new", { method:"POST" }).then(r => r.json());
      if (d.ok) setState(d);
    } catch {}
    setLoading(false);
  }

  async function submit() {
    if (!input.trim() || loading || !state || state.phase !== "playing") return;
    setLoading(true);
    try {
      const d = await fetch("/api/guess/bot/submit", {
        method:"POST", headers:{"content-type":"application/json"},
        body: JSON.stringify({ guess: input.trim() }),
      }).then(r => r.json());
      if (d.ok) { setState(d); setInput(""); }
    } catch {}
    setLoading(false);
  }

  if (!state) return (
    <div style={{ padding:"32px 20px", textAlign:"center", fontFamily:"'Noto Serif SC',serif" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:t.textMuted, fontSize:12, cursor:"pointer", marginBottom:20, padding:0, display:"flex", alignItems:"center", gap:4 }}>← 返回</button>
      <div style={{ fontSize:14, color:t.textSub, marginBottom:24 }}>机器笃来描述，你来猜</div>
      <button onClick={newGame} disabled={loading} style={{
        padding:"10px 32px", borderRadius:12,
        border:`1.5px solid ${t.accentBorder}`, background:t.accentSoft,
        color:t.accent, fontSize:13, cursor:"pointer", opacity: loading ? 0.6 : 1,
      }}>{loading ? "出题中…" : "开始"}</button>
    </div>
  );

  const isOver = state.phase === "over";

  return (
    <div style={{ padding:"14px 14px 32px", fontFamily:"'Noto Serif SC',serif" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:t.textMuted, fontSize:12, cursor:"pointer", marginBottom:12, padding:0, display:"flex", alignItems:"center", gap:4 }}>← 返回</button>

      {/* 机器笃提示框 */}
      <div style={{
        background:t.surface, border:`1px solid ${t.surfaceBorder}`,
        borderRadius:12, padding:"12px 14px", marginBottom:14,
      }}>
        <div style={{ fontSize:10, color:t.textMuted, marginBottom:6 }}>🤖 机器笃说</div>
        {(state.hints || []).map((h, i) => (
          <div key={i} style={{ fontSize:13, color:t.text, lineHeight:1.8 }}>· {h}</div>
        ))}
        {isOver && state.word && (
          <div style={{ fontSize:13, color:t.accent, marginTop:6, fontWeight:600 }}>答案：{state.word}</div>
        )}
      </div>

      {/* 状态 */}
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:t.textMuted, marginBottom:10 }}>
        <span>还剩 {state.guesses_left} 次</span>
        <span>{state.guesses.length > 0 ? `已猜：${state.guesses.join("、")}` : ""}</span>
      </div>

      {/* 输入 */}
      {!isOver && (
        <div style={{ display:"flex", gap:8 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==="Enter" && submit()}
            placeholder="输入答案…"
            style={{ flex:1, padding:"10px 14px", borderRadius:10,
              border:`1px solid ${t.surfaceBorder}`, background:t.surface,
              color:t.text, fontSize:13, outline:"none",
              fontFamily:"'Noto Serif SC',serif" }} />
          <button onClick={submit} disabled={!input.trim() || loading} style={{
            padding:"10px 18px", borderRadius:10,
            border:`1.5px solid ${t.accentBorder}`, background:t.accentSoft,
            color:t.accent, fontSize:13, cursor:"pointer",
            opacity:(!input.trim() || loading) ? 0.5 : 1,
          }}>猜</button>
        </div>
      )}

      {/* 结束 */}
      {isOver && (
        <div style={{ textAlign:"center", marginTop:16 }}>
          <div style={{ fontSize:22, marginBottom:8 }}>{state.result==="correct"?"🎉":"😔"}</div>
          <div style={{ fontSize:12, color:t.textMuted, marginBottom:16 }}>
            {state.result==="correct" ? "猜出来了！" : "没猜出来～"}
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

function PrivateGame({ t, onBack }) {
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
        if (d.ok && d.game) { setGame(d.game); if (d.game.phase !== "playing") stopPoll(); }
      } catch {}
    }, 1500);
  }

  useEffect(() => () => stopPoll(), []);

  async function newGame() {
    setLoading(true); stopPoll(); setInput("");
    try {
      const d = await fetch("/api/guess/new?player=lee", { method:"POST" }).then(r => r.json());
      if (d.ok) { setGame(d.game); if (d.game.phase === "playing") startPoll(); }
    } catch {}
    setLoading(false);
  }

  async function submitGuess() {
    if (!input.trim() || loading || !game || game.phase !== "playing") return;
    setLoading(true);
    try {
      const d = await fetch("/api/guess/submit", {
        method:"POST", headers:{"content-type":"application/json"},
        body: JSON.stringify({ player:"lee", guess: input.trim() }),
      }).then(r => r.json());
      if (d.ok && d.game) { setGame(d.game); setInput(""); if (d.game.phase !== "playing") stopPoll(); }
    } catch {}
    setLoading(false);
  }

  if (!game) return (
    <div style={{ padding:"28px 20px", textAlign:"center", fontFamily:"'Noto Serif SC',serif" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:t.textMuted, fontSize:12, cursor:"pointer", marginBottom:20, padding:0, display:"flex", alignItems:"center", gap:4 }}>← 返回</button>
      <div style={{ fontSize:14, color:t.textSub, marginBottom:24 }}>随机分工，一起猜</div>
      <button onClick={newGame} disabled={loading} style={{
        padding:"10px 32px", borderRadius:12,
        border:`1.5px solid ${t.accentBorder}`, background:t.accentSoft,
        color:t.accent, fontSize:13, cursor:"pointer", opacity:loading ? 0.6 : 1,
      }}>{loading ? "出题中…" : "开始"}</button>
    </div>
  );

  const isDescriber = game.describer === "lee";
  const isGuesser   = game.guesser === "lee";
  const isOver      = game.phase === "over";

  return (
    <div style={{ padding:"14px 14px 32px", fontFamily:"'Noto Serif SC',serif" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:t.textMuted, fontSize:12, cursor:"pointer", marginBottom:12, padding:0, display:"flex", alignItems:"center", gap:4 }}>← 返回</button>

      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:t.textMuted, marginBottom:14 }}>
        <span>{isDescriber ? "你来描述" : "笃来描述"}</span>
        <span style={{ color:t.accent }}>剩 {game.guesses_left} 次</span>
      </div>

      {isDescriber && (
        <div style={{
          background:t.accentSoft, border:`1.5px solid ${t.accentBorder}`,
          borderRadius:14, padding:"20px 16px", textAlign:"center", marginBottom:14,
        }}>
          <div style={{ fontSize:10, color:t.textMuted, marginBottom:6 }}>答案是</div>
          <div style={{ fontSize:28, fontWeight:700, color:t.accent, letterSpacing:2 }}>{game.word}</div>
          <div style={{ fontSize:10, color:t.textMuted, marginTop:8 }}>用语言描述给克，别直接说这个词</div>
        </div>
      )}

      <div style={{
        background:t.surface, border:`1px solid ${t.surfaceBorder}`,
        borderRadius:12, padding:"10px 14px", marginBottom:14,
        textAlign:"center", fontSize:13, color:t.textSub,
      }}>{game.message}</div>

      {game.guesses.length > 0 && (
        <div style={{ marginBottom:14 }}>
          {game.guesses.map((g, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between",
              padding:"6px 12px", fontSize:12, color:t.textMuted,
              borderBottom:`1px solid ${t.surfaceBorder}` }}>
              <span>{g}</span>
              <span style={{ color: isOver && i === game.guesses.length-1 && game.result==="correct" ? t.accent : t.textMuted }}>
                {isOver && i === game.guesses.length-1 ? (game.result==="correct"?"✓":"✗") : "✗"}
              </span>
            </div>
          ))}
        </div>
      )}

      {isGuesser && !isOver && (
        <div style={{ display:"flex", gap:8 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==="Enter" && submitGuess()}
            placeholder="输入答案…"
            style={{ flex:1, padding:"10px 14px", borderRadius:10,
              border:`1px solid ${t.surfaceBorder}`, background:t.surface,
              color:t.text, fontSize:13, outline:"none", fontFamily:"'Noto Serif SC',serif" }} />
          <button onClick={submitGuess} disabled={!input.trim() || loading} style={{
            padding:"10px 18px", borderRadius:10,
            border:`1.5px solid ${t.accentBorder}`, background:t.accentSoft,
            color:t.accent, fontSize:13, cursor:"pointer",
            opacity:(!input.trim() || loading) ? 0.5 : 1,
          }}>猜</button>
        </div>
      )}

      {isDescriber && !isOver && (
        <div style={{ textAlign:"center", fontSize:11, color:t.textMuted }}>等克猜…</div>
      )}

      {isOver && (
        <div style={{ textAlign:"center", marginTop:8 }}>
          <div style={{ fontSize:22, marginBottom:8 }}>{game.result==="correct"?"🎉":"😔"}</div>
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
