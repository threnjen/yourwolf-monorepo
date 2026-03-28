import React, {useState} from 'react';
import type {NightScript} from '../types/game';
import {theme} from '../styles/theme';

interface ScriptReaderProps {
  script: NightScript;
  onComplete: () => void;
}

const navButtonStyle: React.CSSProperties = {
  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
  backgroundColor: theme.colors.surface,
  color: theme.colors.text,
  border: `1px solid ${theme.colors.secondary}`,
  borderRadius: theme.borderRadius.sm,
  cursor: 'pointer',
  fontSize: '16px',
};

export function ScriptReader({
  script,
  onComplete,
}: ScriptReaderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentAction = script.actions[currentIndex];
  const isLastAction = currentIndex === script.actions.length - 1;

  const handleNext = () => {
    if (isLastAction) {
      onComplete();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div style={{maxWidth: '800px', margin: '0 auto'}}>
      {/* Progress bar */}
      <div
        style={{
          height: '4px',
          backgroundColor: theme.colors.surface,
          borderRadius: '2px',
          marginBottom: theme.spacing.xl,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${((currentIndex + 1) / script.actions.length) * 100}%`,
            backgroundColor: theme.colors.primary,
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }}
          data-testid="progress-bar"
        />
      </div>

      {/* Current action */}
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.xl,
          textAlign: 'center',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            color: theme.colors.primary,
            fontSize: '14px',
            textTransform: 'uppercase',
            marginBottom: theme.spacing.sm,
          }}
        >
          {currentAction.role_name}
        </div>
        <div
          style={{
            color: theme.colors.text,
            fontSize: '28px',
            lineHeight: 1.4,
          }}
        >
          {currentAction.instruction}
        </div>
      </div>

      {/* Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: theme.spacing.xl,
        }}
      >
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          style={{
            ...navButtonStyle,
            opacity: currentIndex === 0 ? 0.3 : 1,
          }}
        >
          ← Previous
        </button>

        <span style={{color: theme.colors.textMuted}}>
          {currentIndex + 1} / {script.actions.length}
        </span>

        <button onClick={handleNext} style={navButtonStyle}>
          {isLastAction ? 'Start Discussion' : 'Next →'}
        </button>
      </div>

      {/* Coming up preview */}
      <div style={{marginTop: theme.spacing.xl}}>
        <h3 style={{color: theme.colors.textMuted, fontSize: '14px'}}>
          Coming Up:
        </h3>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs}}>
          {script.actions
            .slice(currentIndex + 1, currentIndex + 6)
            .map((action, i) => (
              <span
                key={i}
                style={{
                  padding: `2px ${theme.spacing.sm}`,
                  backgroundColor: theme.colors.surfaceLight,
                  borderRadius: theme.borderRadius.sm,
                  fontSize: '12px',
                  color: theme.colors.textMuted,
                }}
              >
                {action.role_name}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
