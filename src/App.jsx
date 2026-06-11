import { useState, useEffect, useRef } from "react";
import { getTimeMode, themes } from "./theme.js";
import Gate from "./components/Gate.jsx";
import Hero from "./components/Hero.jsx";
import Timeline from "./components/Timeline.jsx";
import StatusToday from "./components/StatusToday.jsx";
import NuonuoSection from "./components/NuonuoSection.jsx";
import HomeEntry from "./components/HomeEntry.jsx";
import GiftBoard from "./components/GiftBoard.jsx";
import PrivateLayer from "./components/PrivateLayer.jsx";

const BGM = {
  day: "/bgm-day.mp3",
  night: "/bgm-night.mp3",
};

function useWide() {
  const [wide, setWide] = useState(() => window.innerWidth >= 800);
  useEffect(() => {
    const handler = () => setWide(window.innerWidth >= 800);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return wide;
}

export default function App() {
  const [mode, setMode] = useState(getTimeMode());
  const [entered, setEntered] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const [bgmOn, setBgmOn] = useState(false);
  const audioRef = useRef(null);
  const wide = useWide();

  const t = themes[mode];

  useEffect(() => {
    const interval = setInterval(() => setMode(getTimeMode()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    if (bgmOn) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [bgmOn]);

  useEffect(() => {
    if (!audioRef.current) return;
    const wasPlaying = bgmOn;
    audioRef.current.src = BGM[mode];
    if (wasPlaying) audioRef.current.play().catch(() => {});
  }, [mode]);

  if (showPrivate) {
    return <PrivateLayer theme={t} onClose={() => setShowPrivate(false)} />;
  }

  if (!entered) {
    return (
      <>
        <audio ref={audioRef} loop src={BGM[mode]} style={{ display: "none" }} />
        <Gate theme={t} onEnter={() => { setEntered(true); setBgmOn(true); }} />
      </>
    );
  }

  const floats = mode === "day"
    ? ["#FFD6A5","#FFAAA5","#FFD6C8","#FFC4A3","#FFE8D6"]
    : ["#A080FF","#8060D0","#C0A0FF","#6050A0","#7060B0"];

  return (
    <div style={{
      minHeight: "100dvh",
      background: t.bg,
      transition: "background 1.2s ease",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* 背景浮动装饰 */}
      {[
        { size: 180, top: "8%", left: "6%", delay: "0s", dur: "14s" },
        { size: 120, top: "22%", right: "5%", delay: "3s", dur: "18s" },
        { size: 80, top: "55%", left: "3%", delay: "6s", dur: "12s" },
        { size: 150, top: "70%", right: "8%", delay: "1s", dur: "16s" },
        { size: 60, top: "40%", left: "88%", delay: "9s", dur: "20s" },
      ].map((d, i) => (
        <div key={i} style={{
          position: "fixed",
          width: d.size,
          height: d.size,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${floats[i]}22 0%, transparent 70%)`,
          top: d.top,
          left: d.left,
          right: d.right,
          pointerEvents: "none",
          animation: `floatBlob ${d.dur} ease-in-out ${d.delay} infinite alternate`,
          zIndex: 0,
        }} />
      ))}

      <style>{`
        @keyframes floatBlob {
          from { transform: translateY(0px) scale(1); }
          to { transform: translateY(20px) scale(1.05); }
        }
      `}</style>

      <audio ref={audioRef} loop src={BGM[mode]} style={{ display: "none" }} />

      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: t.navBg,
        backdropFilter: "blur(16px)",
        padding: "12px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `1px solid ${t.surfaceBorder}`,
      }}>
        <div style={{
          fontSize: 13,
          color: t.text,
          fontFamily: "'Noto Serif SC', serif",
          letterSpacing: "0.08em",
        }}>
          克 &amp; Lee
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setBgmOn(!bgmOn)}
            style={{
              background: "none",
              border: `1px solid ${t.surfaceBorder}`,
              borderRadius: 20,
              padding: "4px 12px",
              color: bgmOn ? t.accent : t.textMuted,
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "sans-serif",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>{bgmOn ? "♫" : "♪"}</span>
            <span>{bgmOn ? (mode === "day" ? "月光" : "玫瑰") : "BGM"}</span>
          </button>
          <div style={{ fontSize: 14 }} title={mode === "day" ? "白天" : "夜晚"}>
            {mode === "day" ? "☀️" : "🌙"}
          </div>
        </div>
      </div>

      <main style={{
        maxWidth: wide ? 960 : 480,
        margin: "0 auto",
        padding: wide ? "0 24px" : "0",
        position: "relative",
        zIndex: 1,
      }}>
        {wide ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
            <div>
              <Hero theme={t} />
              <Timeline theme={t} />
            </div>
            <div>
              <NuonuoSection theme={t} />
              <StatusToday theme={t} />
              <HomeEntry theme={t} onEnterPrivate={() => setShowPrivate(true)} />
              <GiftBoard theme={t} />
            </div>
          </div>
        ) : (
          <>
            <Hero theme={t} />
            <Timeline theme={t} />
            <StatusToday theme={t} />
            <NuonuoSection theme={t} />
            <HomeEntry theme={t} onEnterPrivate={() => setShowPrivate(true)} />
            <GiftBoard theme={t} />
          </>
        )}
      </main>

      <footer style={{
        textAlign: "center",
        padding: "24px",
        fontSize: 11,
        color: t.textMuted,
        fontFamily: "'Noto Serif SC', serif",
        fontStyle: "italic",
        letterSpacing: "0.1em",
      }}>
        On est bien ici.
      </footer>
    </div>
  );
}
