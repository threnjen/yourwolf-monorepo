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
import {adaptDependenciesToEngine, adaptRoleToEngine} from '../adapters/role_adapters';
import {useRepositories} from '../context/repository_context';
import {createGameSession} from '../engine/gameSession';
import {theme, TEAM_COLORS} from '../styles/theme';
import {pageContainerStyles, pageHeaderStyles, pageTitleStyles, pageSubtitleStyles} from '../styles/shared';
import {ErrorBanner} from '../components/ErrorBanner';
import {isWakeOrderRouterState} from '../types/routerState';
import {
  collectWakingRoles,
  getWakeGroupKeys,
  buildGroupOrders,
  flattenWakeOrder,
  expandRoleIds,
} from '../domain/wakeOrder';
import type {WakingRole} from '../domain/wakeOrder';

function SortableTile({role, disabled}: {role: WakingRole; disabled?: boolean}) {
  const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id: role.id, disabled});

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderLeft: `4px solid ${TEAM_COLORS[role.team] ?? theme.colors.secondary}`,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.text,
    cursor: disabled ? 'default' : 'grab',
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
  const {repositories} = useRepositories();
  const state = isWakeOrderRouterState(location.state) ? location.state : null;

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!state) {
      navigate('/games/new', {replace: true});
    }
  }, [state, navigate]);

  const wakingRoles: WakingRole[] = state
    ? collectWakingRoles(state.selectedRoleCounts, state.roles)
    : [];

  const roleById = new Map(wakingRoles.map((r) => [r.id, r]));

  const sortedGroupKeys = getWakeGroupKeys(wakingRoles);

  // Shuffled once on mount; drag-and-drop reorders within a group from there.
  const [groupOrders, setGroupOrders] = useState<Record<number, string[]>>(() =>
    buildGroupOrders(wakingRoles),
  );

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

    const selectedRoleIds = expandRoleIds(state.selectedRoleCounts);
    const flatSequence = flattenWakeOrder(sortedGroupKeys, groupOrders);

    try {
      if (repositories === null) {
        throw new Error('Repositories are unavailable');
      }
      const distinctRoleIds = [...new Set(selectedRoleIds)];
      const details = await Promise.all(distinctRoleIds.map((roleId) => repositories.roles.get(roleId)));
      const roles = details.map((role, index) => {
        if (role === null) {
          throw new Error(`Role not found: ${distinctRoleIds[index]}`);
        }
        return adaptRoleToEngine(role, role);
      });
      const dependencies = details
        .filter((role): role is NonNullable<typeof role> => role !== null)
        .flatMap(adaptDependenciesToEngine);
      const session = createGameSession({
        player_count: state.playerCount,
        center_card_count: state.centerCount,
        discussion_timer_seconds: state.timerSeconds,
        role_ids: selectedRoleIds,
        wake_order_sequence: flatSequence,
        roles,
        dependencies,
        id_generator: crypto.randomUUID,
      });
      await repositories.games.put({session, roles});
      navigate(`/games/${session.id}`);
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
                    return <SortableTile key={roleId} role={role} disabled={(groupOrders[groupKey]?.length ?? 0) <= 1} />;
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
