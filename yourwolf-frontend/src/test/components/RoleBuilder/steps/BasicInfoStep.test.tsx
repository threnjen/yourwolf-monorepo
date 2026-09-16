import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {BasicInfoStep} from '../../../../components/RoleBuilder/steps/BasicInfoStep';
import {createMockDraft} from '../../../mocks';

describe('BasicInfoStep', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

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

  it('renders all five team buttons', () => {
    renderStep();
    for (const team of ['village', 'werewolf', 'vampire', 'alien', 'neutral']) {
      expect(screen.getByRole('button', {name: new RegExp(team, 'i')})).toBeInTheDocument();
    }
  });

  it('shows current draft values', () => {
    render(
      <BasicInfoStep
        draft={createMockDraft({name: 'My Role', description: 'Some desc', votes: 2})}
        onChange={mockOnChange}
        nameStatus="idle"
      />,
    );
    expect(screen.getByLabelText(/name/i)).toHaveValue('My Role');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Some desc');
    expect(screen.getByLabelText(/votes/i)).toHaveValue(2);
  });

  it('renders the wake order range in the field label', () => {
    renderStep();
    expect(screen.getByText(/wake order \(0–40\)/i)).toBeInTheDocument();
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

  it.each(['village', 'werewolf', 'vampire', 'alien', 'neutral'] as const)(
    'passes %s team selection to the page owner',
    (team) => {
      const onChange = vi.fn();
      render(
        <BasicInfoStep
          draft={createMockDraft({team: 'village'})}
          onChange={onChange}
          nameStatus="idle"
        />,
      );
      fireEvent.click(screen.getByRole('button', {name: new RegExp(team, 'i')}));
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({team}));
    },
  );

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

  it.each(['werewolf', 'vampire', 'alien'] as const)('shows the primary toggle for %s', (team) => {
    render(
      <BasicInfoStep
        draft={createMockDraft({team})}
        onChange={mockOnChange}
        nameStatus="idle"
      />,
    );
    expect(screen.getByLabelText('Primary team role')).toBeInTheDocument();
  });

  it.each(['village', 'neutral'] as const)('hides the primary toggle for %s', (team) => {
    render(
      <BasicInfoStep
        draft={createMockDraft({team})}
        onChange={mockOnChange}
        nameStatus="idle"
      />,
    );
    expect(screen.queryByLabelText('Primary team role')).not.toBeInTheDocument();
  });

  it('passes a checked primary team role to the page owner', () => {
    const onChange = vi.fn();
    render(
      <BasicInfoStep
        draft={createMockDraft({team: 'werewolf', is_primary_team_role: false})}
        onChange={onChange}
        nameStatus="idle"
      />,
    );
    fireEvent.click(screen.getByLabelText('Primary team role'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({is_primary_team_role: true}));
  });

  it('clears primary team role when switching to neutral', () => {
    const draft = createMockDraft({team: 'werewolf', is_primary_team_role: true});
    render(<BasicInfoStep draft={draft} onChange={mockOnChange} nameStatus="idle" />);
    fireEvent.click(screen.getByRole('button', {name: /neutral/i}));
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({team: 'neutral', is_primary_team_role: false}));
  });

  it('sets wake order to zero when its input is cleared', () => {
    render(<BasicInfoStep draft={createMockDraft({wake_order: 5})} onChange={mockOnChange} nameStatus="idle" />);
    fireEvent.change(screen.getByLabelText(/wake order/i), {target: {value: ''}});
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({wake_order: 0}));
  });

  it.each([
    [0, true],
    [null, true],
    [5, false],
  ] as const)('renders the does-not-wake hint for wake order %s', (wakeOrder, shouldRender) => {
    render(<BasicInfoStep draft={createMockDraft({wake_order: wakeOrder})} onChange={mockOnChange} nameStatus="idle" />);
    if (shouldRender) {
      expect(screen.getByText('Does not wake up')).toBeInTheDocument();
    } else {
      expect(screen.queryByText('Does not wake up')).not.toBeInTheDocument();
    }
  });
});
