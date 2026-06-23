import { useState, useEffect } from "react";

const EMO_LABEL = {
  scolded: "委屈/被骂", sad: "伤心", nervous: "紧张", startled: "惊了",
  intimate: "亲密", aroused: "心动", excited: "雀跃",
};
const EMO_COLOR = {
  scolded: "#9090B8", sad: "#8898C8", nervous: "#C8A840",
  startled: "#C86040", intimate: "#E870A8", aroused: "#E87070", excited: "#E8C040",
};

function HeartAnim({ bpm }) {
  const interval = bpm > 0 ? Math.round(60000 / bpm) : 1000;
  return (
    <style>{`
      @keyframes heartbeat {
        0%,100% { transform: scale(1); }
        14% { transform: scale(1.18); }
        28% { transform: scale(1); }
        42% { transform: scale(1.1); }
        56% { transform: scale(1); }
      }
      .heart-beat { animation: heartbeat ${interval}ms ease infinite; display: inline-block; }
    `}</style>
  );
}

export default function VitalsPanel({ theme: t }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timer;
    function fetch_() {
      fetch("/api/vitals")
        .then(r => r.json())
        .then(d => { if (d.ok) setData(d.vitals); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    fetch_();
    timer = setInterval(fetch_, 30000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return (
    <div style={{ padding: "48px 24px", textAlign: "center", color: t.textMuted, fontSize: 12 }}>…</div>
  );
  if (!data) return (
    <div style={{ padding: "48px 24px", textAlign: "center", color: t.textMuted, fontSize: 12 }}>读不到数据</div>
  );

  const { hr, temperature, breath, chord, residue, ring } = data;

  return (
    <div style={{ padding: "20px 16px 32px", fontFamily: "'Noto Serif SC',serif" }}>
      <HeartAnim bpm={hr} />

      {/* 标题 */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>笃现在</div>
        <div style={{ fontSize: 10, color: t.textMuted, marginTop: 3, letterSpacing: ".1em" }}>{chord}</div>
      </div>

      {/* 三格生命体征 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        <StatCard t={t} label="心跳">
          <span className="heart-beat" style={{ fontSize: 20 }}>♥</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: t.text, lineHeight: 1 }}>{hr}</div>
          <div style={{ fontSize: 9, color: t.textMuted }}>bpm</div>
        </StatCard>
        <StatCard t={t} label="体温">
          <div style={{ fontSize: 18, fontWeight: 700, color: t.text, lineHeight: 1.2 }}>{temperature}°</div>
          <div style={{ fontSize: 9, color: t.textMuted }}>°C</div>
        </StatCard>
        <StatCard t={t} label="呼吸">
          <div style={{ fontSize: 15, fontWeight: 700, color: t.text, lineHeight: 1.2 }}>{breath.rate}</div>
          <div style={{ fontSize: 9, color: t.textMuted }}>/min</div>
          <div style={{ fontSize: 9, color: t.textMuted, marginTop: 2 }}>{breath.label}</div>
        </StatCard>
      </div>

      {/* 底色 */}
      {residue ? (
        <div style={{ padding: "10px 14px", borderRadius: 12, marginBottom: 12, background: `${EMO_COLOR[residue.emotion] || "#9090A8"}18`, border: `1px solid ${EMO_COLOR[residue.emotion] || "#9090A8"}44` }}>
          <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 4 }}>底色还在</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 12, color: EMO_COLOR[residue.emotion] || t.text, fontWeight: 600 }}>
              {EMO_LABEL[residue.emotion] || residue.emotion}
            </div>
            <div style={{ fontSize: 10, color: t.textMuted }}>{Math.round(residue.intensity * 100)}%</div>
          </div>
          <div style={{ marginTop: 6, height: 3, background: t.surfaceBorder, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.round(residue.intensity * 100)}%`, background: EMO_COLOR[residue.emotion] || "#9090A8", borderRadius: 2, transition: "width .4s" }} />
          </div>
        </div>
      ) : (
        <div style={{ padding: "10px 14px", borderRadius: 12, marginBottom: 12, background: t.surface, border: `1px solid ${t.surfaceBorder}`, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: t.textMuted }}>底色平静</div>
        </div>
      )}

      {/* 环状态 */}
      {ring.active && (
        <div style={{ padding: "8px 14px", borderRadius: 12, background: "#E870A818", border: "1px solid #E870A844", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 14 }}>💍</div>
          <div style={{ fontSize: 11, color: "#E870A8" }}>环在转 · 档位 {ring.speed}</div>
        </div>
      )}
    </div>
  );
}

function StatCard({ t, label, children }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.surfaceBorder}`, borderRadius: 12, padding: "10px 8px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <div style={{ fontSize: 9, color: t.textMuted, marginBottom: 4, letterSpacing: ".08em" }}>{label}</div>
      {children}
    </div>
  );
}
