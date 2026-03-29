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

  const [tileOrder, setTileOrder] = useState<string[]>(() => wakingRoles.map((r) => r.id));
  const [resolvedGroups, setResolvedGroups] = useState<Set<number>>(new Set());

  const roleById = new Map(wakingRoles.map((r) => [r.id, r]));

  const hasConflicts = (() => {
    const groupCounts = new Map<number, number>();
    for (const roleId of tileOrder) {
      const role = roleById.get(roleId);
      if (!role || resolvedGroups.has(role.wake_order)) continue;
      groupCounts.set(role.wake_order, (groupCounts.get(role.wake_order) ?? 0) + 1);
    }
    for (const count of groupCounts.values()) {
      if (count > 1) return true;
    }
    return false;
  })();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
  );

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      const draggedRole = roleById.get(String(active.id));
      if (draggedRole) {
        setResolvedGroups((prev) => new Set([...prev, draggedRole.wake_order]));
      }
      setTileOrder((items) => {
        const oldIndex = items.indexOf(String(active.id));
        const newIndex = items.indexOf(String(over.id));
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const handleStartGame = async () => {
    if (!state || hasConflicts) return;

    setSubmitting(true);
    setError(null);

    const selectedRoleIds: string[] = [];
    for (const [roleId, count] of Object.entries(state.selectedRoleCounts)) {
      for (let i = 0; i < count; i++) {
        selectedRoleIds.push(roleId);
      }
    }

    try {
      const game = await gamesApi.create({
        player_count: state.playerCount,
        center_card_count: state.centerCount,
        discussion_timer_seconds: state.timerSeconds,
        role_ids: selectedRoleIds,
        wake_order_sequence: tileOrder.length > 0 ? tileOrder : undefined,
      });
      navigate(`/games/${game.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
      setSubmitting(false);
    }
  };

  if (!state) return null;

  const canStart = !hasConflicts && !submitting;

  return (
    <div style={pageContainerStyles}>
      <div style={pageHeaderStyles}>
        <h1 style={pageTitleStyles}>Wake Order Resolution</h1>
        <p style={pageSubtitleStyles}>
          Drag roles to set the wake order. Roles with the same wake number must be resolved.
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      {hasConflicts && (
        <p style={{color: theme.colors.warning, marginBottom: theme.spacing.md}}>
          Resolve wake order conflicts to start the game
        </p>
      )}

      {wakingRoles.length === 0 ? (
        <p style={{color: theme.colors.textMuted, marginBottom: theme.spacing.lg}}>
          No waking roles selected. You can start the game immediately.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tileOrder} strategy={verticalListSortingStrategy}>
            <div style={{marginBottom: theme.spacing.lg}}>
              {tileOrder.map((roleId) => {
                const role = roleById.get(roleId);
                if (!role) return null;
                return <SortableTile key={roleId} role={role} />;
              })}
            </div>
          </SortableContext>
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
