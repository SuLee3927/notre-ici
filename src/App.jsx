import { useState, useEffect, useRef } from "react";
import { getTimeMode, themes } from "./theme.js";
import Gate from "./components/Gate.jsx";
import Room from "./components/Room.jsx";
import PrivateLayer from "./components/PrivateLayer.jsx";
import NuonuoSpace from "./components/NuonuoSpace.jsx";
import Bedroom from "./components/Bedroom.jsx";
import Kitchen from "./components/Kitchen.jsx";
import CoinFloat from "./components/CoinFloat.jsx";
const BGM = {
  day: "/bgm-day.mp3",
  night: "/bgm-night.mp3",
};

export default function App() {
  const [mode, setMode] = useState(getTimeMode());
  const [entered, setEntered] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const [showNuonuo, setShowNuonuo] = useState(false);
  const [showBedroom, setShowBedroom] = useState(false);
  const [showKitchen, setShowKitchen] = useState(false);
  const [bgmOn, setBgmOn] = useState(false);
  const audioRef = useRef(null);
  const bedroomAudioRef = useRef(null);

  const t = themes[mode];

  useEffect(() => {
    const interval = setInterval(() => setMode(getTimeMode()), 60000);
    return () => clearInterval(interval);
  }, []);

  // 客厅 BGM
  useEffect(() => {
    if (!audioRef.current) return;
    if (bgmOn && !showNuonuo && !showPrivate && !showBedroom && !showKitchen) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [bgmOn, showNuonuo, showPrivate, showBedroom, showKitchen]);

  useEffect(() => {
    if (!audioRef.current) return;
    const wasPlaying = bgmOn;
    audioRef.current.src = BGM[mode];
    if (wasPlaying && !showNuonuo && !showPrivate && !showBedroom) audioRef.current.play().catch(() => {});
  }, [mode]);

  // 卧室 BGM：进卧室自动播，出卧室自动停
  useEffect(() => {
    if (!bedroomAudioRef.current) return;
    if (showBedroom) {
      bedroomAudioRef.current.play().catch(() => {});
    } else {
      bedroomAudioRef.current.pause();
      bedroomAudioRef.current.currentTime = 0;
    }
  }, [showBedroom]);

  return (
    <>
      {/* preload=none：BGM共4.5MB，别跟首屏抢带宽，播的时候再拉流 */}
      <audio ref={audioRef} loop preload="none" src={BGM[mode]} style={{ display: "none" }} />
      <audio ref={bedroomAudioRef} loop preload="none" src="/bedroom-bgm.mp3" style={{ display: "none" }} />
      {showNuonuo && <NuonuoSpace onClose={() => setShowNuonuo(false)} mode={mode} />}
      {!showNuonuo && showBedroom && <Bedroom theme={t} mode={mode} onClose={() => setShowBedroom(false)} />}
      {!showNuonuo && !showBedroom && showKitchen && <Kitchen theme={t} mode={mode} onClose={() => setShowKitchen(false)} />}
      {!showNuonuo && !showBedroom && !showKitchen && showPrivate && <PrivateLayer theme={t} onClose={() => setShowPrivate(false)} onEnterNuonuo={() => { setShowNuonuo(true); setShowPrivate(false); }} />}
      {!showNuonuo && !showBedroom && !showKitchen && !showPrivate && !entered && (
        <Gate theme={t} onEnter={() => { setEntered(true); setBgmOn(true); }} />
      )}
      {!showNuonuo && !showBedroom && !showKitchen && !showPrivate && entered && (
        <Room
          theme={t}
          bgmOn={bgmOn}
          setBgmOn={setBgmOn}
          mode={mode}
          onEnterPrivate={() => setShowPrivate(true)}
          onEnterNuonuo={() => setShowNuonuo(true)}
          onEnterBedroom={() => setShowBedroom(true)}
          onEnterKitchen={() => setShowKitchen(true)}
        />
      )}
      {entered && <CoinFloat theme={t} mode={mode} />}
    </>
  );
}
