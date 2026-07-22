import { useEffect, useMemo, useRef, useState } from 'react';
import { CIPHER_CELLS } from '../../data/cipher.js';
import { FRAGMENT_KEY_LETTERS } from '../../lib/pieces.js';
import { useTypewriter } from '../../hooks/useTypewriter.js';
import { SegText } from '../ui/SegText.jsx';
import { TerminalPanel } from '../ui/TerminalPanel.jsx';
import { AnswerTerminal } from '../ui/AnswerTerminal.jsx';
import { NavButtons } from '../ui/NavButtons.jsx';
import { ScorePopup } from '../ui/ScorePopup.jsx';
import { HintButton } from '../ui/HintButton.jsx';
import { track } from '../../lib/track.js';
import { WRONG_PENALTY } from '../../lib/scoring.js';
import { css, mix } from '../../lib/css.js';

function CipherTable() {
  return (
    <TerminalPanel
      small
      title="VIGENÈRE CIPHER // 維吉尼亞密碼表"
      outerStyle={{ animation: 'fadeUp 0.5s ease both' }}
      bodyStyle={{ padding: 14, overflowX: 'auto' }}
    >
      <div style={css('display:inline-grid;grid-template-columns:repeat(27, 20px);gap:1px;background:rgba(var(--teal-rgb),0.12);border:1px solid rgba(var(--teal-rgb),0.3);border-radius:4px;padding:1px;')}>
        {CIPHER_CELLS.map((cell, i) => <div key={i} style={css(cell.style)}>{cell.text}</div>)}
      </div>
      <div style={css('color:var(--teal-text-dim);font-size:10px;letter-spacing:1px;margin-top:10px;')}>◆ 左側直排 ＝ 第一把鑰匙　◆ 上方橫排 ＝ 第二把鑰匙　◆ 交叉點 ＝ 密碼字母</div>
    </TerminalPanel>
  );
}

// A raised, beveled keycap look for the on-screen keypad — top highlight +
// bottom shadow curvature plus a thicker bottom edge, so each key reads as
// a physical cap sitting above the panel rather than a flat colored tile.
// `.key-frag`'s :active rule (global.css) still overrides background/border
// on press, composing with the magnetic-tilt press scale from `--press`.
function keycapStyle(borderColor, { height, fontSize }) {
  return {
    height, fontSize, borderRadius: 6, color: 'var(--teal-text)', cursor: 'pointer',
    background: `linear-gradient(180deg, rgba(255,255,255,0.1), transparent 45%), var(--teal-key-bg)`,
    border: `1px solid ${mix(borderColor, 33)}`,
    borderBottom: `3px solid ${mix(borderColor, 45)}`,
    boxShadow: `0 3px 6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 3px rgba(0,0,0,0.3)`,
    '--accent': borderColor,
  };
}

// Corner bracket set drawn around the input areas.
function Brackets({ color, size = 10, weight = 1.5 }) {
  const b = `${weight}px solid ${color}`;
  return (
    <>
      <div style={{ position: 'absolute', width: size, height: size, top: 0, left: 0, borderTop: b, borderLeft: b }} />
      <div style={{ position: 'absolute', width: size, height: size, top: 0, right: 0, borderTop: b, borderRight: b }} />
      <div style={{ position: 'absolute', width: size, height: size, bottom: 0, left: 0, borderBottom: b, borderLeft: b }} />
      <div style={{ position: 'absolute', width: size, height: size, bottom: 0, right: 0, borderBottom: b, borderRight: b }} />
    </>
  );
}

/**
 * A puzzle beat: optional description terminal, optional cipher table, and the
 * answer-input terminal in one of four input modes:
 * - fragment keypad (next non-story beat is a fragment → letter blanks + A–Z keys)
 * - letter keypad (beat.keypadInput → letter blanks + A–Z keys, no digits)
 * - hi-tech cells (beat.hiTechInput → per-letter cells over an invisible input)
 * - plain text input
 */
export function PuzzleBeat({ stageKey, beat, beatIndex, isFragmentAnswer, hasPrev, startDone, onAdvance, onPrev, onCorrect, onWrong, wrongCount, hintUsed, onUseHint }) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle'); // idle | wrong | correct
  const [scoreGain, setScoreGain] = useState(null); // set on correct AND wrong answers, to pop the ScorePopup
  const [scoreGainKey, setScoreGainKey] = useState(0); // bumped each time, to remount ScorePopup and replay its animation
  const wrongTimer = useRef(null);
  useEffect(() => () => clearTimeout(wrongTimer.current), []);

  // `introSegs` (optional) is plain narration shown ABOVE the terminal panel —
  // for a page that reads as "story text, then a terminal device below it"
  // rather than cramming everything into the terminal box. It types out
  // first, then descSegs continues the same typewriter budget inside the panel.
  const introSegs = beat.introSegs || [];
  const introLen = useMemo(() => introSegs.reduce((n, s) => n + s.text.length, 0), [introSegs]);
  const descText = useMemo(() => [...introSegs, ...beat.descSegs].map((s) => s.text).join(''), [beat]);
  const { count, done, skip } = useTypewriter(descText, { startDone });
  const descCount = Math.max(0, count - introLen);

  const isKeypad = !isFragmentAnswer && !!beat.keypadInput;
  const isHiTech = !isFragmentAnswer && !isKeypad && !!beat.hiTechInput;
  const accent = beat.panel ? beat.panel.accent : 'var(--teal)';
  const borderColor = status === 'correct' ? 'var(--teal)' : status === 'wrong' ? 'var(--pink)' : 'var(--purple-dim)';
  const inputDisabled = status === 'correct';

  // Fragment codes (e.g. "MF") are accepted in any letter order — the
  // collected fragment is always beat's fixed answer letter regardless of
  // which order was typed, since FragmentBeat reads its own `letter` prop.
  const isPermutationMatch = (a, b) => a.length === b.length && [...a].sort().join('') === [...b].sort().join('');

  const submit = () => {
    const given = input.trim();
    if (!given) return;
    if (status === 'correct') { onAdvance(); return; }
    const match = beat.acceptAny
      ? true
      : isFragmentAnswer
        ? isPermutationMatch(given.toUpperCase(), beat.answer.toUpperCase())
        : beat.caseInsensitive
          ? given.toLowerCase() === beat.answer.toLowerCase()
          : given === beat.answer;
    track('puzzle_attempt', { stageKey, beatIndex, input: given, correct: match });
    clearTimeout(wrongTimer.current);
    if (match) {
      onCorrect();
      // What this beat actually nets out to: its full value minus the 40
      // already docked for each wrong attempt along the way (those already
      // hit the score in real time) — not just its flat listed points.
      if (beat.points) {
        setScoreGain(beat.points - (beat.wrongPenalty ?? WRONG_PENALTY) * wrongCount);
        setScoreGainKey((k) => k + 1);
      }
      setStatus('correct');
    } else {
      // The 10th wrong attempt on THIS beat gets waved through instead of
      // leaving the team stuck forever — they just don't get its points.
      const forcePass = onWrong();
      if (beat.points) {
        setScoreGain(-(beat.wrongPenalty ?? WRONG_PENALTY));
        setScoreGainKey((k) => k + 1);
      }
      if (forcePass) {
        setStatus('correct');
      } else {
        setStatus('wrong');
        setInput('');
        wrongTimer.current = setTimeout(() => setStatus((s) => (s === 'wrong' ? 'idle' : s)), 1400);
      }
    }
  };

  // Functional updates throughout — two taps landing before React re-renders
  // (fast on-screen typing) must not let the second tap's stale closure drop
  // the first keystroke.
  const pressKey = (ch) => {
    if (status === 'correct') return;
    setInput((prev) => (prev.length >= beat.answer.length ? prev : prev + ch));
    setStatus('idle');
  };

  const blanksOf = (chars, maxLen) => Array.from({ length: maxLen }).map((_, i) => ({
    char: chars[i] || '',
    isCursor: i === chars.length && status !== 'correct',
  }));

  return (
    <div style={css('flex:1;display:flex;flex-direction:column;justify-content:flex-start;gap:18px;overflow-y:auto;min-height:0;padding:22px 2px 4px;')}>
      <div style={css('margin:auto 0;display:flex;flex-direction:column;gap:18px;')}>

        {introSegs.length > 0 && (
          <div style={css('font-size:19px;line-height:2.1;text-align:left;width:100%;')} onClick={() => { if (!done) skip(); }}>
            <SegText segs={introSegs} count={count} cursorColor={count < introLen ? accent : null} paraMargin={16} />
          </div>
        )}

        {beat.descSegs.length > 0 && (
          <TerminalPanel
            accent={accent}
            title={beat.panel ? beat.panel.title : 'MEMORY TERMINAL // 記憶解密終端'}
            tag={`NO.${String(beatIndex + 1).padStart(2, '0')}`}
            boot="0.85s"
            onClick={() => { if (!done) skip(); }}
            bodyStyle={{ padding: '20px 22px 24px', fontSize: 16, lineHeight: 2, textAlign: 'left', width: '100%', minHeight: 64 }}
          >
            <SegText segs={beat.descSegs} count={descCount} cursorColor={done ? null : accent} accent={accent} />
          </TerminalPanel>
        )}

        {beat.showCipherTable && <CipherTable />}

        <div style={css('position:relative;')}>
          {scoreGain != null && <ScorePopup key={scoreGainKey} amount={scoreGain} />}
          {beat.points > 100 && <HintButton hint={beat.hint} used={hintUsed || status === 'correct'} onUse={onUseHint} />}
          <AnswerTerminal
            borderColor={borderColor}
            status={status}
            label={beat.inputLabel}
            headerRight={wrongCount > 0 ? (
              <span style={css('color:var(--pink-text);font-size:10px;letter-spacing:1px;')}>✕ 答錯 {wrongCount} 次</span>
            ) : undefined}
            wrongMsg="答案不對,再試一次"
            correctMsg="解密成功"
          >
          {isFragmentAnswer ? (
            <>
              <div style={css('position:relative;padding:10px 6px;margin-bottom:6px;')}>
                <Brackets color={mix(borderColor, 53)} size={12} />
                <div style={css('display:flex;gap:10px;justify-content:center;')}>
                  {blanksOf(input.split(''), beat.answer.length).map((blank, i) => (
                    <div key={i} style={{
                      ...css('width:56px;height:64px;border-radius:8px;background:linear-gradient(180deg, var(--input-hi), var(--input-bg));display:flex;align-items:center;justify-content:center;font-size:28px;color:var(--teal-text-bright);text-shadow:0 0 8px rgba(var(--teal-rgb),0.5);'),
                      border: `1px solid ${blank.char ? borderColor : 'var(--purple-dim)'}`,
                      boxShadow: `inset 0 2px 8px rgba(0,0,0,0.6), 0 0 10px ${mix(blank.char ? borderColor : 'var(--purple-dim)', 20)}`,
                      animation: `blankPop 0.4s ease ${(i * 0.05).toFixed(2)}s both`,
                    }}>
                      {blank.char}
                      {blank.isCursor && (
                        <span style={{ ...css('width:2px;height:28px;display:inline-block;animation:cursorBlink 1s step-start infinite;'), background: borderColor }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div style={css('display:grid;grid-template-columns:repeat(6, 1fr);gap:6px;')}>
                {FRAGMENT_KEY_LETTERS.map((l) => (
                  <button
                    key={l}
                    className="key-frag"
                    onClick={() => pressKey(l)}
                    style={keycapStyle(borderColor, { height: 40, fontSize: 14 })}
                  >{l}</button>
                ))}
              </div>
              <button
                className="press96"
                onClick={() => status !== 'correct' && setInput((prev) => prev.slice(0, -1))}
                style={css("width:100%;margin-top:7px;height:38px;background:var(--purple-btn);border:1px solid var(--purple-border);border-radius:6px;color:var(--purple-text);font-size:12px;letter-spacing:2px;cursor:pointer;")}
              >⌫ 清除</button>
            </>
          ) : isKeypad ? (
            <>
              <div style={css('position:relative;padding:10px 6px;margin-bottom:6px;')}>
                <Brackets color={mix(borderColor, 53)} size={12} />
                <div style={css('display:flex;gap:6px;justify-content:center;flex-wrap:wrap;')}>
                  {blanksOf(input.split(''), beat.answer.length).map((blank, i) => (
                    <div key={i} style={{
                      ...css('width:34px;height:44px;border-radius:6px;background:linear-gradient(180deg, var(--input-hi), var(--input-bg));display:flex;align-items:center;justify-content:center;font-size:17px;color:var(--teal-text-bright);text-shadow:0 0 8px rgba(var(--teal-rgb),0.5);'),
                      border: `1px solid ${blank.char ? borderColor : 'var(--purple-dim)'}`,
                      boxShadow: `inset 0 2px 8px rgba(0,0,0,0.6), 0 0 10px ${mix(blank.char ? borderColor : 'var(--purple-dim)', 20)}`,
                      animation: `blankPop 0.4s ease ${(i * 0.05).toFixed(2)}s both`,
                    }}>
                      {blank.char}
                      {blank.isCursor && (
                        <span style={{ ...css('width:2px;height:20px;display:inline-block;animation:cursorBlink 1s step-start infinite;'), background: borderColor }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div style={css('display:grid;grid-template-columns:repeat(6, 1fr);gap:6px;')}>
                {FRAGMENT_KEY_LETTERS.map((k) => (
                  <button
                    key={k}
                    className="key-frag"
                    onClick={() => pressKey(k)}
                    style={keycapStyle(borderColor, { height: 36, fontSize: 13 })}
                  >{k}</button>
                ))}
              </div>
              <button
                className="press96"
                onClick={() => status !== 'correct' && setInput((prev) => prev.slice(0, -1))}
                style={css("width:100%;margin-top:7px;height:38px;background:var(--purple-btn);border:1px solid var(--purple-border);border-radius:6px;color:var(--purple-text);font-size:12px;letter-spacing:2px;cursor:pointer;")}
              >⌫ 清除</button>
            </>
          ) : isHiTech ? (
            <div style={css('position:relative;')}>
              <div style={css('position:relative;display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:16px 12px;border-radius:10px;overflow:hidden;background:repeating-linear-gradient(135deg, rgba(var(--teal-rgb),0.04) 0px, rgba(var(--teal-rgb),0.04) 2px, transparent 2px, transparent 14px), var(--input-bg);border:1px solid rgba(var(--teal-rgb),0.25);')}>
                <div style={css('position:absolute;top:0;left:-40%;width:40%;height:100%;background:linear-gradient(90deg, transparent, rgba(var(--teal-rgb),0.18), transparent);animation:hiTechScan 3.2s linear infinite;pointer-events:none;')} />
                <div style={css('position:absolute;top:6px;left:8px;width:8px;height:8px;border-top:1.5px solid rgba(var(--teal-rgb),0.6);border-left:1.5px solid rgba(var(--teal-rgb),0.6);pointer-events:none;')} />
                <div style={css('position:absolute;bottom:6px;right:8px;width:8px;height:8px;border-bottom:1.5px solid rgba(var(--teal-rgb),0.6);border-right:1.5px solid rgba(var(--teal-rgb),0.6);pointer-events:none;')} />
                {blanksOf(input.toUpperCase().split(''), beat.answer.length).map((blank, i) => (
                  <div key={i} style={{
                    ...css('position:relative;width:32px;height:44px;border-radius:6px;background:linear-gradient(180deg, var(--input-hi), var(--input-lo));display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:var(--teal-text-bright);text-shadow:0 0 8px rgba(var(--teal-rgb),0.7);'),
                    border: `1.5px solid ${blank.char ? borderColor : 'rgba(var(--teal-rgb),0.28)'}`,
                    animation: blank.isCursor
                      ? 'hiTechCellGlow 1.3s ease-in-out infinite'
                      : blank.char ? 'blankPop 0.35s ease both' : 'none',
                  }}>
                    {blank.char}
                    {blank.isCursor && (
                      <span style={{ ...css('position:absolute;bottom:5px;width:14px;height:2px;animation:cursorBlink 1s step-start infinite;'), background: borderColor }} />
                    )}
                  </div>
                ))}
              </div>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={inputDisabled}
                maxLength={beat.answer.length}
                style={css('position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:text;')}
              />
              <div style={css('text-align:center;color:var(--teal-faint);font-size:9px;letter-spacing:2px;margin-top:8px;')}>TAP TO INPUT · 點擊輸入</div>
            </div>
          ) : (
            <div style={css('position:relative;padding:6px;animation:inputRise 0.4s ease both;')}>
              <Brackets color={mix(borderColor, 47)} />
              {/* Corner bolts — same rivet motif as the terminal bezel, so
                  the input reads as a bolted-in device panel rather than a
                  plain text box. */}
              <div style={css('position:absolute;top:2px;left:2px;width:4px;height:4px;border-radius:50%;background:var(--screw);box-shadow:inset 0 1px 1px rgba(0,0,0,0.6);z-index:2;')} />
              <div style={css('position:absolute;top:2px;right:2px;width:4px;height:4px;border-radius:50%;background:var(--screw);box-shadow:inset 0 1px 1px rgba(0,0,0,0.6);z-index:2;')} />
              <div style={css('position:absolute;bottom:2px;left:2px;width:4px;height:4px;border-radius:50%;background:var(--screw);box-shadow:inset 0 1px 1px rgba(0,0,0,0.6);z-index:2;')} />
              <div style={css('position:absolute;bottom:2px;right:2px;width:4px;height:4px;border-radius:50%;background:var(--screw);box-shadow:inset 0 1px 1px rgba(0,0,0,0.6);z-index:2;')} />
              <div style={{
                ...css('position:relative;border-radius:10px;padding:3px;'),
                background: `linear-gradient(155deg, rgba(255,255,255,0.08), transparent 30%, rgba(0,0,0,0.3))`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 2px rgba(0,0,0,0.5)',
              }}>
                <div style={{ ...css('position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:20px;pointer-events:none;font-weight:700;z-index:2;'), color: borderColor, textShadow: `0 0 8px ${borderColor}` }}>&gt;</div>
                <span style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                  width: 5, height: 5, borderRadius: '50%', background: borderColor,
                  boxShadow: `0 0 6px ${borderColor}`, animation: status === 'idle' ? 'recBlink 1.6s step-start infinite' : 'none',
                  pointerEvents: 'none',
                }} />
                <div style={css('position:absolute;left:1px;top:1px;right:1px;height:16px;border-radius:8px 8px 0 0;background:linear-gradient(to bottom, rgba(255,255,255,0.06), transparent);pointer-events:none;')} />
                <input
                  className="puzzle-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={inputDisabled}
                  placeholder="輸入解密內容……"
                  style={{
                    ...css("width:100%;height:60px;background:var(--input-bg);border-radius:8px;color:var(--teal-text-bright);font-family:var(--font-ui);font-size:20px;padding:0 34px 0 40px;letter-spacing:4px;transition:box-shadow 0.2s, border-color 0.2s;"),
                    border: `1px solid ${borderColor}`,
                    boxShadow: `inset 0 3px 10px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,255,255,0.04), 0 0 14px ${mix(borderColor, 20)}`,
                    '--accent-focus': mix(borderColor, 47),
                  }}
                />
              </div>
            </div>
          )}
        </AnswerTerminal>
        </div>
      </div>

      <NavButtons
        hasPrev={hasPrev}
        onPrev={onPrev}
        onNext={submit}
        nextLabel={status === 'correct' ? '繼續 ▸' : '確認'}
        style={{ animation: 'none' }}
      />
    </div>
  );
}
