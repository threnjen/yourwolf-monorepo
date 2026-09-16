import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {BasicInfoStep} from '../../../../components/RoleBuilder/steps/BasicInfoStep';
import {createMockDraft} from '../../../mocks';

describe('BasicInfoStep', () => {
  const mockOnChange = vi.fn();

  function renderStep(nameStatus: 'idle' | 'checking' | 'available' | 'taken' = 'idle') {
    return render(
      <BasicInfoStep
        draft={createMockDraft()}
        onChange={mockOnChange}
        nameStatus={nameStatus}
      />,
    );
  }

  it('renders the basic role fields and team buttons', () => {
    renderStep();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/wake order/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/votes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /village/i})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /werewolf/i})).toBeInTheDocument();
  });

  it.each([
    ['checking', 'Checking...'],
    ['available', 'Available ✓'],
    ['taken', 'Taken ✗'],
  ] as const)('renders the supplied %s status without reading roles', (status, text) => {
    renderStep(status);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('does not render a status when the supplied status is idle', () => {
    renderStep();
    expect(screen.queryByText(/checking|available|taken/i)).not.toBeInTheDocument();
  });

  it('passes name edits to the page owner', () => {
    render(<BasicInfoStep draft={createMockDraft({name: ''})} onChange={mockOnChange} nameStatus="checking" />);
    fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'New Name'}});
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({name: 'New Name'}));
  });

  it('passes field edits and team changes to the page owner', () => {
    renderStep();
    fireEvent.change(screen.getByLabelText(/description/i), {target: {value: 'New desc'}});
    fireEvent.change(screen.getByLabelText(/wake order/i), {target: {value: '5'}});
    fireEvent.change(screen.getByLabelText(/votes/i), {target: {value: '2'}});
    fireEvent.click(screen.getByRole('button', {name: /werewolf/i}));
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({description: 'New desc'}));
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({wake_order: 5}));
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({votes: 2}));
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({team: 'werewolf'}));
  });

  it('clears primary team role when switching to village or neutral', () => {
    const draft = createMockDraft({team: 'werewolf', is_primary_team_role: true});
    render(<BasicInfoStep draft={draft} onChange={mockOnChange} nameStatus="idle" />);
    fireEvent.click(screen.getByRole('button', {name: /village/i}));
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({team: 'village', is_primary_team_role: false}));
  });

  it('shows primary team role only for eligible teams', () => {
    const {unmount} = render(
      <BasicInfoStep draft={createMockDraft({team: 'werewolf'})} onChange={mockOnChange} nameStatus="idle" />,
    );
    expect(screen.getByLabelText('Primary team role')).toBeInTheDocument();
    unmount();
    render(<BasicInfoStep draft={createMockDraft({team: 'village'})} onChange={mockOnChange} nameStatus="idle" />);
    expect(screen.queryByLabelText('Primary team role')).not.toBeInTheDocument();
  });
});
