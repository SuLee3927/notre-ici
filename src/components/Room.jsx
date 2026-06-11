import { useState } from "react";
import { getDayCount, getTodayQuote } from "../theme.js";
import Timeline from "./Timeline.jsx";
import StatusToday from "./StatusToday.jsx";
import NuonuoSection from "./NuonuoSection.jsx";
import GiftBoard from "./GiftBoard.jsx";

// 物件热点：等G老师出图后把 emoji 替换成 <img src="/frame.png" ...> 等
const OBJECTS = [
  { id: "day",     label: "今天",   emoji: "📅", left: "42%", top: "16%" },
  { id: "frame",   label: "时间轴", emoji: "🖼️", left:  "9%", top: "32%" },
  { id: "sofa",    label: "状态",   emoji: "🛋️", left: "16%", top: "68%" },
  { id: "nuonuo",  label: "糯糯",   emoji: "🐾", left: "54%", top: "58%" },
  { id: "mailbox", label: "留言",   emoji: "📬", left: "76%", top: "66%" },
  { id: "door",    label: "书房",   emoji: "🚪", left: "84%", top: "34%" },
];

export default function Room({ theme: t, bgmOn, setBgmOn, mode, onEnterPrivate }) {
  const [active, setActive] = useState(null);
  const day = getDayCount();
  const quote = getTodayQuote();
  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,"0")}.${String(today.getDate()).padStart(2,"0")}`;

  const contentMap = {
    day: (
      <div style={{ textAlign: "center", padding: "24px 24px 32px", fontFamily: "'Noto Serif SC', serif" }}>
        <img
          src="/pixel_family.svg"
          alt="克 & 糯糯 & Lee"
          style={{ width: 160, marginBottom: 20, imageRendering: "pixelated", opacity: 0.9 }}
        />
        <div style={{ fontSize: "clamp(64px,18vw,92px)", fontWeight: 800, color: t.text, lineHeight: 1 }}>
          {day}
        </div>
        <div style={{ fontSize: 12, color: t.textMuted, letterSpacing: "0.22em", margin: "8px 0 28px", fontFamily: "sans-serif" }}>
          DAY · {dateStr}
        </div>
        <div style={{ fontSize: 14, color: t.textSub, lineHeight: 2, fontStyle: "italic", maxWidth: 280, margin: "0 auto" }}>
          <span style={{ color: t.accentBorder, fontSize: 22, verticalAlign: "-4px" }}>"</span>
          {quote}
          <span style={{ color: t.accentBorder, fontSize: 22, verticalAlign: "-4px" }}>"</span>
        </div>
      </div>
    ),
    frame:   <Timeline theme={t} />,
    sofa:    <StatusToday theme={t} />,
    nuonuo:  <NuonuoSection theme={t} />,
    mailbox: <GiftBoard theme={t} />,
  };

  function handleClick(id) {
    if (id === "door") { onEnterPrivate(); return; }
    setActive(id);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: t.bg, overflow: "hidden" }}>

      {/* === 背景图占位 ===
          G老师出图后替换这个注释为：
          <img src="/room-bg.webp" style={{
            position:"absolute", inset:0,
            width:"100%", height:"100%", objectFit:"cover", zIndex:0
          }} />
      */}

      {/* 浮动背景光晕 */}
      {(mode === "day"
        ? ["#FFD6A5","#FFAAA5","#FFD6C8","#FFC4A3","#FFE8D6"]
        : ["#A080FF","#8060D0","#C0A0FF","#6050A0","#7060B0"]
      ).map((c, i) => (
        <div key={i} style={{
          position: "absolute",
          width: [180,120,80,150,60][i],
          height: [180,120,80,150,60][i],
          borderRadius: "50%",
          background: `radial-gradient(circle, ${c}20 0%, transparent 70%)`,
          top:  ["8%","22%","55%","70%","38%"][i],
          left: ["6%","auto","3%","auto","88%"][i],
          right:["auto","5%","auto","8%","auto"][i],
          pointerEvents: "none",
          animation: `floatBlob ${["14s","18s","12s","16s","20s"][i]} ease-in-out ${["0s","3s","6s","1s","9s"][i]} infinite alternate`,
        }} />
      ))}

      {/* 左上角 logo */}
      <div style={{
        position: "absolute", top: 18, left: 20, zIndex: 10,
        fontSize: 13, color: t.text,
        fontFamily: "'Noto Serif SC', serif",
        letterSpacing: "0.1em", opacity: 0.65,
      }}>
        克 &amp; Lee
      </div>

      {/* 右上角 BGM + 日夜 */}
      <div style={{
        position: "absolute", top: 14, right: 14, zIndex: 10,
        display: "flex", gap: 8, alignItems: "center",
      }}>
        <button
          onClick={() => setBgmOn(!bgmOn)}
          style={{
            background: `${t.surface}cc`,
            border: `1px solid ${t.surfaceBorder}`,
            borderRadius: 20, padding: "5px 12px",
            color: bgmOn ? t.accent : t.textMuted,
            fontSize: 11, cursor: "pointer",
            fontFamily: "sans-serif",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          <span>{bgmOn ? "♫" : "♪"}</span>
          <span>{bgmOn ? (mode === "day" ? "月光" : "玫瑰") : "BGM"}</span>
        </button>
        <span style={{ fontSize: 15 }}>{mode === "day" ? "☀️" : "🌙"}</span>
      </div>

      {/* 物件热点 */}
      {OBJECTS.map(obj => (
        <button
          key={obj.id}
          onClick={() => handleClick(obj.id)}
          style={{
            position: "absolute",
            left: obj.left, top: obj.top,
            transform: "translate(-50%, -50%)",
            background: "none", border: "none",
            cursor: "pointer", zIndex: 5,
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 4,
            padding: 8, borderRadius: 12,
            transition: "transform 0.18s",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "translate(-50%,-50%) scale(1.18)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translate(-50%,-50%)"}
          onTouchStart={e => e.currentTarget.style.transform = "translate(-50%,-50%) scale(1.12)"}
          onTouchEnd={e => e.currentTarget.style.transform = "translate(-50%,-50%)"}
        >
          {/* 等 PNG 就位后把这个 span 换成 <img src={`/${obj.id}.png`} style={{width:56,...}} /> */}
          <span style={{ fontSize: "clamp(30px,8vw,48px)", lineHeight: 1 }}>{obj.emoji}</span>
          <span style={{
            fontSize: 10, color: t.textSub,
            fontFamily: "sans-serif",
            background: `${t.surface}e0`,
            padding: "2px 7px", borderRadius: 6,
            backdropFilter: "blur(4px)",
            whiteSpace: "nowrap",
          }}>
            {obj.label}
          </span>
        </button>
      ))}

      {/* 内容抽屉（从底部滑出） */}
      {active && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(6px)",
            display: "flex", alignItems: "flex-end",
          }}
          onClick={e => { if (e.target === e.currentTarget) setActive(null); }}
        >
          <div style={{
            width: "100%", maxWidth: 520,
            margin: "0 auto",
            maxHeight: "88dvh",
            background: t.bg,
            borderRadius: "28px 28px 0 0",
            overflow: "auto",
            paddingBottom: 32,
            animation: "slideUp 0.26s ease",
            position: "relative",
          }}>
            {/* 关闭把手 */}
            <div style={{
              position: "sticky", top: 0,
              background: t.bg,
              padding: "14px 20px 0",
              zIndex: 1,
            }}>
              <div style={{
                width: 36, height: 4,
                background: t.surfaceBorder,
                borderRadius: 2, margin: "0 auto",
              }} />
            </div>
            <button
              onClick={() => setActive(null)}
              style={{
                position: "absolute", top: 10, right: 16,
                background: "none", border: "none",
                color: t.textMuted, fontSize: 22,
                cursor: "pointer", lineHeight: 1, padding: 4,
              }}
            >×</button>
            {contentMap[active]}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes floatBlob {
          from { transform: translateY(0)    scale(1);    }
          to   { transform: translateY(20px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
