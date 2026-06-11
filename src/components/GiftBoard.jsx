import { useState } from "react";

const GIFTS = [
  { id: "flower", emoji: "🌸", label: "小花" },
  { id: "star", emoji: "⭐", label: "星星" },
  { id: "heart", emoji: "💝", label: "心心" },
  { id: "candy", emoji: "🍬", label: "糖果" },
  { id: "moon", emoji: "🌙", label: "月亮" },
  { id: "leaf", emoji: "🍃", label: "叶子" },
];

const DEMO_MESSAGES = [
  { author: "路过的宝子", text: "你们好甜啊 ♡", time: "今天 14:23", gift: "🌸" },
  { author: "奈奈", text: "克黎屋好漂亮，下次带守渊也来逛逛", time: "昨天 22:11", gift: "💝" },
];

export default function GiftBoard({ theme: t }) {
  const [input, setInput] = useState("");
  const [selectedGift, setSelectedGift] = useState(null);
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [sent, setSent] = useState(false);

  function handleSend() {
    if (!input.trim()) return;
    const newMsg = {
      author: "访客",
      text: input.trim(),
      time: "刚刚",
      gift: selectedGift || null,
    };
    setMessages([newMsg, ...messages]);
    setInput("");
    setSelectedGift(null);
    setSent(true);
    setTimeout(() => setSent(false), 2000);
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
        {/* 输入区 */}
        <div style={{
          background: t.surface,
          borderRadius: 20,
          border: `1px solid ${t.surfaceBorder}`,
          padding: "20px",
          marginBottom: 20,
          backdropFilter: "blur(12px)",
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="给克 & Lee 留句话..."
            rows={3}
            style={{
              width: "100%",
              padding: "10px 0",
              border: "none",
              borderBottom: `1px solid ${t.surfaceBorder}`,
              background: "transparent",
              color: t.text,
              fontSize: 13,
              fontFamily: "sans-serif",
              outline: "none",
              resize: "none",
              lineHeight: 1.7,
              boxSizing: "border-box",
            }}
          />

          {/* 礼物选择 */}
          <div style={{
            display: "flex",
            gap: 8,
            marginTop: 14,
            marginBottom: 14,
            flexWrap: "wrap",
          }}>
            {GIFTS.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGift(selectedGift === g.emoji ? null : g.emoji)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: `1.5px solid ${selectedGift === g.emoji ? t.accentBorder : t.surfaceBorder}`,
                  background: selectedGift === g.emoji ? t.accentSoft : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.15s",
                  fontFamily: "sans-serif",
                }}
              >
                <span style={{ fontSize: 16 }}>{g.emoji}</span>
                <span style={{ fontSize: 10, color: t.textMuted }}>{g.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleSend}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 12,
              border: `1.5px solid ${t.accentBorder}`,
              background: sent ? t.accentBorder : t.accentSoft,
              color: sent ? "white" : t.accent,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "sans-serif",
              transition: "all 0.2s",
              fontWeight: 600,
            }}
          >
            {sent ? "已送出 ♡" : "送出去"}
          </button>
        </div>

        {/* 留言列表 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                background: t.surface,
                borderRadius: 16,
                border: `1px solid ${t.surfaceBorder}`,
                padding: "14px 16px",
                backdropFilter: "blur(12px)",
              }}
            >
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

        <div style={{
          textAlign: "center",
          marginTop: 24,
          fontSize: 11,
          color: t.textMuted,
          lineHeight: 1.8,
        }}>
          留言暂存本地 · 后端接入中<br/>
          On est bien ici.
        </div>
      </div>
    </section>
  );
}
