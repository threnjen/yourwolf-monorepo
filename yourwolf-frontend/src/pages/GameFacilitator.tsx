import React from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useGame, useNightScript} from '../hooks/useGame';
import {gamesApi} from '../api/games';
import {Timer} from '../components/Timer';
import {ScriptReader} from '../components/ScriptReader';
import {theme} from '../styles/theme';
import type {GameSession, NightScript} from '../types/game';

const containerStyles: React.CSSProperties = {
  width: '100%',
  minHeight: 'calc(100vh - 150px)',
};

const phaseHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing.xl,
};

const phaseTitleStyles: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  color: theme.colors.text,
};

const primaryButtonStyle: React.CSSProperties = {
  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
  backgroundColor: theme.colors.primary,
  color: theme.colors.text,
  border: 'none',
  borderRadius: theme.borderRadius.md,
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
  backgroundColor: theme.colors.surface,
  color: theme.colors.text,
  border: `1px solid ${theme.colors.secondary}`,
  borderRadius: theme.borderRadius.sm,
  cursor: 'pointer',
};

const centerTextStyles: React.CSSProperties = {
  textAlign: 'center',
  color: theme.colors.text,
  fontSize: '20px',
  marginBottom: theme.spacing.xl,
};

const loadingStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '200px',
  color: theme.colors.textMuted,
  fontSize: '1.1rem',
};

const errorStyles: React.CSSProperties = {
  backgroundColor: `${theme.colors.error}20`,
  border: `1px solid ${theme.colors.error}`,
  borderRadius: theme.borderRadius.md,
  padding: theme.spacing.lg,
  color: theme.colors.error,
  textAlign: 'center',
};

// --- Phase sub-components ---

function SetupPhaseView({
  game,
  onStart,
}: {
  game: GameSession;
  onStart: () => void;
}): React.ReactElement {
  return (
    <div style={{textAlign: 'center'}}>
      <p style={centerTextStyles}>
        Distribute the role cards face-down to all players.
        <br />
        Place {game.center_card_count} cards in the center.
      </p>
      <button onClick={onStart} style={primaryButtonStyle}>
        Begin Night Phase
      </button>
    </div>
  );
}

function NightPhaseView({
  script,
  onComplete,
}: {
  script: NightScript;
  onComplete: () => void;
}): React.ReactElement {
  return <ScriptReader script={script} onComplete={onComplete} />;
}

function DiscussionPhaseView({
  timerSeconds,
  onComplete,
}: {
  timerSeconds: number;
  onComplete: () => void;
}): React.ReactElement {
  return (
    <div style={{textAlign: 'center'}}>
      <h2 style={{color: theme.colors.text, marginBottom: theme.spacing.lg}}>
        Discussion Time
      </h2>
      <Timer seconds={timerSeconds} onComplete={onComplete} />
      <p
        style={{
          color: theme.colors.textMuted,
          marginTop: theme.spacing.xl,
        }}
      >
        Discuss who you think the werewolves are!
      </p>
    </div>
  );
}

function VotingPhaseView({
  onComplete,
}: {
  onComplete: () => void;
}): React.ReactElement {
  return (
    <div style={{textAlign: 'center'}}>
      <h2 style={{color: theme.colors.text, marginBottom: theme.spacing.lg}}>
        Voting Phase
      </h2>
      <p style={centerTextStyles}>
        Everyone point at the player you want to eliminate on the count of
        three.
      </p>
      <button onClick={onComplete} style={primaryButtonStyle}>
        Reveal Results
      </button>
    </div>
  );
}

function ResolutionPhaseView({
  onComplete,
}: {
  onComplete: () => void;
}): React.ReactElement {
  return (
    <div style={{textAlign: 'center'}}>
      <h2 style={{color: theme.colors.text, marginBottom: theme.spacing.lg}}>
        Resolution
      </h2>
      <p style={centerTextStyles}>
        Flip your cards to reveal your roles!
      </p>
      <button onClick={onComplete} style={primaryButtonStyle}>
        Complete Game
      </button>
    </div>
  );
}

function CompletePhaseView({
  onNewGame,
}: {
  onNewGame: () => void;
}): React.ReactElement {
  return (
    <div style={{textAlign: 'center'}}>
      <h2 style={{color: theme.colors.text, marginBottom: theme.spacing.lg}}>
        Game Over
      </h2>
      <p style={centerTextStyles}>Thanks for playing!</p>
      <button onClick={onNewGame} style={primaryButtonStyle}>
        New Game
      </button>
    </div>
  );
}

// --- Main Page ---

export function GameFacilitatorPage(): React.ReactElement {
  const {gameId} = useParams<{gameId: string}>();
  const navigate = useNavigate();
  const {game, loading, error, refetch} = useGame(gameId!);
  const {script, loading: scriptLoading, error: scriptError} = useNightScript(gameId!, game?.phase === 'night');
  const [actionError, setActionError] = React.useState<string | null>(null);

  if (loading) {
    return <div style={loadingStyles}>Loading game...</div>;
  }

  if (error || !game) {
    return (
      <div style={errorStyles}>{error || 'Game not found'}</div>
    );
  }

  const handleAdvancePhase = async () => {
    setActionError(null);
    try {
      await gamesApi.advancePhase(gameId!);
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to advance phase';
      setActionError(message);
    }
  };

  const handleStartGame = async () => {
    setActionError(null);
    try {
      await gamesApi.start(gameId!);
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start game';
      setActionError(message);
    }
  };

  return (
    <div style={containerStyles}>
      {/* Phase Header */}
      <div style={phaseHeaderStyles}>
        <h1 style={phaseTitleStyles}>{game.phase.toUpperCase()} Phase</h1>
        <div style={{color: theme.colors.textMuted}}>
          {game.player_count} Players
        </div>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div style={errorStyles} role="alert">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            style={{
              marginLeft: theme.spacing.md,
              background: 'none',
              border: 'none',
              color: theme.colors.error,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Phase-specific content */}
      {game.phase === 'setup' && (
        <SetupPhaseView game={game} onStart={handleStartGame} />
      )}

      {game.phase === 'night' && scriptLoading && (
        <div style={loadingStyles}>Loading night script...</div>
      )}

      {game.phase === 'night' && scriptError && (
        <div style={errorStyles}>{scriptError}</div>
      )}

      {game.phase === 'night' && script && (
        <NightPhaseView script={script} onComplete={handleAdvancePhase} />
      )}

      {game.phase === 'discussion' && (
        <DiscussionPhaseView
          timerSeconds={game.discussion_timer_seconds}
          onComplete={handleAdvancePhase}
        />
      )}

      {game.phase === 'voting' && (
        <VotingPhaseView onComplete={handleAdvancePhase} />
      )}

      {game.phase === 'resolution' && (
        <ResolutionPhaseView onComplete={handleAdvancePhase} />
      )}

      {game.phase === 'complete' && (
        <CompletePhaseView onNewGame={() => navigate('/games/new')} />
      )}

      {/* Back button */}
      {game.phase !== 'complete' && (
        <div style={{marginTop: theme.spacing.xl, textAlign: 'center'}}>
          <button
            onClick={() => navigate('/')}
            style={secondaryButtonStyle}
          >
            Leave Game
          </button>
        </div>
      )}
    </div>
  );
}
