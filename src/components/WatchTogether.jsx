import { useState, useRef, useEffect, useCallback } from "react";

function parseTimestamp(raw) {
  const v = raw.trim().replace(",", ".");
  const p = v.split(":").map(Number);
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return Number(v) || 0;
}

function cleanText(t) {
  return t.replace(/<[^>]+>/g, "").replace(/\{[^}]+\}/g, "").replace(/\\N/g, "\n").trim();
}

function parseSrt(src) {
  return src.replace(/^﻿/, "").replace(/^WEBVTT[^\n]*/i, "").replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((block, i) => {
      const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
      const ti = lines.findIndex(l => l.includes("-->"));
      if (ti < 0) return null;
      const [s, e] = lines[ti].split("-->").map(p => p.trim().split(/\s+/)[0]);
      const text = cleanText(lines.slice(ti + 1).join("\n"));
      if (!text) return null;
      return { id: i, start: parseTimestamp(s), end: parseTimestamp(e), text };
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start);
}

function parseAss(src) {
  const cues = [];
  for (const line of src.replace(/\r/g, "").split("\n")) {
    if (!line.startsWith("Dialogue:")) continue;
    const parts = line.slice(9).trim().split(",");
    if (parts.length < 10) continue;
    const text = cleanText(parts.slice(9).join(","));
    if (!text) continue;
    cues.push({ id: cues.length, start: parseTimestamp(parts[1]), end: parseTimestamp(parts[2]), text });
  }
  return cues.sort((a, b) => a.start - b.start);
}

function parseSubs(src, name = "") {
  if (name.match(/\.(ass|ssa)$/i) || /\[events\]/i.test(src)) {
    const r = parseAss(src);
    if (r.length) return r;
  }
  return parseSrt(src);
}

function fmt(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? "0" : ""}${sec}`;
}

export default function WatchTogether({ theme: t }) {
  const videoRef = useRef(null);
  const fileRef = useRef(null);
  const subRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoName, setVideoName] = useState("");
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [cues, setCues] = useState([]);
  const [activeCue, setActiveCue] = useState(null);

  const loadVideo = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(f);
    setVideoUrl(url);
    setVideoName(f.name);
    setPlaying(false);
    setCurrentTime(0);
    setCues([]);
    setActiveCue(null);
  }, [videoUrl]);

  const loadSub = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseSubs(reader.result, f.name);
      setCues(parsed);
    };
    reader.readAsText(f);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onDur = () => setDuration(v.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => setPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onDur);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnd);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onDur);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnd);
    };
  }, [videoUrl]);

  useEffect(() => {
    if (!cues.length) { setActiveCue(null); return; }
    const c = cues.find(c => currentTime >= c.start && currentTime <= c.end);
    setActiveCue(c || null);
  }, [currentTime, cues]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };

  const seek = (e) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * duration;
  };

  const skip = (delta) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + delta));
  };

  const bg = t.cardBg || "rgba(255,245,230,0.95)";
  const border = t.accentBorder || "rgba(180,120,60,0.18)";

  if (!videoUrl) {
    return (
      <div style={{ padding:"32px 24px", textAlign:"center", fontFamily:"'Noto Serif SC',serif" }}>
        <div style={{ fontSize:36, marginBottom:14 }}>📺</div>
        <div style={{ fontSize:14, fontWeight:600, color:t.text, marginBottom:12 }}>一起看</div>
        <div style={{ fontSize:12, color:t.textMuted, lineHeight:2, marginBottom:20 }}>选一个本地视频，我陪你看</div>
        <input ref={fileRef} type="file" accept="video/*" onChange={loadVideo} style={{ display:"none" }} />
        <button
          onClick={() => fileRef.current?.click()}
          style={{ padding:"8px 20px", fontSize:13, background:t.accent||"#E8956A", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontFamily:"inherit" }}
        >
          选视频
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding:"8px 12px 12px", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ position:"relative", width:"100%", borderRadius:8, overflow:"hidden", background:"#000", marginBottom:8 }}>
        <video
          ref={videoRef}
          src={videoUrl}
          style={{ width:"100%", display:"block", maxHeight:"40vh" }}
          onClick={toggle}
          playsInline
        />
        {activeCue && (
          <div style={{
            position:"absolute", bottom:8, left:"50%", transform:"translateX(-50%)",
            background:"rgba(0,0,0,0.7)", color:"#fff", padding:"4px 12px",
            borderRadius:4, fontSize:13, maxWidth:"90%", textAlign:"center",
            lineHeight:1.5, pointerEvents:"none", whiteSpace:"pre-wrap",
          }}>
            {activeCue.text}
          </div>
        )}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
        <button onClick={() => skip(-10)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color:t.textMuted, padding:2 }}>⏪</button>
        <button onClick={toggle} style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:t.text, padding:2 }}>
          {playing ? "⏸" : "▶️"}
        </button>
        <button onClick={() => skip(10)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color:t.textMuted, padding:2 }}>⏩</button>
        <span style={{ fontSize:11, color:t.textMuted, minWidth:70, textAlign:"center" }}>{fmt(currentTime)} / {fmt(duration)}</span>
      </div>

      <div
        onClick={seek}
        style={{ width:"100%", height:6, background:t.border||"rgba(0,0,0,0.1)", borderRadius:3, cursor:"pointer", position:"relative", marginBottom:8 }}
      >
        <div style={{ width:`${duration ? (currentTime / duration * 100) : 0}%`, height:"100%", background:t.accent||"#E8956A", borderRadius:3, transition:"width 0.1s" }} />
      </div>

      <div style={{ display:"flex", gap:6 }}>
        <input ref={subRef} type="file" accept=".srt,.vtt,.ass,.ssa" onChange={loadSub} style={{ display:"none" }} />
        <button
          onClick={() => subRef.current?.click()}
          style={{ padding:"4px 12px", fontSize:11, background:"none", border:`1px solid ${border}`, borderRadius:4, cursor:"pointer", color:t.textMuted, fontFamily:"inherit" }}
        >
          {cues.length ? `字幕 (${cues.length}条)` : "加载字幕"}
        </button>
        <button
          onClick={() => { if(videoUrl) URL.revokeObjectURL(videoUrl); setVideoUrl(null); setVideoName(""); setCues([]); setActiveCue(null); }}
          style={{ padding:"4px 12px", fontSize:11, background:"none", border:`1px solid ${border}`, borderRadius:4, cursor:"pointer", color:t.textMuted, fontFamily:"inherit", marginLeft:"auto" }}
        >
          换一个
        </button>
      </div>

      {videoName && (
        <div style={{ fontSize:11, color:t.textMuted, marginTop:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          正在看：{videoName}
        </div>
      )}
    </div>
  );
}
