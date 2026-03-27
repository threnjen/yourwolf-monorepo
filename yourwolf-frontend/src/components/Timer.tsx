import React, {useState, useEffect, useRef} from 'react';
import {theme} from '../styles/theme';

interface TimerProps {
  seconds: number;
  onComplete: () => void;
  autoStart?: boolean;
}

const CIRCLE_RADIUS = 45;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS; // ~283
const WARNING_THRESHOLD_SECONDS = 30;

export function Timer({
  seconds,
  onComplete,
  autoStart = true,
}: TimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const [isRunning, setIsRunning] = useState(autoStart);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isRunning || remaining <= 0) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onCompleteRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, remaining]);

  const formatTime = (s: number): string => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (seconds - remaining) / seconds;

  return (
    <div style={{textAlign: 'center'}}>
      {/* Circular progress */}
      <div
        style={{
          position: 'relative',
          width: '200px',
          height: '200px',
          margin: '0 auto',
        }}
      >
        <svg viewBox="0 0 100 100" style={{transform: 'rotate(-90deg)'}}>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={theme.colors.surface}
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={remaining < WARNING_THRESHOLD_SECONDS ? theme.colors.error : theme.colors.primary}
            strokeWidth="8"
            strokeDasharray={`${progress * CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`}
            strokeLinecap="round"
            data-testid="progress-circle"
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '48px',
            fontWeight: 'bold',
            color:
              remaining < WARNING_THRESHOLD_SECONDS ? theme.colors.error : theme.colors.text,
          }}
          data-testid="timer-display"
        >
          {formatTime(remaining)}
        </div>
      </div>

      {/* Controls */}
      <div style={{marginTop: theme.spacing.lg}}>
        <button
          onClick={() => setIsRunning(!isRunning)}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            border: `1px solid ${theme.colors.secondary}`,
            borderRadius: theme.borderRadius.sm,
            marginRight: theme.spacing.sm,
            cursor: 'pointer',
          }}
        >
          {isRunning ? 'Pause' : 'Resume'}
        </button>
        <button
          onClick={onComplete}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            backgroundColor: theme.colors.primary,
            color: theme.colors.text,
            border: 'none',
            borderRadius: theme.borderRadius.sm,
            cursor: 'pointer',
          }}
        >
          Skip to Voting
        </button>
      </div>
    </div>
  );
}
