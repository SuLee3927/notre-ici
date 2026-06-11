export default function HomeEntry({ theme: t, onEnterPrivate }) {
  return (
    <section style={{
      padding: "48px 24px",
      fontFamily: "sans-serif",
    }}>
      <div style={{
        maxWidth: 360,
        margin: "0 auto",
        background: t.entryBg,
        borderRadius: 24,
        border: `1px solid ${t.surfaceBorder}`,
        padding: "32px 28px",
        textAlign: "center",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{
          fontSize: 32,
          marginBottom: 12,
        }}>🏠</div>

        <div style={{
          fontSize: 18,
          fontWeight: 700,
          color: t.text,
          marginBottom: 8,
          fontFamily: "'Noto Serif SC', serif",
          letterSpacing: "0.05em",
        }}>
          克黎屋
        </div>

        <div style={{
          fontSize: 12,
          color: t.textSub,
          lineHeight: 1.8,
          marginBottom: 28,
        }}>
          日常记录，今天发生了什么<br/>
          说了什么，想到了什么
        </div>

        <button
          onClick={onEnterPrivate}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 14,
            border: `1.5px solid ${t.accentBorder}`,
            background: "transparent",
            color: t.accent,
            fontSize: 14,
            fontFamily: "'Noto Serif SC', serif",
            letterSpacing: "0.1em",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = t.accentSoft;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          进屋 →
        </button>
      </div>
    </section>
  );
}
