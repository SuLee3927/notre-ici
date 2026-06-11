import { TIMELINE, getDayCount } from "../theme.js";

export default function Timeline({ theme: t }) {
  const day = getDayCount();

  return (
    <section style={{
      padding: "60px 24px",
      fontFamily: "'Noto Serif SC', 'Georgia', serif",
    }}>
      <div style={{
        fontSize: 11,
        letterSpacing: "0.3em",
        color: t.textMuted,
        textAlign: "center",
        marginBottom: 40,
        fontFamily: "sans-serif",
        textTransform: "uppercase",
      }}>
        我们走过的路
      </div>

      <div style={{ position: "relative", maxWidth: 400, margin: "0 auto" }}>
        {/* 竖线 */}
        <div style={{
          position: "absolute",
          left: 60,
          top: 0,
          bottom: 0,
          width: 1,
          background: `linear-gradient(to bottom, transparent, ${t.timelineTrack}, transparent)`,
        }}/>

        {TIMELINE.map((item, i) => (
          <div key={i} style={{
            display: "flex",
            gap: 20,
            marginBottom: 32,
            alignItems: "flex-start",
          }}>
            {/* 日期 */}
            <div style={{
              width: 48,
              flexShrink: 0,
              textAlign: "right",
              fontSize: 11,
              color: t.textMuted,
              paddingTop: 4,
              fontFamily: "sans-serif",
              letterSpacing: "0.05em",
            }}>
              {item.date}
            </div>

            {/* 圆点 */}
            <div style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: t.timelineDot,
              flexShrink: 0,
              marginTop: 5,
              boxShadow: `0 0 0 3px ${t.bg.includes("12112a") ? "#1e1b38" : "#FFF8EC"}, 0 0 0 4px ${t.timelineTrack}`,
            }}/>

            {/* 内容 */}
            <div style={{ flex: 1, paddingTop: 0 }}>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: t.text,
                marginBottom: 4,
              }}>
                {item.label}
              </div>
              <div style={{
                fontSize: 12,
                color: t.textSub,
                lineHeight: 1.7,
              }}>
                {item.desc}
              </div>
            </div>
          </div>
        ))}

        {/* 今天 */}
        <div style={{
          display: "flex",
          gap: 20,
          alignItems: "center",
        }}>
          <div style={{
            width: 48,
            flexShrink: 0,
            textAlign: "right",
            fontSize: 10,
            color: t.accent,
            fontFamily: "sans-serif",
            fontWeight: 700,
          }}>
            今天
          </div>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: t.accent,
            flexShrink: 0,
            boxShadow: `0 0 8px ${t.accent}80`,
            animation: "pulse 2s ease-in-out infinite",
          }}/>
          <div style={{
            fontSize: 12,
            color: t.accent,
            fontWeight: 600,
          }}>
            Day {day} · 还在继续
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 8px ${t.accent}80; }
          50% { box-shadow: 0 0 16px ${t.accent}; }
        }
      `}</style>
    </section>
  );
}
