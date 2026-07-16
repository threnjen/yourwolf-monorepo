import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {AbilityPalette} from '../components/RoleBuilder/steps/AbilityPalette';
import {createMockAbility} from './mocks';

/**
 * Unit tests for the ability-category palette, exercised in isolation.
 *
 * The palette is presentational: tab state is owned by the container and arrives
 * as `activeCategory` + `onCategoryChange`.
 */
describe('AbilityPalette', () => {
  const onCategoryChange = vi.fn();
  const onSelectAbility = vi.fn();

  const mockAbilities = [
    createMockAbility({id: 'a1', type: 'view_card', name: 'View Card'}),
    createMockAbility({id: 'a2', type: 'swap_card', name: 'Swap Card'}),
    createMockAbility({id: 'a3', type: 'view_awake', name: 'View Awake'}),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPalette(overrides: Partial<React.ComponentProps<typeof AbilityPalette>> = {}) {
    return render(
      <AbilityPalette
        abilities={mockAbilities}
        loading={false}
        activeCategory="card"
        onCategoryChange={onCategoryChange}
        onSelectAbility={onSelectAbility}
        {...overrides}
      />,
    );
  }

  describe('category tabs', () => {
    it('renders a tab for every ability category', () => {
      renderPalette();
      expect(screen.getByRole('button', {name: /card actions/i})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /information/i})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /physical/i})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /state changes/i})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /other/i})).toBeInTheDocument();
    });

    it('reports the clicked category id without changing state itself', () => {
      renderPalette();
      fireEvent.click(screen.getByRole('button', {name: /information/i}));
      expect(onCategoryChange).toHaveBeenCalledWith('info');
    });

    it('shows abilities for whichever category the container marks active', () => {
      renderPalette({activeCategory: 'info'});
      expect(screen.getByText('View Awake')).toBeInTheDocument();
      expect(screen.queryByText('View Card')).not.toBeInTheDocument();
    });
  });

  describe('ability grid', () => {
    it('lists only abilities whose type belongs to the active category', () => {
      renderPalette();
      expect(screen.getByText('View Card')).toBeInTheDocument();
      expect(screen.getByText('Swap Card')).toBeInTheDocument();
      expect(screen.queryByText('View Awake')).not.toBeInTheDocument();
    });

    it('reports the ability type and name when an ability is clicked', () => {
      renderPalette();
      fireEvent.click(screen.getByText('View Card'));
      expect(onSelectAbility).toHaveBeenCalledWith('view_card', 'View Card');
    });

    it('shows the loading message while abilities are fetching', () => {
      renderPalette({abilities: [], loading: true});
      expect(screen.getByText(/loading abilities/i)).toBeInTheDocument();
    });

    it('prefers the loading message over the empty message', () => {
      renderPalette({abilities: [], loading: true});
      expect(screen.queryByText(/no abilities available/i)).not.toBeInTheDocument();
    });

    it('shows the empty message when the active category has no abilities', () => {
      renderPalette({activeCategory: 'physical'});
      expect(screen.getByText(/no abilities available in this category/i)).toBeInTheDocument();
    });

    it('shows the empty message when no abilities loaded at all', () => {
      renderPalette({abilities: []});
      expect(screen.getByText(/no abilities available in this category/i)).toBeInTheDocument();
    });

    it('renders tabs even while loading', () => {
      renderPalette({abilities: [], loading: true});
      expect(screen.getByRole('button', {name: /card actions/i})).toBeInTheDocument();
    });

    it('renders no ability buttons for an unrecognised active category', () => {
      renderPalette({activeCategory: 'does-not-exist'});
      expect(screen.getByText(/no abilities available in this category/i)).toBeInTheDocument();
    });
  });
});
