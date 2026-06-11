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
      padding: "40px 28px",
      fontFamily: "sans-serif",
    }}>
      <div style={{
        fontSize: 11,
        letterSpacing: "0.25em",
        color: t.textMuted,
        marginBottom: 24,
        textTransform: "uppercase",
        fontFamily: "'Noto Serif SC', serif",
      }}>
        今日状态
      </div>

      {/* 状态标签 — 散落排列，无卡片框 */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 20,
      }}>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSelected(selected === s.id ? null : s.id)}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: `1.5px solid ${selected === s.id ? t.accentBorder : t.surfaceBorder}`,
              background: selected === s.id ? t.accentSoft : "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s",
              fontFamily: "sans-serif",
            }}
          >
            <span style={{ fontSize: 16 }}>{s.emoji}</span>
            <span style={{ fontSize: 12, color: selected === s.id ? t.accent : t.textSub }}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* 活动标签 */}
      <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 10 }}>此刻在做什么</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {ACTIVITY_OPTIONS.map(a => (
          <button
            key={a}
            onClick={() => setActivity(activity === a ? null : a)}
            style={{
              padding: "5px 12px",
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
          fontSize: 13,
          color: t.textSub,
          lineHeight: 1.8,
          fontFamily: "'Noto Serif SC', serif",
          fontStyle: "italic",
        }}>
          {selected && STATUS_OPTIONS.find(s => s.id === selected)?.emoji}
          {" "}
          {selected && STATUS_OPTIONS.find(s => s.id === selected)?.label}
          {selected && activity && " · "}
          {activity && activity}
        </div>
      )}
    </section>
  );
}
