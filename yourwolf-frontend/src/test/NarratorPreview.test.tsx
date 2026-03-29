import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {NarratorPreview} from '../components/RoleBuilder/NarratorPreview';
import {createMockPreviewResponse} from './mocks';
import {NarratorPreviewAction} from '../types/role';

describe('NarratorPreview', () => {
  describe('rendering actions (AC2)', () => {
    it('renders all action instructions', () => {
      const {actions} = createMockPreviewResponse();
      render(<NarratorPreview actions={actions} loading={false} roleName="Seer" />);

      expect(screen.getByText('Seer, wake up.')).toBeInTheDocument();
      expect(screen.getByText("You may look at one other player's card.")).toBeInTheDocument();
      expect(screen.getByText('OR You may look at 2 cards from the center.')).toBeInTheDocument();
      expect(screen.getByText('Seer, close your eyes.')).toBeInTheDocument();
    });

    it('renders the Narrator Preview header', () => {
      const {actions} = createMockPreviewResponse();
      render(<NarratorPreview actions={actions} loading={false} roleName="Seer" />);

      expect(screen.getByText('Narrator Preview')).toBeInTheDocument();
    });
  });

  describe('empty state (AC6)', () => {
    it('shows non-waking message when role has a name but no actions', () => {
      render(<NarratorPreview actions={[]} loading={false} roleName="Villager" />);

      expect(screen.getByText(/does not wake up/i)).toBeInTheDocument();
    });

    it('shows placeholder message when role name is too short', () => {
      render(<NarratorPreview actions={[]} loading={false} roleName="" />);

      expect(screen.getByText(/will appear as you build/i)).toBeInTheDocument();
    });

    it('shows placeholder message for very short name', () => {
      render(<NarratorPreview actions={[]} loading={false} roleName="A" />);

      expect(screen.getByText(/will appear as you build/i)).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows generating message when loading', () => {
      render(<NarratorPreview actions={[]} loading={true} roleName="Seer" />);

      expect(screen.getByText(/generating preview/i)).toBeInTheDocument();
    });

    it('does not show action instructions when loading', () => {
      const {actions} = createMockPreviewResponse();
      render(<NarratorPreview actions={actions} loading={true} roleName="Seer" />);

      expect(screen.queryByText('Seer, wake up.')).not.toBeInTheDocument();
    });
  });

  describe('section headers (AC4)', () => {
    it('renders section headers with distinct styling', () => {
      const actions: NarratorPreviewAction[] = [
        {order: 1, instruction: 'Doppelganger, wake up.', is_section_header: false},
        {order: 2, instruction: "You may look at one other player's card.", is_section_header: false},
        {order: 3, instruction: 'Doppelganger, close your eyes.', is_section_header: false},
        {order: 4, instruction: "Then, at the copied role's wake time, Doppelganger performs the copied role's night actions.", is_section_header: true},
      ];
      render(<NarratorPreview actions={actions} loading={false} roleName="Doppelganger" />);

      const sectionHeader = screen.getByText(/copied role's wake time/i);
      expect(sectionHeader).toBeInTheDocument();
      // Section header should have italic style
      expect(sectionHeader.style.fontStyle).toBe('italic');
    });
  });

  describe('data-testid', () => {
    it('has narrator-preview testid for querying', () => {
      render(<NarratorPreview actions={[]} loading={false} roleName="Test" />);

      expect(screen.getByTestId('narrator-preview')).toBeInTheDocument();
    });
  });
});
