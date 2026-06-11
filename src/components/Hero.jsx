import { getDayCount, getTodayQuote } from "../theme.js";

export default function Hero({ theme: t }) {
  const day = getDayCount();
  const quote = getTodayQuote();
  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,"0")}.${String(today.getDate()).padStart(2,"0")}`;

  return (
    <section style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 32px",
      textAlign: "center",
      fontFamily: "'Noto Serif SC', 'Georgia', serif",
    }}>
      {/* 天数 */}
      <div style={{
        fontSize: "clamp(72px, 22vw, 120px)",
        fontWeight: 800,
        color: t.text,
        lineHeight: 1,
        marginBottom: 4,
        fontFamily: "'Noto Serif SC', serif",
        letterSpacing: "-0.02em",
      }}>
        {day}
      </div>

      <div style={{
        fontSize: 13,
        color: t.textMuted,
        letterSpacing: "0.2em",
        marginBottom: 48,
        fontFamily: "sans-serif",
      }}>
        DAY · {dateStr}
      </div>

      {/* 今日一句话 */}
      <div style={{
        maxWidth: 320,
        fontSize: 15,
        color: t.textSub,
        lineHeight: 1.9,
        fontStyle: "italic",
        borderLeft: `3px solid ${t.accentBorder}`,
        paddingLeft: 16,
        textAlign: "left",
      }}>
        {quote}
      </div>

      {/* 向下箭头 */}
      <div style={{
        position: "absolute",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        color: t.textMuted,
        fontSize: 20,
        animation: "bobDown 2s ease-in-out infinite",
      }}>
        ↓
      </div>

      <style>{`
        @keyframes bobDown {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
      `}</style>
    </section>
  );
}
