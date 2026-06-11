import { useState, useEffect, useRef } from "react";

const RANDOM_BUBBLES = [
  "糯糯在想什么呢...",
  "妈咪和爸比什么时候来呀",
  "糯糯想吃糯米糍",
  "呼... 有点困",
  "糯糯是全世界最可爱的！",
  "嗯... 嗯...",
  "今天的阳光好暖 ☀",
  "有人吗？",
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// 简化版糯糯SVG（纯展示，不能互动）
function NuonuoDisplay() {
  const [blink, setBlink] = useState(false);
  const [tail, setTail] = useState(false);

  useEffect(() => {
    const t1 = setInterval(() => setBlink(true), 4000 + Math.random() * 2000);
    const t2 = setInterval(() => setBlink(false), 4200 + Math.random() * 2000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  return (
    <svg width="180" height="180" viewBox="-10 0 220 225" style={{ display: "block", margin: "0 auto", overflow: "visible" }}>
      <style>{`
        @keyframes breatheN { 0%,100%{transform:scaleY(1) scaleX(1)} 50%{transform:scaleY(1.03) scaleX(0.98)} }
        @keyframes floatN { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes tailWagN { 0%,100%{transform:rotate(-10deg)} 50%{transform:rotate(18deg)} }
        @keyframes earWigN { 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(6deg)} }
        .nn-body { animation: breatheN 3.2s ease-in-out infinite, floatN 4s ease-in-out infinite; transform-origin: center bottom; }
        .nn-tail { animation: tailWagN 1.8s ease-in-out infinite; transform-origin: 68px 155px; }
        .nn-earL { animation: earWigN 2.5s ease-in-out infinite; transform-origin: 50% 100%; }
        .nn-earR { animation: earWigN 2.5s ease-in-out infinite 0.3s; transform-origin: 50% 100%; }
        .nn-shadow { animation: shadowPulseN 4s ease-in-out infinite; transform-origin: center; }
        @keyframes shadowPulseN { 0%,100%{transform:scaleX(1);opacity:.18} 50%{transform:scaleX(.7);opacity:.08} }
      `}</style>
      <ellipse className="nn-shadow" cx="102" cy="216" rx="44" ry="7" fill="#C89870" />
      <g className="nn-body">
        <g className="nn-tail" style={{ transformOrigin: "68px 155px" }}>
          <path d="M68,155 Q46,145 37,128 Q28,111 40,103 Q50,97 55,109 Q48,119 54,130 Q61,142 72,148"
            fill="none" stroke="#EDD0B8" strokeWidth="10" strokeLinecap="round" />
          <path d="M68,155 Q46,145 37,128 Q28,111 40,103 Q50,97 55,109 Q48,119 54,130 Q61,142 72,148"
            fill="none" stroke="#FFFAF5" strokeWidth="6.5" strokeLinecap="round" />
        </g>
        <ellipse cx="102" cy="158" rx="54" ry="48" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5" />
        <ellipse cx="102" cy="164" rx="30" ry="26" fill="#FFF0E6" opacity=".5" />
        {/* 粉裙子 */}
        <rect x="60" y="133" width="84" height="10" rx="5" fill="#FFB0C8" opacity=".9"/>
        <path d="M56,143 Q48,170 44,198 L160,198 Q156,170 148,143 Z" fill="#FFD6E8" stroke="#FFB0C8" strokeWidth="2"/>
        <path d="M44,198 Q54,192 64,198 Q74,204 84,198 Q94,192 104,198 Q114,204 124,198 Q134,192 144,198 Q152,204 160,198" fill="none" stroke="#FFB0C8" strokeWidth="1.5"/>
        <path d="M93,136 Q102,131 102,136 Q102,141 93,136Z" fill="#FF90B8"/>
        <path d="M102,136 Q111,131 111,136 Q111,141 102,136Z" fill="#FF90B8"/>
        <circle cx="102" cy="136" r="3" fill="#FF70A0"/>
        {/* 肩膀 */}
        <ellipse cx="52" cy="158" rx="20" ry="13" fill="#FFD6E8" stroke="#FFB0C8" strokeWidth="2" transform="rotate(-22,52,158)" />
        <ellipse cx="152" cy="158" rx="20" ry="13" fill="#FFD6E8" stroke="#FFB0C8" strokeWidth="2" transform="rotate(22,152,158)" />
        <ellipse cx="54" cy="170" rx="17" ry="13" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5" transform="rotate(-20,54,170)" />
        <ellipse cx="150" cy="170" rx="17" ry="13" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5" transform="rotate(20,150,170)" />
        <ellipse cx="82" cy="200" rx="18" ry="11" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5" />
        <ellipse cx="122" cy="200" rx="18" ry="11" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5" />
        <ellipse cx="102" cy="98" rx="54" ry="51" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5" />
        <ellipse className="nn-earL" cx="62" cy="56" rx="19" ry="20" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5" />
        <ellipse cx="62" cy="57" rx="11" ry="12" fill="#FFCCC8" opacity=".75" />
        <ellipse className="nn-earR" cx="142" cy="56" rx="19" ry="20" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5" />
        <ellipse cx="142" cy="57" rx="11" ry="12" fill="#FFCCC8" opacity=".75" />
        {/* 眼睛 */}
        {blink ? (
          <>
            <path d="M82,96 Q90,102 98,96" fill="none" stroke="#5A3828" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M106,96 Q114,102 122,96" fill="none" stroke="#5A3828" strokeWidth="2.8" strokeLinecap="round" />
          </>
        ) : (
          <>
            <g><ellipse cx="90" cy="96" rx="8.5" ry="9" fill="#5A3828" /><circle cx="92" cy="93" r="3" fill="white" opacity=".65" /></g>
            <g><ellipse cx="114" cy="96" rx="8.5" ry="9" fill="#5A3828" /><circle cx="116" cy="93" r="3" fill="white" opacity=".65" /></g>
          </>
        )}
        <ellipse cx="102" cy="110" rx="4.5" ry="3.5" fill="#EAAA9A" />
        <path d="M94,117 Q102,123 110,117" fill="none" stroke="#C07060" strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="76" cy="114" rx="14" ry="9" fill="#FFB0A0" opacity=".52" />
        <ellipse cx="128" cy="114" rx="14" ry="9" fill="#FFB0A0" opacity=".52" />
      </g>
    </svg>
  );
}

export default function NuonuoSection({ theme: t }) {
  const [bubble, setBubble] = useState("");
  const timer = useRef(null);

  useEffect(() => {
    const t1 = setInterval(() => {
      setBubble(pick(RANDOM_BUBBLES));
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setBubble(""), 3000);
    }, 6000);
    setTimeout(() => setBubble(pick(RANDOM_BUBBLES)), 1000);
    return () => clearInterval(t1);
  }, []);

  return (
    <section style={{ padding: "48px 24px", textAlign: "center" }}>
      <div style={{
        fontSize: 11,
        letterSpacing: "0.3em",
        color: t.textMuted,
        marginBottom: 32,
        fontFamily: "sans-serif",
        textTransform: "uppercase",
      }}>
        糯糯 · 只能看不能摸
      </div>

      <div style={{
        maxWidth: 280,
        margin: "0 auto",
        background: t.surface,
        borderRadius: 28,
        border: `1px solid ${t.surfaceBorder}`,
        padding: "28px 20px 20px",
        backdropFilter: "blur(12px)",
        position: "relative",
      }}>
        {/* 气泡 */}
        {bubble && (
          <div style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            background: t.surface,
            border: `1.5px solid ${t.surfaceBorder}`,
            borderRadius: 12,
            padding: "6px 14px",
            fontSize: 12,
            color: t.textSub,
            whiteSpace: "nowrap",
            zIndex: 10,
            animation: "fadeInUpN .2s ease",
            boxShadow: "0 2px 8px rgba(0,0,0,.08)",
          }}>
            {bubble}
          </div>
        )}

        <NuonuoDisplay />

        <div style={{
          marginTop: 12,
          fontSize: 11,
          color: t.textMuted,
          fontFamily: "sans-serif",
        }}>
          爸比：克先生 · 妈咪：Lee
        </div>

        <div style={{
          marginTop: 8,
          display: "inline-block",
          padding: "4px 14px",
          borderRadius: 999,
          background: t.tagBg,
          border: `1px solid ${t.tagBorder}`,
          fontSize: 10,
          color: t.tagText,
          fontFamily: "sans-serif",
        }}>
          🐾 只能看看她
        </div>
      </div>

      <style>{`
        @keyframes fadeInUpN {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </section>
  );
}
