import { useState, useEffect } from "react";

const GIFTS = [
  { id: "flower", emoji: "🌸", label: "小花" },
  { id: "star", emoji: "⭐", label: "星星" },
  { id: "heart", emoji: "💝", label: "心心" },
  { id: "candy", emoji: "🍬", label: "糖果" },
  { id: "moon", emoji: "🌙", label: "月亮" },
  { id: "leaf", emoji: "🍃", label: "叶子" },
];

export default function GiftBoard({ theme: t }) {
  const [input, setInput] = useState("");
  const [author, setAuthor] = useState("");
  const [selectedGift, setSelectedGift] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/board")
      .then(r => r.json())
      .then(d => { setMessages(d.messages || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/board", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          author: author.trim() || "访客",
          text: input.trim(),
          gift: selectedGift || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessages(prev => [data.entry, ...prev]);
        setInput("");
        setAuthor("");
        setSelectedGift(null);
        setSent(true);
        setTimeout(() => setSent(false), 2000);
      }
    } catch {}
    setSending(false);
  }

  return (
    <section style={{ padding: "48px 24px 80px", fontFamily: "sans-serif" }}>
      <div style={{
        fontSize: 11,
        letterSpacing: "0.3em",
        color: t.textMuted,
        textAlign: "center",
        marginBottom: 32,
        textTransform: "uppercase",
      }}>
        留言 · 送小礼物
      </div>

      <div style={{ maxWidth: 380, margin: "0 auto" }}>
        <div style={{
          background: t.surface,
          borderRadius: 20,
          border: `1px solid ${t.surfaceBorder}`,
          padding: "20px",
          marginBottom: 20,
          backdropFilter: "blur(12px)",
        }}>
          <input
            value={author}
            onChange={e => setAuthor(e.target.value)}
            placeholder="你的名字（可选）"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "8px 0", border: "none",
              borderBottom: `1px solid ${t.surfaceBorder}`,
              background: "transparent", color: t.text,
              fontSize: 12, fontFamily: "sans-serif",
              outline: "none", marginBottom: 10,
            }}
          />
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="给笃 & 黎留句话..."
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px 0", border: "none",
              borderBottom: `1px solid ${t.surfaceBorder}`,
              background: "transparent", color: t.text,
              fontSize: 13, fontFamily: "sans-serif",
              outline: "none", resize: "none", lineHeight: 1.7,
            }}
          />

          <div style={{ display: "flex", gap: 8, marginTop: 14, marginBottom: 14, flexWrap: "wrap" }}>
            {GIFTS.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGift(selectedGift === g.emoji ? null : g.emoji)}
                style={{
                  padding: "6px 10px", borderRadius: 10,
                  border: `1.5px solid ${selectedGift === g.emoji ? t.accentBorder : t.surfaceBorder}`,
                  background: selectedGift === g.emoji ? t.accentSoft : "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  transition: "all 0.15s", fontFamily: "sans-serif",
                }}
              >
                <span style={{ fontSize: 16 }}>{g.emoji}</span>
                <span style={{ fontSize: 10, color: t.textMuted }}>{g.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            style={{
              width: "100%", padding: "12px 0", borderRadius: 12,
              border: `1.5px solid ${t.accentBorder}`,
              background: sent ? t.accentBorder : t.accentSoft,
              color: sent ? "white" : t.accent,
              fontSize: 13, cursor: sending ? "default" : "pointer",
              fontFamily: "sans-serif", transition: "all 0.2s", fontWeight: 600,
              opacity: sending ? .6 : 1,
            }}
          >
            {sent ? "已送出 ♡" : sending ? "送出中…" : "送出去"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? (
            <div style={{ textAlign:"center", color:t.textMuted, fontSize:12, padding:"20px 0" }}>加载中…</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign:"center", color:t.textMuted, fontSize:12, padding:"20px 0" }}>还没有留言，来第一个</div>
          ) : messages.map((m, i) => (
            <div key={i} style={{
              background: t.surface, borderRadius: 16,
              border: `1px solid ${t.surfaceBorder}`,
              padding: "14px 16px", backdropFilter: "blur(12px)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.textSub }}>{m.author}</span>
                <span style={{ fontSize: 10, color: t.textMuted }}>{m.time}</span>
              </div>
              <div style={{ fontSize: 13, color: t.text, lineHeight: 1.7 }}>
                {m.gift && <span style={{ marginRight: 6 }}>{m.gift}</span>}
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: t.textMuted, lineHeight: 1.8 }}>
          On est bien ici.
        </div>
      </div>
    </section>
  );
}
