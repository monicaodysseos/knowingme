'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import type { FakesView } from '@ksero-se/types';
import {
  copy,
  crownLine,
  everyoneElse,
  nameWins,
  progressDone,
  soundLike,
  wasAsked,
  whichReal,
  writeTv,
  writeWhat,
} from '@ksero-se/types';
import Y2KAvatar from '../tv/Y2KAvatar';
import { Y2K } from '../../lib/y2k';

interface Handlers {
  onStart?: () => void;
  onPlayAgain?: () => void;
  onGotIt?: () => void;
  onQuestions?: (questions: string[]) => void;
  onAnswers?: (answers: Array<{ assignmentId: string; text: string }>) => void;
  onFake?: (text: string) => void;
  onVote?: (optionId: string) => void;
  onLiterally?: (optionId: string | null) => void;
}

interface Props {
  view: FakesView;
  role: 'tv' | 'phone';
  isHost?: boolean;
  handlers?: Handlers;
}

function useNow(timerEnd: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [timerEnd]);
  return now;
}

export default function FakesStage({ view, role, isHost, handlers }: Props) {
  const now = useNow(view.timerEnd);
  const seconds = view.timerEnd > now ? Math.max(0, Math.ceil((view.timerEnd - now) / 1000)) : 0;
  const tv = role === 'tv';
  const shared = tv || view.phonesOnly;
  const titleSize = tv ? 'clamp(36px, 5vw, 72px)' : 28;
  const bodySize = tv ? 'clamp(18px, 2.2vw, 32px)' : 16;

  return (
    <div
      data-fakes-phase={view.phase}
      data-fakes-role={role}
      style={{
        minHeight: tv ? '100vh' : '100%',
        background: tv ? Y2K.bg : Y2K.cream,
        color: Y2K.dark,
        fontFamily: Y2K.body,
        padding: tv ? '4vh 6vw' : '8px 0 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: tv ? 18 : 14,
      }}
    >
      <Header view={view} tv={tv} seconds={seconds} />
      {view.phase === 'LOBBY' && (
        <Lobby view={view} tv={tv} isHost={!!isHost || tv} onStart={handlers?.onStart} titleSize={titleSize} />
      )}
      {view.phase === 'HOW_IT_WORKS' && (
        <How view={view} tv={tv} titleSize={titleSize} bodySize={bodySize} onGotIt={role === 'phone' ? handlers?.onGotIt : undefined} />
      )}
      {view.phase === 'WRITE' && (
        tv ? <Show lines={[writeTv(view.questionsToWrite), copy.weirder, progressDone(view.done, view.total)]} titleSize={titleSize} bodySize={bodySize} />
          : <WritePhone view={view} now={now} onQuestions={handlers?.onQuestions} />
      )}
      {view.phase === 'ANSWER' && (
        tv ? <Show lines={[copy.answerTv, progressDone(view.done, view.total)]} titleSize={titleSize} bodySize={bodySize} />
          : <AnswerPhone view={view} now={now} onAnswers={handlers?.onAnswers} />
      )}
      {view.phase === 'DOUBLE' && (
        shared
          ? <Show lines={[copy.finalPass, copy.pointsDoubled]} titleSize={titleSize} bodySize={bodySize} />
          : <p style={{ fontWeight: 800, fontSize: 22 }}>{copy.eyes}</p>
      )}
      {view.phase === 'FAKE' && (
        tv ? <Show lines={[wasAsked(view.subjectName ?? ''), view.questionText ?? '', everyoneElse(view.subjectName ?? ''), progressDone(view.done, view.total)]} titleSize={titleSize} bodySize={bodySize} />
          : <FakePhone view={view} now={now} onFake={handlers?.onFake} />
      )}
      {view.phase === 'VOTE' && (
        <VoteBlock view={view} tv={tv} titleSize={titleSize} bodySize={bodySize} now={now} onVote={handlers?.onVote} onLiterally={handlers?.onLiterally} />
      )}
      {view.phase === 'REVEAL' && view.reveal && (
        shared
          ? <Show lines={view.reveal.lines} titleSize={titleSize} bodySize={bodySize} />
          : <p style={{ fontWeight: 800, fontSize: 22 }}>{copy.eyes}</p>
      )}
      {view.phase === 'SCOREBOARD' && (
        shared ? <Scores view={view} tv={tv} /> : <p style={{ fontWeight: 800, fontSize: 22 }}>{copy.eyes}</p>
      )}
      {view.phase === 'CROWN' && <Crown view={view} tv={tv} titleSize={titleSize} />}
      {view.phase === 'AWARDS' && (
        <Awards view={view} tv={tv} isHost={!!isHost || tv} onPlayAgain={handlers?.onPlayAgain} titleSize={titleSize} />
      )}
    </div>
  );
}

function Header({ view, tv, seconds }: { view: FakesView; tv: boolean; seconds: number }) {
  if (!view.timerEnd || view.phase === 'LOBBY' || view.phase === 'AWARDS') return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: Y2K.display, fontWeight: 800 }}>
      <span style={{ fontSize: tv ? 22 : 14 }}>{view.doubled && view.phase !== 'DOUBLE' ? copy.pointsDoubled : ''}</span>
      <span data-fakes-timer style={{ fontSize: tv ? 42 : 28 }}>{seconds}</span>
    </div>
  );
}

function Lobby({ view, tv, isHost, onStart, titleSize }: { view: FakesView; tv: boolean; isHost: boolean; onStart?: () => void; titleSize: number | string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div data-testid="fakes-room" style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: titleSize }}>{view.roomCode}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        {view.players.map((player) => (
          <div key={player.playerId} style={{ textAlign: 'center', opacity: player.connected ? 1 : 0.4 }}>
            <Y2KAvatar avatar={player.avatar} size={tv ? 72 : 48} />
            <div style={{ fontWeight: 800 }}>{player.name}</div>
          </div>
        ))}
      </div>
      {isHost && (
        <BigButton testId="fakes-start" label={view.players.length >= 2 ? copy.start : copy.needPlayers} disabled={view.players.length < 2} onClick={onStart} />
      )}
      {!isHost && <p style={{ fontWeight: 700 }}>{copy.eyes}</p>}
    </div>
  );
}

function How({ view, tv, titleSize, bodySize, onGotIt }: { view: FakesView; tv: boolean; titleSize: number | string; bodySize: number | string; onGotIt?: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: tv ? 'center' : 'stretch', textAlign: tv ? 'center' : 'left' }}>
      <h1 style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: titleSize, margin: 0 }}>{copy.howTitle}</h1>
      {copy.howSteps.map((step) => (
        <p key={step} style={{ fontSize: bodySize, fontWeight: 700, margin: 0 }}>{step}</p>
      ))}
      <p style={{ fontSize: bodySize, fontWeight: 700, margin: 0 }}>{copy.howPoints}</p>
      {onGotIt && <BigButton testId="fakes-got-it" label={copy.gotIt} onClick={onGotIt} />}
    </div>
  );
}

function Show({ lines, titleSize, bodySize }: { lines: string[]; titleSize: number | string; bodySize: number | string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center' }}>
      {lines.filter(Boolean).map((line, index) => (
        <p key={`${index}-${line}`} style={{ fontFamily: index === 0 ? Y2K.display : Y2K.body, fontWeight: 800, fontSize: index === 0 ? titleSize : bodySize, margin: 0 }}>{line}</p>
      ))}
    </div>
  );
}

function WritePhone({ view, now, onQuestions }: { view: FakesView; now: number; onQuestions?: (questions: string[]) => void }) {
  const count = view.questionsToWrite;
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<string[]>(() => Array.from({ length: count }, () => ''));
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (view.submitted) setSent(true);
  }, [view.submitted]);
  useEffect(() => {
    if (sent || view.phase !== 'WRITE') return;
    if (view.timerEnd && now >= view.timerEnd) {
      setSent(true);
      onQuestions?.(drafts.map((item) => item.trim()).filter(Boolean));
    }
  }, [now, view.timerEnd, view.phase, sent, drafts, onQuestions]);
  if (sent || view.submitted) return <p style={{ fontWeight: 800, fontSize: 22 }}>{copy.sentWait}</p>;
  const last = index >= count - 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontWeight: 800, margin: 0 }}>{copy.askFriend}</p>
      <textarea
        data-fakes-input
        value={drafts[index] ?? ''}
        placeholder={copy.questionPlaceholder}
        maxLength={80}
        onChange={(event) => {
          const next = [...drafts];
          next[index] = event.target.value;
          setDrafts(next);
        }}
        style={fieldStyle}
      />
      <BigButton
        testId="fakes-send"
        label={last ? copy.sendIt : copy.next}
        disabled={!(drafts[index] ?? '').trim()}
        onClick={() => {
          if (last) {
            setSent(true);
            onQuestions?.(drafts.map((item) => item.trim()).filter(Boolean));
          } else {
            setIndex((value) => value + 1);
          }
        }}
      />
    </div>
  );
}

function AnswerPhone({ view, now, onAnswers }: { view: FakesView; now: number; onAnswers?: (answers: Array<{ assignmentId: string; text: string }>) => void }) {
  const prompts = view.prompts ?? [];
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    setDrafts((current) => prompts.map((_, i) => current[i] ?? ''));
  }, [prompts.length]);
  useEffect(() => {
    if (sent || view.phase !== 'ANSWER') return;
    if (view.timerEnd && now >= view.timerEnd) {
      setSent(true);
      onAnswers?.(prompts.map((prompt, i) => ({ assignmentId: prompt.id, text: (drafts[i] ?? '').trim() })).filter((item) => item.text));
    }
  }, [now, view.timerEnd, view.phase, sent, drafts, prompts, onAnswers]);
  if (sent || view.submitted) return <p style={{ fontWeight: 800, fontSize: 22 }}>{copy.lockedIn}</p>;
  const prompt = prompts[index];
  if (!prompt) return <p style={{ fontWeight: 800 }}>{copy.eyes}</p>;
  const last = index >= prompts.length - 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontWeight: 800, margin: 0 }}>{copy.aboutYou}</p>
      <p style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>{prompt.text}</p>
      <textarea
        data-fakes-input
        value={drafts[index] ?? ''}
        placeholder={copy.realPlaceholder}
        maxLength={120}
        onChange={(event) => {
          const next = [...drafts];
          next[index] = event.target.value;
          setDrafts(next);
        }}
        style={fieldStyle}
      />
      <BigButton
        testId="fakes-send"
        label={last ? copy.lockedIn : copy.next}
        disabled={!(drafts[index] ?? '').trim()}
        onClick={() => {
          if (!last) {
            setIndex((value) => value + 1);
            return;
          }
          const answers = prompts.map((item, i) => ({ assignmentId: item.id, text: (drafts[i] ?? '').trim() })).filter((item) => item.text);
          if (answers.length === 0) return;
          setSent(true);
          onAnswers?.(answers);
        }}
      />
    </div>
  );
}

function FakePhone({ view, now, onFake }: { view: FakesView; now: number; onFake?: (text: string) => void }) {
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (view.isSubject || sent || view.submitted || view.phase !== 'FAKE') return;
    if (view.timerEnd && now >= view.timerEnd && text.trim()) {
      setSent(true);
      onFake?.(text.trim());
    }
  }, [now, view.timerEnd, view.phase, view.isSubject, view.submitted, sent, text, onFake]);
  if (view.isSubject) return <p style={{ fontWeight: 800, fontSize: 22 }}>{copy.subjectWait}</p>;
  if (sent || view.submitted) return <p style={{ fontWeight: 800, fontSize: 22 }}>{copy.lockedIn}</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontWeight: 800, margin: 0 }}>{writeWhat(view.subjectName ?? '')}</p>
      <p style={{ margin: 0 }}>{view.questionText}</p>
      <textarea
        data-fakes-input
        value={text}
        placeholder={soundLike(view.subjectName ?? '')}
        maxLength={120}
        onChange={(event) => setText(event.target.value)}
        style={fieldStyle}
      />
      <BigButton testId="fakes-send" label={copy.lockedIn} disabled={!text.trim()} onClick={() => { setSent(true); onFake?.(text.trim()); }} />
    </div>
  );
}

function VoteBlock({
  view, tv, titleSize, bodySize, now, onVote, onLiterally,
}: {
  view: FakesView;
  tv: boolean;
  titleSize: number | string;
  bodySize: number | string;
  now: number;
  onVote?: (optionId: string) => void;
  onLiterally?: (optionId: string | null) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const options = view.options ?? [];
  useEffect(() => {
    if (tv || sent || view.submitted || view.phase !== 'VOTE') return;
    if (view.timerEnd && now >= view.timerEnd) {
      setSent(true);
      if (view.isSubject) onLiterally?.(picked);
      else if (picked) onVote?.(picked);
    }
  }, [now, view.timerEnd, view.phase, view.submitted, view.isSubject, tv, sent, picked, onVote, onLiterally]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: titleSize, margin: 0, textAlign: 'center' }}>{whichReal(view.subjectName ?? '')}</p>
      {tv && <p style={{ textAlign: 'center', fontWeight: 800, fontSize: bodySize }}>{progressDone(view.done, view.total)}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((option) => {
          const selected = picked === option.id;
          return (
            <button
              key={option.id}
              type="button"
              data-fakes-option={option.id}
              disabled={tv || option.disabled || sent || view.submitted}
              onClick={() => { if (!tv && !option.disabled) setPicked(option.id); }}
              style={{
                textAlign: 'left',
                padding: '14px 16px',
                borderRadius: 16,
                border: `3px solid ${Y2K.dark}`,
                background: option.disabled ? '#e5e7eb' : selected ? Y2K.yellow : '#fff',
                fontWeight: 800,
                fontSize: tv ? 22 : 16,
                color: option.disabled ? '#6b7280' : Y2K.dark,
                cursor: tv || option.disabled ? 'default' : 'pointer',
              }}
            >
              {option.text}
              {option.yours ? ` · ${copy.yours}` : ''}
              {view.isSubject && selected ? ` · ${copy.literallyMe}` : ''}
            </button>
          );
        })}
      </div>
      {!tv && !sent && !view.submitted && (
        <BigButton
          testId="fakes-send"
          label={copy.lockedIn}
          disabled={!view.isSubject && !picked}
          onClick={() => {
            setSent(true);
            if (view.isSubject) onLiterally?.(picked);
            else if (picked) onVote?.(picked);
          }}
        />
      )}
      {(sent || view.submitted) && !tv && <p style={{ fontWeight: 800 }}>{copy.lockedIn}</p>}
    </div>
  );
}

function Scores({ view, tv }: { view: FakesView; tv: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h1 style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: tv ? 64 : 32, margin: 0, textAlign: 'center' }}>{copy.scores}</h1>
      {view.players.map((player) => (
        <div key={player.playerId} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: tv ? 28 : 18 }}>
          <span>{player.rank}. {player.name}</span>
          <span>{player.score}</span>
        </div>
      ))}
      <p style={{ fontWeight: 700, textAlign: 'center' }}>{copy.scoreFooter}</p>
    </div>
  );
}

function Crown({ view, tv, titleSize }: { view: FakesView; tv: boolean; titleSize: number | string }) {
  const winners = view.players.filter((player) => (view.crownNames ?? []).includes(player.name));
  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        {winners.map((player) => <Y2KAvatar key={player.playerId} avatar={player.avatar} size={tv ? 140 : 96} />)}
      </div>
      <h1 style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: titleSize, margin: 0 }}>
        {view.draw
          ? copy.draw
          : tv
            ? crownLine(view.crownNames?.[0] ?? '')
            : view.youWin
              ? copy.youWin
              : nameWins(view.crownNames?.[0] ?? '')}
      </h1>
      {!view.draw && <p style={{ fontWeight: 800, fontSize: tv ? 36 : 22 }}>{winners[0]?.score ?? ''}</p>}
    </div>
  );
}

function Awards({ view, tv, isHost, onPlayAgain, titleSize }: { view: FakesView; tv: boolean; isHost: boolean; onPlayAgain?: () => void; titleSize: number | string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Crown view={view} tv={tv} titleSize={titleSize} />
      {(view.awards ?? []).map((award) => (
        <div key={award.id} style={{ background: '#fff', border: `3px solid ${Y2K.dark}`, borderRadius: 16, padding: 12 }}>
          <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: tv ? 28 : 18 }}>{award.title}</div>
          <div style={{ fontWeight: 700 }}>{award.winners.length ? award.winners.join(', ') : copy.nobody}</div>
        </div>
      ))}
      {isHost && <BigButton testId="fakes-again" label={copy.playAgain} onClick={onPlayAgain} />}
    </div>
  );
}

function BigButton({ label, onClick, disabled, testId }: { label: string; onClick?: () => void; disabled?: boolean; testId?: string }) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: '100%',
        padding: '16px 18px',
        borderRadius: 999,
        border: `3px solid ${Y2K.dark}`,
        background: disabled ? '#e5e7eb' : Y2K.hotPink,
        color: disabled ? '#6b7280' : '#fff',
        fontFamily: Y2K.display,
        fontWeight: 900,
        fontSize: 20,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {label}
    </button>
  );
}

const fieldStyle: CSSProperties = {
  width: '100%',
  minHeight: 88,
  borderRadius: 16,
  border: `3px solid ${Y2K.dark}`,
  padding: 12,
  fontFamily: Y2K.body,
  fontWeight: 700,
  fontSize: 16,
};
