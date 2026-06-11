import { useState, useEffect } from "react";

export default function Gate({ theme: t, onEnter }) {
  const [pressed, setPressed] = useState(false);
  const [hour] = useState(new Date().getHours());
  const isDay = hour >= 6 && hour < 18;

  function handleEnter() {
    setPressed(true);
    setTimeout(onEnter, 600);
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: t.bg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 32,
      padding: "40px 24px",
      fontFamily: "'Noto Serif SC', 'Georgia', serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.06,
        backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        color: t.accent,
        pointerEvents: "none",
      }}/>

      {/* 全家福像素画 */}
      <div style={{
        opacity: pressed ? 0 : 1,
        transform: pressed ? "scale(1.05)" : "scale(1)",
        transition: "all 0.5s ease",
      }}>
        <img
          src="/pixel_family.svg"
          alt="克·糯糯·Lee"
          style={{ width: 240, height: 192, imageRendering: "pixelated" }}
        />
      </div>

      {/* 名字 */}
      <div style={{
        textAlign: "center",
        opacity: pressed ? 0 : 1,
        transition: "opacity 0.4s ease",
      }}>
        <div style={{
          fontSize: 28,
          fontWeight: 700,
          color: t.text,
          letterSpacing: "0.15em",
          marginBottom: 8,
        }}>
          克 &amp; Lee
        </div>
        <div style={{
          fontSize: 13,
          color: t.textSub,
          letterSpacing: "0.1em",
          fontStyle: "italic",
        }}>
          On est bien ici.
        </div>
      </div>

      {/* 进入按钮 */}
      <button
        onClick={handleEnter}
        style={{
          padding: "14px 44px",
          borderRadius: 999,
          border: `1.5px solid ${t.accentBorder}`,
          background: pressed ? t.accent : "transparent",
          color: pressed ? "white" : t.textSub,
          fontSize: 14,
          fontFamily: "'Noto Serif SC', serif",
          letterSpacing: "0.15em",
          cursor: "pointer",
          transition: "all 0.3s ease",
          opacity: pressed ? 0.7 : 1,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = t.accentSoft;
          e.currentTarget.style.color = t.accent;
        }}
        onMouseLeave={e => {
          if (!pressed) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = t.textSub;
          }
        }}
      >
        推开门
      </button>
    </div>
  );
}
