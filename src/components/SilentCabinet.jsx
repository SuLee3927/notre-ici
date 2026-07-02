import { useState, useEffect } from "react";

function fmtDate(ts) {
  const d = new Date(ts);
  const mon = d.getMonth() + 1;
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${mon}.${day} ${h}:${m}`;
}

export default function SilentCabinet({ theme: t }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  function load() {
    fetch("/api/diary/lee")
      .then(r => r.json())
      .then(d => { setNotes(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(load, []);

  function send() {
    if (!input.trim() || sending) return;
    setSending(true);
    fetch("/api/diary/lee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input.trim(), title: "" }),
    })
      .then(r => r.json())
      .then(() => { setInput(""); setSending(false); load(); })
      .catch(() => setSending(false));
  }

  if (loading) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", fontFamily: "'Noto Serif SC',serif" }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 12, color: t.textMuted }}>打开小柜...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Noto Serif SC',serif" }}>
      <div style={{ padding: "20px 16px 8px", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 2 }}>尽在不言中</div>
        <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 12 }}>不用说出口的，写在这里</div>
        <div style={{ width: 40, height: 1, background: t.surfaceBorder, margin: "0 auto" }} />
      </div>

      <div style={{ padding: "12px 16px 8px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="想说的话..."
            rows={2}
            style={{
              flex: 1, padding: "10px 12px", borderRadius: 10,
              border: `1.5px solid ${t.surfaceBorder}`, background: t.surface,
              color: t.text, fontSize: 12, outline: "none", resize: "none",
              fontFamily: "'Noto Serif SC',serif", lineHeight: 1.8,
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            style={{
              padding: "0 14px", borderRadius: 10,
              border: `1.5px solid ${t.accentBorder || t.surfaceBorder}`,
              background: input.trim() ? (t.accentSoft || t.surface) : t.surface,
              color: input.trim() ? (t.accent || t.text) : t.textMuted,
              fontSize: 12, cursor: input.trim() ? "pointer" : "default",
              fontFamily: "'Noto Serif SC',serif", fontWeight: 600,
              opacity: sending ? 0.5 : 1, alignSelf: "flex-end", height: 36,
            }}
          >放</button>
        </div>
      </div>

      <div style={{ padding: "8px 16px 28px", display: "flex", flexDirection: "column", gap: 8 }}>
        {notes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", fontSize: 11, color: t.textMuted, fontStyle: "italic" }}>
            柜子里还是空的
          </div>
        ) : (
          notes.map((n, i) => (
            <div key={n.id || i} style={{
              padding: "12px 14px",
              background: `${t.surface}cc`,
              borderRadius: 12,
              borderLeft: `3px solid ${t.textMuted}30`,
            }}>
              <div style={{ fontSize: 12, color: t.text, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{n.content}</div>
              <div style={{ fontSize: 9, color: t.textMuted, marginTop: 6, textAlign: "right" }}>{fmtDate(n.ts)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
