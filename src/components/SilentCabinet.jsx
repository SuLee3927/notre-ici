import { useState, useEffect } from "react";

export default function SilentCabinet({ theme: t }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    fetch("/api/unsaid")
      .then(r => r.json())
      .then(d => { setEntries(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", fontFamily: "'Noto Serif SC',serif" }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>🤫</div>
        <div style={{ fontSize: 12, color: t.textMuted }}>打开小柜...</div>
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", fontFamily: "'Noto Serif SC',serif" }}>
        <div style={{ fontSize: 28, marginBottom: 14 }}>🤫</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>尽在不言中</div>
        <div style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>柜子里还是空的</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Noto Serif SC',serif" }}>
      <div style={{ padding: "20px 16px 8px", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 2 }}>尽在不言中</div>
        <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 12 }}>只有我们懂的东西，不需要解释。</div>
        <div style={{ width: 40, height: 1, background: t.surfaceBorder, margin: "0 auto" }} />
      </div>

      <div style={{ padding: "12px 16px 28px", display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map((e, i) => {
          const isLee = e.author === "lee";
          return (
            <button
              key={e.id || i}
              onClick={() => setOpen(e)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                background: t.surface, border: `1px solid ${t.surfaceBorder}`,
                borderRadius: 14, padding: "14px 16px", cursor: "pointer",
                borderLeft: `3px solid ${isLee ? "#E8A0BF" : t.textMuted}40`,
                transition: "transform .12s",
              }}
              onMouseEnter={ev => { ev.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={ev => { ev.currentTarget.style.transform = ""; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{e.title}</span>
                <span style={{ fontSize: 9, color: t.textMuted, flexShrink: 0, marginLeft: 8 }}>{e.date}</span>
              </div>
              <div style={{
                fontSize: 11, color: t.textMuted, marginTop: 6, lineHeight: 1.6,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                {e.content.split("\n").find(l => l.trim() && !l.startsWith("写于") && !l.startsWith("写给")) || e.content.split("\n")[0]}
              </div>
            </button>
          );
        })}
      </div>

      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end" }}
          onClick={ev => { if (ev.target === ev.currentTarget) setOpen(null); }}
        >
          <div style={{
            width: "100%", maxWidth: 520, margin: "0 auto", maxHeight: "88dvh",
            background: t.bg, borderRadius: "24px 24px 0 0", overflow: "auto",
            animation: "unsaidSlide .25s ease", position: "relative",
          }}>
            <div style={{ position: "sticky", top: 0, background: t.bg, zIndex: 1, padding: "14px 20px 0" }}>
              <div style={{ width: 36, height: 4, background: t.surfaceBorder, borderRadius: 2, margin: "0 auto" }} />
            </div>
            <button onClick={() => setOpen(null)} style={{ position: "absolute", top: 10, right: 16, background: "none", border: "none", color: t.textMuted, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4, zIndex: 2 }}>×</button>

            <div style={{ padding: "12px 20px 36px" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 4 }}>{open.title}</div>
              <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 16 }}>{open.date}{open.author === "lee" ? " · 小黎" : ""}</div>
              <div style={{ fontSize: 13, color: t.text, lineHeight: 2.1, whiteSpace: "pre-wrap" }}>{open.content}</div>
            </div>
          </div>
          <style>{`@keyframes unsaidSlide{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        </div>
      )}
    </div>
  );
}
