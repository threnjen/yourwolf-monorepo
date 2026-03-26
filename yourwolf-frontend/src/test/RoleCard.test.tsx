import {describe, it, expect} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {RoleCard} from '../components/RoleCard';
import {createMockRole} from './mocks';
import {RoleListItem} from '../types/role';

describe('RoleCard', () => {
  describe('rendering', () => {
    it('renders role name', () => {
      const role = createMockRole({name: 'Villager'});
      render(<RoleCard role={role} />);
      expect(screen.getByText('Villager')).toBeInTheDocument();
    });

    it('renders role description', () => {
      const role = createMockRole({description: 'A simple villager'});
      render(<RoleCard role={role} />);
      expect(screen.getByText('A simple villager')).toBeInTheDocument();
    });

    it('shows default description when none provided', () => {
      const role = createMockRole({description: ''});
      render(<RoleCard role={role} />);
      expect(screen.getByText('No description available.')).toBeInTheDocument();
    });

    it('renders team badge', () => {
      const role = createMockRole({team: 'werewolf'});
      render(<RoleCard role={role} />);
      expect(screen.getByText('Werewolf')).toBeInTheDocument();
    });

    it('renders wake order when present', () => {
      const role = createMockRole({wake_order: 5});
      render(<RoleCard role={role} />);
      expect(screen.getByText('Wake Order: 5')).toBeInTheDocument();
    });

    it('does not render wake order when null', () => {
      const role = createMockRole({wake_order: undefined});
      render(<RoleCard role={role} />);
      expect(screen.queryByText(/Wake Order/)).not.toBeInTheDocument();
    });

    it('shows official badge for official roles', () => {
      const role = createMockRole({visibility: 'official'});
      render(<RoleCard role={role} />);
      expect(screen.getByText('Official')).toBeInTheDocument();
    });

    it('does not show official badge for private roles', () => {
      const role = createMockRole({visibility: 'private'});
      render(<RoleCard role={role} />);
      expect(screen.queryByText('Official')).not.toBeInTheDocument();
    });

    it('does not show official badge for public roles', () => {
      const role = createMockRole({visibility: 'public'});
      render(<RoleCard role={role} />);
      expect(screen.queryByText('Official')).not.toBeInTheDocument();
    });
  });

  describe('team colors', () => {
    it.each([
      ['village', 'Village'],
      ['werewolf', 'Werewolf'],
      ['vampire', 'Vampire'],
      ['alien', 'Alien'],
      ['neutral', 'Neutral'],
    ])('renders %s team with correct label', (team, expectedLabel) => {
      const role = createMockRole({team: team as RoleListItem['team']});
      render(<RoleCard role={role} />);
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('renders as a div element', () => {
      const role = createMockRole();
      const {container} = render(<RoleCard role={role} />);
      expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    });

    it('has role name as heading', () => {
      const role = createMockRole({name: 'Seer'});
      render(<RoleCard role={role} />);
      const heading = screen.getByRole('heading', {name: 'Seer'});
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H3');
    });
  });

  describe('interactions', () => {
    it('applies hover styles on mouse enter', () => {
      const role = createMockRole();
      const {container} = render(<RoleCard role={role} />);
      const card = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(card);
      expect(card.style.transform).toBe('translateY(-2px)');
    });

    it('removes hover styles on mouse leave', () => {
      const role = createMockRole();
      const {container} = render(<RoleCard role={role} />);
      const card = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(card);
      fireEvent.mouseLeave(card);
      expect(card.style.transform).toBe('translateY(0)');
    });

    it('applies focus styles on focus', () => {
      const role = createMockRole();
      const {container} = render(<RoleCard role={role} />);
      const card = container.firstChild as HTMLElement;
      fireEvent.focus(card);
      expect(card.style.transform).toBe('translateY(-2px)');
    });

    it('removes focus styles on blur', () => {
      const role = createMockRole();
      const {container} = render(<RoleCard role={role} />);
      const card = container.firstChild as HTMLElement;
      fireEvent.focus(card);
      fireEvent.blur(card);
      expect(card.style.transform).toBe('translateY(0)');
    });
  });
});
