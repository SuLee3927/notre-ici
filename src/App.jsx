import { useState, useEffect, useRef } from "react";
import { getTimeMode, themes } from "./theme.js";
import Gate from "./components/Gate.jsx";
import Room from "./components/Room.jsx";
import PrivateLayer from "./components/PrivateLayer.jsx";
import NuonuoSpace from "./components/NuonuoSpace.jsx";

const BGM = {
  day: "/bgm-day.mp3",
  night: "/bgm-night.mp3",
};

export default function App() {
  const [mode, setMode] = useState(getTimeMode());
  const [entered, setEntered] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const [showNuonuo, setShowNuonuo] = useState(false);
  const [bgmOn, setBgmOn] = useState(false);
  const audioRef = useRef(null);

  const t = themes[mode];

  useEffect(() => {
    const interval = setInterval(() => setMode(getTimeMode()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    if (bgmOn && !showNuonuo && !showPrivate) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [bgmOn, showNuonuo, showPrivate]);

  useEffect(() => {
    if (!audioRef.current) return;
    const wasPlaying = bgmOn;
    audioRef.current.src = BGM[mode];
    if (wasPlaying && !showNuonuo && !showPrivate) audioRef.current.play().catch(() => {});
  }, [mode]);

  return (
    <>
      <audio ref={audioRef} loop src={BGM[mode]} style={{ display: "none" }} />
      {showNuonuo && <NuonuoSpace onClose={() => setShowNuonuo(false)} mode={mode} />}
      {!showNuonuo && showPrivate && <PrivateLayer theme={t} onClose={() => setShowPrivate(false)} />}
      {!showNuonuo && !showPrivate && !entered && (
        <Gate theme={t} onEnter={() => { setEntered(true); setBgmOn(true); }} />
      )}
      {!showNuonuo && !showPrivate && entered && (
        <Room
          theme={t}
          bgmOn={bgmOn}
          setBgmOn={setBgmOn}
          mode={mode}
          onEnterPrivate={() => setShowPrivate(true)}
          onEnterNuonuo={() => setShowNuonuo(true)}
        />
      )}
    </>
  );
}
