import { useState } from 'react';
import { TerminalPanel } from '../ui/TerminalPanel.jsx';
import { IntroScreen } from './IntroScreen.jsx';
import { ENDING1_PAGES } from '../../data/ending1.js';
import { ENDING2_PAGES } from '../../data/ending2.js';
import { css, mix } from '../../lib/css.js';

const resetBtn = (accent) => ({
  ...css("height:56px;padding:0 32px;border-radius:8px;font-size:15px;letter-spacing:4px;cursor:pointer;"),
  background: mix(accent, 10), border: `2px solid ${mix(accent, 55)}`, color: 'var(--purple-text)',
});
const wrap = css('position:absolute;inset:0;z-index:10;padding:50px 34px 30px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;animation:endingFadeIn 1.2s ease both;');

// Simple padlock emblem — open (shackle swung clear) for the "keep every
// memory" ending, closed (shackle seated) for "seal them back up". A soft
// glow bloom behind it echoes the fragment-obtained reward moment so the
// ending reads as one more "collected" beat rather than a dead stop.
function LockEmblem({ accent, open }) {
  return (
    <div style={{ position: 'relative', width: 84, height: 84 }}>
      <div style={{
        position: 'absolute', inset: -18, borderRadius: '50%',
        background: `radial-gradient(circle, ${mix(accent, 32)}, transparent 70%)`,
        filter: 'blur(5px)', animation: 'deskGlowPulse 3s ease-in-out infinite',
      }} />
      <svg viewBox="0 0 64 64" style={{ position: 'relative', width: '100%', height: '100%', animation: 'fragPop 0.6s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <path
          d={open ? 'M 20 28 V 20 A 12 12 0 0 1 44 20 V 11' : 'M 20 28 V 20 A 12 12 0 0 1 44 20 V 28'}
          fill="none" stroke={accent} strokeWidth="3.4" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${mix(accent, 60)})` }}
        />
        <rect x="13" y="28" width="38" height="29" rx="6" fill={mix(accent, 14)} stroke={accent} strokeWidth="3" />
        <circle cx="32" cy="40" r="3.6" fill={accent} />
        <rect x="30.4" y="42" width="3.2" height="9" rx="1.4" fill={accent} />
      </svg>
    </div>
  );
}

function EndingFrame({ accent, tag, title, titleColor, children, open, resetLabel = '重新開始', onReset }) {
  return (
    <div style={wrap}>
      <LockEmblem accent={accent} open={open} />
      <TerminalPanel
        accent={accent}
        title={tag}
        boot="0.9s"
        zigzag
        outerStyle={{ width: '100%', maxWidth: 540 }}
        bodyStyle={{ padding: '22px 26px 26px', textAlign: 'center' }}
      >
        <div style={{ color: titleColor, fontSize: 14, letterSpacing: 5, textShadow: `0 0 10px ${mix(accent, 70)}`, marginBottom: 14 }}>{title}</div>
        <div style={css('color:var(--cream-text);font-size:16px;line-height:2;')}>{children}</div>
      </TerminalPanel>
      <button className="press97" onClick={onReset} style={resetBtn(accent)}>{resetLabel}</button>
    </div>
  );
}

// Fallback ending (assembly completed outside the END stage flow).
export function EndingScreen({ onReset }) {
  return (
    <EndingFrame accent="var(--teal)" tag="CYBERPUNK2157 // 記憶重組完成" title="NTUHOSPITAL" titleColor="var(--teal-bright)" open onReset={onReset}>
      記憶已重組完成。<br />（結局劇情尚待補充）
    </EndingFrame>
  );
}

export function Ending1Screen({ onReset }) {
  const [storyDone, setStoryDone] = useState(false);
  if (!storyDone) {
    return <IntroScreen pages={ENDING1_PAGES} finalLabel="繼續 ▸" onDone={() => setStoryDone(true)} />;
  }
  return (
    <EndingFrame accent="var(--gold)" tag="CYBERPUNK2157 // 記憶處理結果" title="ENDING 1 // 保留所有記憶" titleColor="var(--gold-text)" open onReset={onReset}>
      你選擇帶著完整的自己，繼續走下去。<br />有笑，有淚，也有熬夜與狼狽——但這才是真正活過的證明。
    </EndingFrame>
  );
}

export function Ending2Screen({ onReset }) {
  // The narrative plays first as paginated story pages (same component as
  // the opening intro); only the short summary below appears in the final
  // terminal-box screen.
  const [storyDone, setStoryDone] = useState(false);
  if (!storyDone) {
    return <IntroScreen pages={ENDING2_PAGES} finalLabel="繼續 ▸" onDone={() => setStoryDone(true)} />;
  }
  return (
    <EndingFrame accent="var(--purple)" tag="CYBERPUNK2157 // 記憶處理結果" title="ENDING 2 // 將記憶封回" titleColor="var(--purple-text)" open={false} onReset={onReset}>
      你選擇把這些記憶重新鎖回原處。<br />不再想起那些酸楚與疲憊，只需要，繼續快樂地過下去。
    </EndingFrame>
  );
}
