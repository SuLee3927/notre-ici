import { useState, useRef, useEffect, useCallback } from "react";

function parseLrc(raw) {
  if (!raw) return [];
  return raw.split("\n").map(line => {
    const m = line.match(/\[(\d+):(\d+)[.:]+(\d+)\](.*)/);
    if (!m) return null;
    return { time: +m[1] * 60 + +m[2] + +m[3] / (m[3].length > 2 ? 1000 : 100), text: m[4].trim() };
  }).filter(l => l && l.text).sort((a, b) => a.time - b.time);
}

function fmt(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? "0" : ""}${sec}`;
}

export default function MusicPlayer({ theme: t }) {
  const audioRef = useRef(null);
  const lyricsRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [track, setTrack] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [lyrics, setLyrics] = useState([]);
  const [tLyrics, setTLyrics] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [noAudio, setNoAudio] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const r = await fetch(`/api/music/search?keywords=${encodeURIComponent(query.trim())}&limit=15&type=1`);
      const d = await r.json();
      setResults(d?.result?.songs?.map(s => ({
        id: s.id, name: s.name,
        artist: s.artists?.map(a => a.name).join(" / ") || "",
        album: s.album?.name || "",
        cover: s.album?.picUrl || "",
        fee: s.fee,
      })) || []);
    } catch { setResults([]); }
    setSearching(false);
  }, [query]);

  const pick = useCallback(async (song) => {
    setTrack(song);
    setLoading(true);
    setAudioUrl(null);
    setNoAudio(false);
    setLyrics([]);
    setTLyrics([]);
    setPlaying(false);
    setCurrentTime(0);
    setResults([]);

    try {
      const [urlRes, lrcRes] = await Promise.all([
        fetch(`/api/music/song/url/v1?id=${song.id}&level=standard`).then(r => r.json()),
        fetch(`/api/music/lyric?id=${song.id}`).then(r => r.json()),
      ]);
      const url = urlRes?.data?.[0]?.url;
      if (url) setAudioUrl(url); else setNoAudio(true);
      setLyrics(parseLrc(lrcRes?.lrc?.lyric));
      setTLyrics(parseLrc(lrcRes?.tlyric?.lyric));
    } catch { setNoAudio(true); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrentTime(a.currentTime);
    const onDur = () => setDuration(a.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onDur);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onDur);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnd);
    };
  }, [audioUrl]);

  const activeLrcIdx = lyrics.length
    ? lyrics.reduce((best, l, i) => (currentTime >= l.time ? i : best), -1)
    : -1;

  useEffect(() => {
    if (activeLrcIdx < 0 || !lyricsRef.current) return;
    const el = lyricsRef.current.children[activeLrcIdx];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeLrcIdx]);

  const getTranslation = (idx) => {
    if (!tLyrics.length || idx < 0) return null;
    const orig = lyrics[idx];
    if (!orig) return null;
    const tl = tLyrics.find(t => Math.abs(t.time - orig.time) < 0.5);
    return tl?.text || null;
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play(); else a.pause();
  };

  const seek = (e) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
  };

  const c = {
    bg: t.cardBg || t.surface || "rgba(255,245,230,0.95)",
    card: t.surface || "rgba(255,250,240,0.9)",
    text: t.text || "#3D2B1A",
    muted: t.textMuted || "#C0A090",
    accent: t.accent || "#E8956A",
    border: t.accentBorder || t.surfaceBorder || "rgba(180,120,60,0.18)",
  };

  if (!track) {
    return (
      <div style={{ padding: "20px 16px", fontFamily: "'Noto Serif SC',serif", background: c.bg, minHeight: 200, borderRadius: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: c.text, textAlign: "center", marginBottom: 14 }}>一起听歌</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="搜一首歌…"
            style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${c.border}`, background: c.card, color: c.text, fontSize: 13, outline: "none", fontFamily: "inherit" }}
          />
          <button onClick={search} disabled={searching}
            style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: c.accent, color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "inherit", opacity: searching ? 0.6 : 1 }}>
            {searching ? "…" : "搜"}
          </button>
        </div>
        {results.length > 0 && (
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {results.map(s => (
              <div key={s.id} onClick={() => pick(s)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, cursor: "pointer", marginBottom: 4, background: c.card, border: `1px solid ${c.border}` }}>
                {s.cover && <img src={s.cover + "?param=40y40"} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover" }} />}
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontSize: 12, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.name} {s.fee === 1 && <span style={{ fontSize: 10, color: c.accent, marginLeft: 4 }}>VIP</span>}
                  </div>
                  <div style={{ fontSize: 11, color: c.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.artist}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {results.length === 0 && !searching && (
          <div style={{ textAlign: "center", color: c.muted, fontSize: 12, marginTop: 20, lineHeight: 2 }}>搜一首歌，我陪你听</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 14px", fontFamily: "'Noto Serif SC',serif", background: c.bg, borderRadius: 8 }}>
      {loading ? (
        <div style={{ textAlign: "center", color: c.muted, padding: 40, fontSize: 12 }}>加载中…</div>
      ) : (
        <>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            {track.cover && <img src={track.cover + "?param=120y120"} alt="" style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }} />}
            <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginTop: 10 }}>{track.name}</div>
            <div style={{ fontSize: 12, color: c.muted, marginTop: 4 }}>{track.artist}</div>
          </div>

          {audioUrl && <audio ref={audioRef} src={audioUrl} />}

          {audioUrl ? (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 8 }}>
                <button onClick={toggle} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: c.text, padding: 2 }}>
                  {playing ? "⏸" : "▶️"}
                </button>
                <span style={{ fontSize: 11, color: c.muted }}>{fmt(currentTime)} / {fmt(duration)}</span>
              </div>
              <div onClick={seek} style={{ width: "100%", height: 4, background: c.card, borderRadius: 2, cursor: "pointer", marginBottom: 12 }}>
                <div style={{ width: `${duration ? (currentTime / duration * 100) : 0}%`, height: "100%", background: c.accent, borderRadius: 2, transition: "width 0.1s" }} />
              </div>
            </>
          ) : noAudio && (
            <div style={{ textAlign: "center", fontSize: 11, color: c.muted, marginBottom: 12, padding: "6px 0" }}>
              VIP歌曲，暂时没法播放，看看歌词吧
            </div>
          )}

          {lyrics.length > 0 && (
            <div ref={lyricsRef} style={{ maxHeight: 200, overflowY: "auto", padding: "0 4px", scrollBehavior: "smooth" }}>
              {lyrics.map((l, i) => (
                <div key={i} style={{ padding: "4px 0", textAlign: "center", transition: "all 0.3s", fontSize: i === activeLrcIdx ? 13 : 12, color: i === activeLrcIdx ? c.text : c.muted, fontWeight: i === activeLrcIdx ? 600 : 400 }}>
                  {l.text}
                  {getTranslation(i) && (
                    <div style={{ fontSize: 11, color: c.muted, marginTop: 2, fontWeight: 400 }}>{getTranslation(i)}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
            <button onClick={() => { setTrack(null); setAudioUrl(null); setLyrics([]); setTLyrics([]); setPlaying(false); setQuery(""); }}
              style={{ padding: "6px 16px", fontSize: 11, background: "none", border: `1px solid ${c.border}`, borderRadius: 6, cursor: "pointer", color: c.muted, fontFamily: "inherit" }}>
              换一首
            </button>
          </div>
        </>
      )}
    </div>
  );
}
