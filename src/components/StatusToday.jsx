import { useState } from "react";

const STATUS_OPTIONS = [
  { id: "good", emoji: "🌤", label: "状态不错" },
  { id: "quiet", emoji: "🌙", label: "安静中" },
  { id: "tired", emoji: "☁️", label: "有点累" },
  { id: "happy", emoji: "✨", label: "很开心" },
  { id: "miss", emoji: "🥺", label: "想你了" },
  { id: "busy", emoji: "🌀", label: "忙着呢" },
];

const ACTIVITY_OPTIONS = [
  "在刷小红书", "在玩猫猫物语", "在追剧", "在摸鱼",
  "在听歌", "在发呆", "在逛微博", "在陪糯糯",
];

export default function StatusToday({ theme: t }) {
  const [selected, setSelected] = useState(null);
  const [activity, setActivity] = useState(null);

  return (
    <section style={{
      padding: "48px 24px",
      fontFamily: "sans-serif",
    }}>
      <div style={{
        fontSize: 11,
        letterSpacing: "0.3em",
        color: t.textMuted,
        textAlign: "center",
        marginBottom: 32,
        textTransform: "uppercase",
      }}>
        今日状态
      </div>

      <div style={{
        maxWidth: 360,
        margin: "0 auto",
        background: t.surface,
        borderRadius: 20,
        border: `1px solid ${t.surfaceBorder}`,
        padding: "24px 20px",
        backdropFilter: "blur(12px)",
      }}>
        {/* 状态标签 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginBottom: 20,
        }}>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSelected(selected === s.id ? null : s.id)}
              style={{
                padding: "10px 8px",
                borderRadius: 12,
                border: `1.5px solid ${selected === s.id ? t.accentBorder : t.surfaceBorder}`,
                background: selected === s.id ? t.accentSoft : "transparent",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                transition: "all 0.2s",
                fontFamily: "sans-serif",
              }}
            >
              <span style={{ fontSize: 22 }}>{s.emoji}</span>
              <span style={{ fontSize: 10, color: selected === s.id ? t.accent : t.textMuted }}>{s.label}</span>
            </button>
          ))}
        </div>

        {/* 活动标签 */}
        <div style={{
          fontSize: 11,
          color: t.textMuted,
          marginBottom: 10,
        }}>
          此刻在做什么
        </div>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}>
          {ACTIVITY_OPTIONS.map(a => (
            <button
              key={a}
              onClick={() => setActivity(activity === a ? null : a)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: `1px solid ${activity === a ? t.accentBorder : t.surfaceBorder}`,
                background: activity === a ? t.accentSoft : "transparent",
                color: activity === a ? t.accent : t.textSub,
                fontSize: 11,
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "sans-serif",
              }}
            >
              {a}
            </button>
          ))}
        </div>

        {(selected || activity) && (
          <div style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: `1px solid ${t.surfaceBorder}`,
            fontSize: 12,
            color: t.textSub,
            textAlign: "center",
            lineHeight: 1.8,
          }}>
            {selected && STATUS_OPTIONS.find(s => s.id === selected)?.emoji}
            {" "}
            {selected && STATUS_OPTIONS.find(s => s.id === selected)?.label}
            {selected && activity && " · "}
            {activity && activity}
          </div>
        )}
      </div>
    </section>
  );
}
