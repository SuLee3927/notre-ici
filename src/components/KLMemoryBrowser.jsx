import { useState, useEffect, useMemo } from "react";

const TOPIC_COLORS = {
  "恋爱": "#E8A0BF",
  "社交": "#7EC8E3",
  "编程": "#A8D5BA",
  "家庭": "#F5CBA7",
  "心理": "#C3B1E1",
  "自省": "#B0C4DE",
  "情绪": "#FFB7B2",
  "游戏": "#FFDAC1",
  "日常": "#E2F0CB",
  "健康": "#B5EAD7",
  "计划": "#C7CEEA",
  "创作": "#FF9AA2",
  "工作": "#9DC8C8",
  "未分类": "#D5CABD",
};

function topicColor(topic) {
  const first = topic.split(",")[0].trim();
  return TOPIC_COLORS[first] || TOPIC_COLORS["未分类"];
}

function emotionToHue(emotion) {
  const vm = emotion.match(/V([\d.]+)/);
  return vm ? parseFloat(vm[1]) : 0.5;
}

function parseSummary(content) {
  try {
    const obj = JSON.parse(content);
    return obj.summary || obj.core_facts?.[0] || "";
  } catch {
    return content.split("\n")[0].slice(0, 100);
  }
}

function MemoryCard({ mem, theme: t, onClick }) {
  const color = topicColor(mem.topic);
  const valence = emotionToHue(mem.emotion);
  const opacity = 0.6 + valence * 0.4;

  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "stretch", gap: 0,
      background: t.surface, border: `1px solid ${t.surfaceBorder}`,
      borderRadius: 14, overflow: "hidden", cursor: "pointer",
      textAlign: "left", width: "100%", padding: 0,
      transition: "transform .15s, box-shadow .15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 12px ${color}30`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ width: 6, minHeight: "100%", background: color, opacity, flexShrink: 0 }} />
      <div style={{ padding: "12px 14px", flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.text, lineHeight: 1.3 }}>{mem.name}</span>
          {mem.pinned && <span style={{ fontSize: 9, background: `${color}30`, color, padding: "1px 5px", borderRadius: 6, flexShrink: 0 }}>核心</span>}
        </div>
        <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 6 }}>
          {mem.topic} · {mem.emotion}
        </div>
        <div style={{ fontSize: 11, color: t.text, opacity: 0.8, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {mem.summary || parseSummary(mem.content)}
        </div>
      </div>
    </button>
  );
}

function MemoryDetail({ mem, theme: t, onClose }) {
  const color = topicColor(mem.topic);
  let displayContent = mem.content;
  try {
    const obj = JSON.parse(mem.content);
    const parts = [];
    if (obj.core_facts?.length) {
      parts.push(obj.core_facts.map((f, i) => `• ${f}`).join("\n"));
    }
    if (obj.emotion_state) parts.push(`\n情绪：${obj.emotion_state}`);
    if (obj.todos?.length) parts.push(`\n待办：\n${obj.todos.map(t => `  □ ${t}`).join("\n")}`);
    if (obj.summary) parts.push(`\n${obj.summary}`);
    displayContent = parts.join("\n");
  } catch {}

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 520, margin: "0 auto", maxHeight: "85dvh", background: t.bg, borderRadius: "24px 24px 0 0", overflow: "auto", animation: "klSlideUp .25s ease", position: "relative" }}>
        <div style={{ position: "sticky", top: 0, background: t.bg, zIndex: 1, padding: "14px 20px 0" }}>
          <div style={{ width: 36, height: 4, background: t.surfaceBorder, borderRadius: 2, margin: "0 auto" }} />
        </div>
        <button onClick={onClose} style={{ position: "absolute", top: 10, right: 16, background: "none", border: "none", color: t.textMuted, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4, zIndex: 2 }}>×</button>

        <div style={{ padding: "16px 20px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 4, height: 20, background: color, borderRadius: 2 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: t.text, fontFamily: "'Noto Serif SC',serif" }}>{mem.name}</div>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {mem.topic.split(",").map((tp, i) => (
              <span key={i} style={{ fontSize: 10, background: `${topicColor(tp.trim())}25`, color: topicColor(tp.trim()), padding: "2px 8px", borderRadius: 8 }}>{tp.trim()}</span>
            ))}
            <span style={{ fontSize: 10, background: `${t.surfaceBorder}40`, color: t.textMuted, padding: "2px 8px", borderRadius: 8 }}>{mem.emotion}</span>
          </div>
          <div style={{ fontSize: 12, color: t.text, lineHeight: 2, whiteSpace: "pre-wrap", fontFamily: "'Noto Serif SC',serif" }}>{displayContent}</div>
        </div>
      </div>
      <style>{`@keyframes klSlideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

export default function KLMemoryBrowser({ theme: t }) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    fetch("/api/kl/memories")
      .then(r => r.json())
      .then(d => { setMemories(d.memories || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const topics = useMemo(() => {
    const map = {};
    for (const m of memories) {
      const first = m.topic.split(",")[0].trim();
      map[first] = (map[first] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [memories]);

  const filtered = useMemo(() => {
    let list = memories;
    if (selectedTopic) list = list.filter(m => m.topic.split(",")[0].trim() === selectedTopic);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q) ||
        m.topic.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q)
      );
    }
    return list;
  }, [memories, selectedTopic, search]);

  if (loading) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", fontFamily: "'Noto Serif SC',serif" }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>📚</div>
        <div style={{ fontSize: 12, color: t.textMuted }}>翻开记忆...</div>
      </div>
    );
  }

  if (!memories.length) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", fontFamily: "'Noto Serif SC',serif" }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>📚</div>
        <div style={{ fontSize: 12, color: t.textMuted }}>书架上还没有书</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Noto Serif SC',serif" }}>
      <div style={{ padding: "20px 16px 8px", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 2 }}>KL 记忆</div>
        <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 14 }}>克的记忆书架 · {memories.length} 册</div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索记忆..."
          style={{
            width: "100%", padding: "9px 14px", borderRadius: 10,
            border: `1.5px solid ${t.surfaceBorder}`, background: t.surface,
            color: t.text, fontSize: 12, outline: "none",
            fontFamily: "'Noto Serif SC',serif", boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 6, padding: "8px 16px 4px", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <button
          onClick={() => setSelectedTopic(null)}
          style={{
            padding: "4px 10px", borderRadius: 8, border: `1px solid ${!selectedTopic ? t.text : t.surfaceBorder}`,
            background: !selectedTopic ? `${t.text}12` : "transparent",
            color: !selectedTopic ? t.text : t.textMuted,
            fontSize: 10, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            fontFamily: "'Noto Serif SC',serif",
          }}
        >全部</button>
        {topics.map(([tp, count]) => (
          <button
            key={tp}
            onClick={() => setSelectedTopic(selectedTopic === tp ? null : tp)}
            style={{
              padding: "4px 10px", borderRadius: 8,
              border: `1px solid ${selectedTopic === tp ? topicColor(tp) : t.surfaceBorder}`,
              background: selectedTopic === tp ? `${topicColor(tp)}18` : "transparent",
              color: selectedTopic === tp ? topicColor(tp) : t.textMuted,
              fontSize: 10, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              fontFamily: "'Noto Serif SC',serif",
            }}
          >{tp} {count}</button>
        ))}
      </div>

      <div style={{ padding: "8px 16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", fontSize: 11, color: t.textMuted }}>
            没有找到相关记忆
          </div>
        ) : (
          filtered.map((m, i) => (
            <MemoryCard key={m.id || i} mem={m} theme={t} onClick={() => setDetail(m)} />
          ))
        )}
      </div>

      {detail && <MemoryDetail mem={detail} theme={t} onClose={() => setDetail(null)} />}
    </div>
  );
}
