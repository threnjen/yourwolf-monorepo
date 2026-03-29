import {useEffect, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {DragEndEvent} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {gamesApi} from '../api/games';
import {theme, TEAM_COLORS} from '../styles/theme';
import {pageContainerStyles, pageHeaderStyles, pageTitleStyles, pageSubtitleStyles} from '../styles/shared';
import {ErrorBanner} from '../components/ErrorBanner';
import type {RoleListItem, Team} from '../types/role';

interface WakeOrderRouterState {
  playerCount: number;
  centerCount: number;
  timerSeconds: number;
  selectedRoleCounts: Record<string, number>;
  roles: RoleListItem[];
}

interface WakingRole {
  id: string;
  name: string;
  team: Team;
  wake_order: number;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function SortableTile({role}: {role: WakingRole}) {
  const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id: role.id});

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderLeft: `4px solid ${TEAM_COLORS[role.team] ?? theme.colors.secondary}`,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.text,
    cursor: 'grab',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    userSelect: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} data-testid="wake-tile">
      <span style={{fontSize: '1.1rem', fontWeight: 500}}>{role.name}</span>
      <span style={{fontSize: '0.8rem', color: theme.colors.textMuted, marginLeft: 'auto'}}>
        Wake #{role.wake_order}
      </span>
    </div>
  );
}

export function WakeOrderResolutionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as WakeOrderRouterState | null;

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!state) {
      navigate('/games/new', {replace: true});
    }
  }, [state, navigate]);

  const wakingRoles: WakingRole[] = (() => {
    if (!state) return [];
    const seen = new Set<string>();
    const result: WakingRole[] = [];
    for (const [roleId, count] of Object.entries(state.selectedRoleCounts)) {
      if (count <= 0) continue;
      if (seen.has(roleId)) continue;
      seen.add(roleId);
      const role = state.roles.find((r) => r.id === roleId);
      if (!role || !role.wake_order || role.wake_order <= 0) continue;
      result.push({
        id: role.id,
        name: role.name,
        team: role.team,
        wake_order: role.wake_order,
      });
    }
    result.sort((a, b) => a.wake_order - b.wake_order);
    return result;
  })();

  const roleById = new Map(wakingRoles.map((r) => [r.id, r]));

  // Group roles by wake_order, shuffle within each group on mount
  const sortedGroupKeys = [...new Set(wakingRoles.map((r) => r.wake_order))].sort((a, b) => a - b);

  const [groupOrders, setGroupOrders] = useState<Record<number, string[]>>(() => {
    const groups: Record<number, string[]> = {};
    for (const key of sortedGroupKeys) {
      const ids = wakingRoles.filter((r) => r.wake_order === key).map((r) => r.id);
      groups[key] = shuffleArray(ids);
    }
    return groups;
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
  );

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      const draggedRole = roleById.get(String(active.id));
      if (!draggedRole) return;
      const groupKey = draggedRole.wake_order;
      setGroupOrders((prev) => {
        const groupItems = prev[groupKey];
        if (!groupItems) return prev;
        const oldIndex = groupItems.indexOf(String(active.id));
        const newIndex = groupItems.indexOf(String(over.id));
        if (oldIndex === -1 || newIndex === -1) return prev;
        return {...prev, [groupKey]: arrayMove(groupItems, oldIndex, newIndex)};
      });
    }
  }

  const handleStartGame = async () => {
    if (!state) return;

    setSubmitting(true);
    setError(null);

    const selectedRoleIds: string[] = [];
    for (const [roleId, count] of Object.entries(state.selectedRoleCounts)) {
      for (let i = 0; i < count; i++) {
        selectedRoleIds.push(roleId);
      }
    }

    // Flatten group orders into a single sequence, ordered by group number
    const flatSequence = sortedGroupKeys.flatMap((key) => groupOrders[key] ?? []);

    try {
      const game = await gamesApi.create({
        player_count: state.playerCount,
        center_card_count: state.centerCount,
        discussion_timer_seconds: state.timerSeconds,
        role_ids: selectedRoleIds,
        wake_order_sequence: flatSequence.length > 0 ? flatSequence : undefined,
      });
      navigate(`/games/${game.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
      setSubmitting(false);
    }
  };

  if (!state) return null;

  const canStart = !submitting;

  return (
    <div style={pageContainerStyles}>
      <div style={pageHeaderStyles}>
        <h1 style={pageTitleStyles}>Review Wake Order</h1>
        <p style={pageSubtitleStyles}>
          Drag roles to customize order within each wake group
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      {wakingRoles.length === 0 ? (
        <p style={{color: theme.colors.textMuted, marginBottom: theme.spacing.lg}}>
          No waking roles selected. You can start the game immediately.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div style={{marginBottom: theme.spacing.lg}}>
            {sortedGroupKeys.map((groupKey) => (
              <div key={groupKey} data-testid="wake-group" style={{marginBottom: theme.spacing.md}}>
                <h3
                  data-testid="wake-group-header"
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: theme.colors.textMuted,
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  Wake #{groupKey}
                </h3>
                <SortableContext items={groupOrders[groupKey] ?? []} strategy={verticalListSortingStrategy}>
                  {(groupOrders[groupKey] ?? []).map((roleId) => {
                    const role = roleById.get(roleId);
                    if (!role) return null;
                    return <SortableTile key={roleId} role={role} />;
                  })}
                </SortableContext>
              </div>
            ))}
          </div>
        </DndContext>
      )}

      <button
        onClick={handleStartGame}
        disabled={!canStart}
        style={{
          padding: `${theme.spacing.md} ${theme.spacing.xl}`,
          backgroundColor: theme.colors.primary,
          color: theme.colors.text,
          border: 'none',
          borderRadius: theme.borderRadius.md,
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: canStart ? 'pointer' : 'not-allowed',
          opacity: canStart ? 1 : 0.5,
        }}
      >
        {submitting ? 'Creating Game...' : 'Start Game'}
      </button>
    </div>
  );
}
