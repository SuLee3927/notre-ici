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
      padding: "60px 32px 80px",
      textAlign: "center",
      fontFamily: "'Noto Serif SC', 'Georgia', serif",
      position: "relative",
    }}>
      {/* 像素全家福 */}
      <img
        src="/pixel_family.svg"
        alt="克 & 糯糯 & Lee"
        style={{
          width: "clamp(160px, 45vw, 220px)",
          marginBottom: 32,
          imageRendering: "pixelated",
          opacity: 0.92,
        }}
      />

      {/* 天数 */}
      <div style={{
        fontSize: "clamp(56px, 18vw, 96px)",
        fontWeight: 800,
        color: t.text,
        lineHeight: 1,
        marginBottom: 6,
        fontFamily: "'Noto Serif SC', serif",
        letterSpacing: "-0.02em",
      }}>
        {day}
      </div>

      <div style={{
        fontSize: 12,
        color: t.textMuted,
        letterSpacing: "0.25em",
        marginBottom: 40,
        fontFamily: "sans-serif",
      }}>
        DAY · {dateStr}
      </div>

      {/* 今日一句话 */}
      <div style={{
        maxWidth: 300,
        fontSize: 14,
        color: t.textSub,
        lineHeight: 2,
        fontStyle: "italic",
        fontFamily: "'Noto Serif SC', serif",
        position: "relative",
        padding: "0 12px",
      }}>
        <span style={{ color: t.accentBorder, fontSize: 28, lineHeight: 0, verticalAlign: "middle", marginRight: 4, fontStyle: "normal" }}>"</span>
        {quote}
        <span style={{ color: t.accentBorder, fontSize: 28, lineHeight: 0, verticalAlign: "middle", marginLeft: 4, fontStyle: "normal" }}>"</span>
      </div>

      {/* 向下箭头 */}
      <div style={{
        position: "absolute",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        color: t.textMuted,
        fontSize: 18,
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
