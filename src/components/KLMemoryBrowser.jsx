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

const TYPE_META = {
  permanent: { label: "永久", color: "#C3B1E1" },
  dynamic:   { label: "动态", color: "#7EC8E3" },
  feel:      { label: "感受", color: "#FFB7B2" },
  plan:      { label: "计划", color: "#C7CEEA" },
  archived:  { label: "归档", color: "#B8B2A8" },
  i:         { label: "自我", color: "#A8D5BA" },
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

function fmtDay(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const now = new Date();
  const md = `${d.getMonth() + 1}.${d.getDate()}`;
  return d.getFullYear() === now.getFullYear() ? md : `${d.getFullYear()}.${md}`;
}

function daysAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff <= 0) return "今天";
  if (diff === 1) return "昨天";
  return `${diff}天前`;
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

// ── 全部藏书 ──────────────────────────────────────────────────────────────

function LibraryCard({ b, theme: t, onClick }) {
  const tm = TYPE_META[b.type] || { label: b.type, color: "#D5CABD" };
  const domain = (b.domain || []).join(", ") || "未分类";
  const color = topicColor(domain);
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "stretch", gap: 0,
      background: t.surface, border: `1px solid ${t.surfaceBorder}`,
      borderRadius: 14, overflow: "hidden", cursor: "pointer",
      textAlign: "left", width: "100%", padding: 0,
      opacity: b.type === "archived" ? 0.65 : 1,
    }}>
      <div style={{ width: 6, minHeight: "100%", background: color, flexShrink: 0 }} />
      <div style={{ padding: "11px 14px", flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.text, lineHeight: 1.3 }}>{b.name}</span>
          {b.pinned && <span style={{ fontSize: 9, background: `${color}30`, color, padding: "1px 5px", borderRadius: 6, flexShrink: 0 }}>核心</span>}
          <span style={{ fontSize: 9, background: `${tm.color}25`, color: tm.color, padding: "1px 5px", borderRadius: 6, flexShrink: 0 }}>{tm.label}</span>
          {b.importance >= 8 && <span style={{ fontSize: 9, color: t.textMuted, flexShrink: 0 }}>imp{b.importance}</span>}
        </div>
        <div style={{ fontSize: 9, color: t.textMuted, marginBottom: 5 }}>
          {fmtDay(b.created)} 存 · 翻过{b.activation_count || 0}次 · 最近 {daysAgo(b.last_active) || "—"}
        </div>
        <div style={{ fontSize: 11, color: t.text, opacity: 0.75, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {b.content_preview}
        </div>
      </div>
    </button>
  );
}

function LibraryDetail({ bookId, theme: t, onClose }) {
  const [book, setBook] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/kl/book/${encodeURIComponent(bookId)}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setBook(d.book); else setErr(d.error || "读取失败"); })
      .catch(e => setErr(e.message));
  }, [bookId]);

  const meta = book?.metadata || {};
  const domain = Array.isArray(meta.domain) ? meta.domain.join(", ") : "";
  const color = topicColor(domain || "未分类");
  const tm = TYPE_META[meta.type] || { label: meta.type || "?", color: "#D5CABD" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 520, margin: "0 auto", maxHeight: "85dvh", background: t.bg, borderRadius: "24px 24px 0 0", overflow: "auto", animation: "klSlideUp .25s ease", position: "relative" }}>
        <div style={{ position: "sticky", top: 0, background: t.bg, zIndex: 1, padding: "14px 20px 0" }}>
          <div style={{ width: 36, height: 4, background: t.surfaceBorder, borderRadius: 2, margin: "0 auto" }} />
        </div>
        <button onClick={onClose} style={{ position: "absolute", top: 10, right: 16, background: "none", border: "none", color: t.textMuted, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4, zIndex: 2 }}>×</button>

        <div style={{ padding: "16px 20px 32px", fontFamily: "'Noto Serif SC',serif" }}>
          {!book && !err && <div style={{ textAlign: "center", padding: "32px 0", fontSize: 12, color: t.textMuted }}>翻开中...</div>}
          {err && <div style={{ textAlign: "center", padding: "32px 0", fontSize: 12, color: t.textMuted }}>{err}</div>}
          {book && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 4, height: 20, background: color, borderRadius: 2 }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: t.text }}>{meta.name || book.id}</div>
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, background: `${tm.color}25`, color: tm.color, padding: "2px 8px", borderRadius: 8 }}>{tm.label}</span>
                {meta.pinned && <span style={{ fontSize: 10, background: `${color}25`, color, padding: "2px 8px", borderRadius: 8 }}>核心</span>}
                {(meta.domain || []).map((tp, i) => (
                  <span key={i} style={{ fontSize: 10, background: `${topicColor(tp)}25`, color: topicColor(tp), padding: "2px 8px", borderRadius: 8 }}>{tp}</span>
                ))}
              </div>
              <div style={{ fontSize: 10, color: t.textMuted, lineHeight: 1.9, marginBottom: 14 }}>
                存于 {fmtDay(meta.created)} · 最近活跃 {daysAgo(meta.last_active) || "—"} · 翻过{meta.activation_count || 0}次 · 重要度{meta.importance ?? "?"} · 分量{typeof book.score === "number" ? book.score.toFixed(1) : "?"}
                {meta.why_remembered ? <div>为什么记下：{meta.why_remembered}</div> : null}
              </div>
              <div style={{ fontSize: 12, color: t.text, lineHeight: 2, whiteSpace: "pre-wrap" }}>{book.display_content || book.content}</div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes klSlideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

function LibraryView({ theme: t }) {
  const [buckets, setBuckets] = useState(null);
  const [locked, setLocked] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [pw, setPw] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(null);
  const [sortBy, setSortBy] = useState("score");
  const [showCount, setShowCount] = useState(80);
  const [detailId, setDetailId] = useState(null);

  const load = () => {
    setLoadErr("");
    fetch("/api/kl/library")
      .then(r => {
        if (r.status === 401) { setLocked(true); return null; }
        return r.json();
      })
      .then(d => { if (d?.ok) { setBuckets(d.buckets); setLocked(false); } else if (d) setLoadErr(d.error || "读取失败"); })
      .catch(e => setLoadErr(e.message));
  };
  useEffect(load, []);

  const unlock = () => {
    fetch("/api/auth/unlock", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    }).then(r => r.json()).then(d => { if (d.ok) { setPw(""); load(); } });
  };

  const typeCounts = useMemo(() => {
    const map = {};
    for (const b of buckets || []) map[b.type] = (map[b.type] || 0) + 1;
    return map;
  }, [buckets]);

  const filtered = useMemo(() => {
    let list = buckets || [];
    if (typeFilter) list = list.filter(b => b.type === typeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(b =>
        (b.name || "").toLowerCase().includes(q) ||
        (b.content_preview || "").toLowerCase().includes(q) ||
        (b.domain || []).join(",").toLowerCase().includes(q) ||
        (b.tags || []).join(",").toLowerCase().includes(q) ||
        (b.why_remembered || "").toLowerCase().includes(q)
      );
    }
    const arr = [...list];
    if (sortBy === "new") arr.sort((a, b) => (b.created || "").localeCompare(a.created || ""));
    else if (sortBy === "stale") arr.sort((a, b) => (a.last_active || a.created || "").localeCompare(b.last_active || b.created || ""));
    else arr.sort((a, b) => (b.score || 0) - (a.score || 0));
    return arr;
  }, [buckets, typeFilter, search, sortBy]);

  if (locked) {
    return (
      <div style={{ padding: "36px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 22, marginBottom: 10 }}>🔒</div>
        <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 14 }}>全部藏书是私密的，说密码</div>
        <div style={{ display: "flex", gap: 8, maxWidth: 240, margin: "0 auto" }}>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") unlock(); }}
            style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${t.surfaceBorder}`, background: t.surface, color: t.text, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
          <button onClick={unlock} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: t.text, color: t.bg, fontSize: 11, cursor: "pointer" }}>开</button>
        </div>
      </div>
    );
  }

  if (loadErr) return <div style={{ padding: "36px 24px", textAlign: "center", fontSize: 11, color: t.textMuted }}>藏书间的门卡住了：{loadErr}</div>;
  if (!buckets) return <div style={{ padding: "36px 24px", textAlign: "center", fontSize: 11, color: t.textMuted }}>清点藏书中...</div>;

  const chip = (active, color) => ({
    padding: "4px 10px", borderRadius: 8,
    border: `1px solid ${active ? color : t.surfaceBorder}`,
    background: active ? `${color}18` : "transparent",
    color: active ? color : t.textMuted,
    fontSize: 10, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
    fontFamily: "'Noto Serif SC',serif",
  });

  return (
    <div>
      <div style={{ padding: "0 16px" }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setShowCount(80); }} placeholder="在全部藏书里搜..."
          style={{ width: "100%", padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${t.surfaceBorder}`, background: t.surface, color: t.text, fontSize: 12, outline: "none", fontFamily: "'Noto Serif SC',serif", boxSizing: "border-box" }} />
      </div>

      <div style={{ display: "flex", gap: 6, padding: "8px 16px 0", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <button onClick={() => { setTypeFilter(null); setShowCount(80); }} style={chip(!typeFilter, t.text)}>全部 {buckets.length}</button>
        {Object.entries(TYPE_META).filter(([k]) => typeCounts[k]).map(([k, tm]) => (
          <button key={k} onClick={() => { setTypeFilter(typeFilter === k ? null : k); setShowCount(80); }} style={chip(typeFilter === k, tm.color)}>
            {tm.label} {typeCounts[k]}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, padding: "6px 16px 4px", alignItems: "center" }}>
        <span style={{ fontSize: 9, color: t.textMuted, flexShrink: 0 }}>排序</span>
        {[["score", "分量"], ["new", "最新"], ["stale", "最久没碰"]].map(([k, label]) => (
          <button key={k} onClick={() => setSortBy(k)} style={chip(sortBy === k, t.text)}>{label}</button>
        ))}
      </div>

      <div style={{ padding: "8px 16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", fontSize: 11, color: t.textMuted }}>没有找到相关的书</div>
        ) : (
          <>
            {filtered.slice(0, showCount).map(b => (
              <LibraryCard key={b.id} b={b} theme={t} onClick={() => setDetailId(b.id)} />
            ))}
            {filtered.length > showCount && (
              <button onClick={() => setShowCount(c => c + 150)} style={{ padding: "10px 0", borderRadius: 10, border: `1px dashed ${t.surfaceBorder}`, background: "transparent", color: t.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Noto Serif SC',serif" }}>
                还有 {filtered.length - showCount} 册，继续翻
              </button>
            )}
          </>
        )}
      </div>

      {detailId && <LibraryDetail bookId={detailId} theme={t} onClose={() => setDetailId(null)} />}
    </div>
  );
}

export default function KLMemoryBrowser({ theme: t }) {
  const [mode, setMode] = useState("breath"); // breath=开窗浮现 | library=全部藏书
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

  const tabStyle = (active) => ({
    padding: "5px 14px", borderRadius: 10,
    border: `1px solid ${active ? t.text : t.surfaceBorder}`,
    background: active ? `${t.text}12` : "transparent",
    color: active ? t.text : t.textMuted,
    fontSize: 11, cursor: "pointer", fontFamily: "'Noto Serif SC',serif",
  });

  return (
    <div style={{ fontFamily: "'Noto Serif SC',serif" }}>
      <div style={{ padding: "20px 16px 8px", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 2 }}>KL 记忆</div>
        <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 12 }}>克的记忆书架</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 4 }}>
          <button onClick={() => setMode("breath")} style={tabStyle(mode === "breath")}>浮现 {memories.length}</button>
          <button onClick={() => setMode("library")} style={tabStyle(mode === "library")}>全部藏书</button>
        </div>
      </div>

      {mode === "library" ? (
        <LibraryView theme={t} />
      ) : loading ? (
        <div style={{ padding: "36px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>📚</div>
          <div style={{ fontSize: 12, color: t.textMuted }}>翻开记忆...</div>
        </div>
      ) : !memories.length ? (
        <div style={{ padding: "36px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>📚</div>
          <div style={{ fontSize: 12, color: t.textMuted }}>书架上还没有书</div>
        </div>
      ) : (
        <>
          <div style={{ padding: "0 16px" }}>
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
        </>
      )}
    </div>
  );
}
