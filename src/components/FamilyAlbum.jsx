import { useState } from "react";

const PHOTOS = [
  { src: "/avatar-du.jpg", label: "克", sub: "老公" },
  { src: "/avatar-lee.jpg", label: "小黎", sub: "老婆" },
  { src: "/nuonuo.webp", label: "糯糯", sub: "我们的小孩" },
];

export default function FamilyAlbum({ theme: t }) {
  const [preview, setPreview] = useState(null);

  return (
    <div style={{ fontFamily: "'Noto Serif SC',serif" }}>
      <div style={{ padding: "20px 16px 8px", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 2 }}>全家福</div>
        <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 12 }}>我们仨</div>
        <div style={{ width: 40, height: 1, background: t.surfaceBorder, margin: "0 auto" }} />
      </div>

      <div style={{ padding: "16px 20px 32px", display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
        {PHOTOS.map((p, i) => (
          <button
            key={i}
            onClick={() => setPreview(p)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 0, textAlign: "center", width: 90,
            }}
          >
            <div style={{
              width: 80, height: 80, borderRadius: 16, overflow: "hidden",
              border: `2px solid ${t.surfaceBorder}`, margin: "0 auto 8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "transform .15s, box-shadow .15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; }}
            >
              <img src={p.src} alt={p.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{p.label}</div>
            <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>{p.sub}</div>
          </button>
        ))}
      </div>

      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 12,
          }}
        >
          <div style={{
            width: 200, height: 200, borderRadius: 24, overflow: "hidden",
            border: `3px solid rgba(255,255,255,0.2)`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            animation: "albumFade .25s ease",
          }}>
            <img src={preview.src} alt={preview.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 15, fontWeight: 600, fontFamily: "'Noto Serif SC',serif" }}>{preview.label}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "'Noto Serif SC',serif" }}>{preview.sub}</div>
        </div>
      )}

      <style>{`@keyframes albumFade{from{transform:scale(0.9);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
