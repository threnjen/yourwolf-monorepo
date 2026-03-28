import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, fireEvent, act} from '@testing-library/react';
import {BasicInfoStep} from '../components/RoleBuilder/steps/BasicInfoStep';
import {rolesApi} from '../api/roles';
import {createMockDraft} from './mocks';

vi.mock('../api/roles', () => ({
  rolesApi: {
    list: vi.fn(),
    listOfficial: vi.fn(),
    getById: vi.fn(),
    validate: vi.fn(),
    checkName: vi.fn(),
    create: vi.fn(),
  },
}));

const mockRolesApi = rolesApi as unknown as {
  checkName: ReturnType<typeof vi.fn>;
};

describe('BasicInfoStep', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders name input', () => {
      render(<BasicInfoStep draft={createMockDraft()} onChange={mockOnChange} />);
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    it('renders description textarea', () => {
      render(<BasicInfoStep draft={createMockDraft()} onChange={mockOnChange} />);
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('renders wake order input', () => {
      render(<BasicInfoStep draft={createMockDraft()} onChange={mockOnChange} />);
      expect(screen.getByLabelText(/wake order/i)).toBeInTheDocument();
    });

    it('renders votes input', () => {
      render(<BasicInfoStep draft={createMockDraft()} onChange={mockOnChange} />);
      expect(screen.getByLabelText(/votes/i)).toBeInTheDocument();
    });

    it('renders all 5 team buttons', () => {
      render(<BasicInfoStep draft={createMockDraft()} onChange={mockOnChange} />);
      expect(screen.getByRole('button', {name: /village/i})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /werewolf/i})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /vampire/i})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /alien/i})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /neutral/i})).toBeInTheDocument();
    });

    it('shows current draft values', () => {
      const draft = createMockDraft({name: 'My Role', description: 'Some desc', votes: 2});
      render(<BasicInfoStep draft={draft} onChange={mockOnChange} />);
      expect(screen.getByLabelText(/name/i)).toHaveValue('My Role');
      expect(screen.getByLabelText(/description/i)).toHaveValue('Some desc');
      expect(screen.getByLabelText(/votes/i)).toHaveValue(2);
    });
  });

  describe('name field interactions', () => {
    it('calls onChange when name changes', () => {
      render(<BasicInfoStep draft={createMockDraft({name: ''})} onChange={mockOnChange} />);
      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'New Name'}});
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({name: 'New Name'}));
    });

    it('triggers name check after 500ms debounce', async () => {
      mockRolesApi.checkName.mockResolvedValue({name: 'New Name', is_available: true, message: 'Available'});
      render(<BasicInfoStep draft={createMockDraft({name: ''})} onChange={mockOnChange} />);

      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'New Name'}});
      expect(mockRolesApi.checkName).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(mockRolesApi.checkName).toHaveBeenCalledWith('New Name');
    });

    it('shows Available status after name check', async () => {
      mockRolesApi.checkName.mockResolvedValue({name: 'Unique', is_available: true, message: 'Available'});
      render(<BasicInfoStep draft={createMockDraft({name: ''})} onChange={mockOnChange} />);

      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Unique'}});
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      // Flush the resolved checkName promise and its resulting state update
      await act(async () => {});

      expect(screen.getByText(/available/i)).toBeInTheDocument();
    });

    it('shows Taken status when name is unavailable', async () => {
      mockRolesApi.checkName.mockResolvedValue({name: 'Werewolf', is_available: false, message: 'Name is taken'});
      render(<BasicInfoStep draft={createMockDraft({name: ''})} onChange={mockOnChange} />);

      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Werewolf'}});
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      // Flush the resolved checkName promise and its resulting state update
      await act(async () => {});

      expect(screen.getByText(/taken/i)).toBeInTheDocument();
    });
  });

  describe('team selection', () => {
    it('calls onChange with correct team on button click', () => {
      render(<BasicInfoStep draft={createMockDraft({team: 'village'})} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', {name: /werewolf/i}));
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({team: 'werewolf'}));
    });

    it('calls onChange for each team', () => {
      const teams = ['village', 'werewolf', 'vampire', 'alien', 'neutral'] as const;
      for (const team of teams) {
        const draft = createMockDraft({team: 'village'});
        const onChange = vi.fn();
        const {unmount} = render(<BasicInfoStep draft={draft} onChange={onChange} />);
        fireEvent.click(screen.getByRole('button', {name: new RegExp(team, 'i')}));
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({team}));
        unmount();
      }
    });
  });

  describe('primary team role toggle', () => {
    it.each(['werewolf', 'vampire', 'alien'] as const)('renders toggle for %s team', (team) => {
      render(<BasicInfoStep draft={createMockDraft({team})} onChange={mockOnChange} />);
      expect(screen.getByLabelText('Primary team role')).toBeInTheDocument();
    });

    it('hides toggle for village team', () => {
      render(<BasicInfoStep draft={createMockDraft({team: 'village'})} onChange={mockOnChange} />);
      expect(screen.queryByLabelText('Primary team role')).not.toBeInTheDocument();
    });

    it('hides toggle for neutral team', () => {
      render(<BasicInfoStep draft={createMockDraft({team: 'neutral'})} onChange={mockOnChange} />);
      expect(screen.queryByLabelText('Primary team role')).not.toBeInTheDocument();
    });

    it('checking toggle calls onChange with is_primary_team_role true', () => {
      render(
        <BasicInfoStep
          draft={createMockDraft({team: 'werewolf', is_primary_team_role: false})}
          onChange={mockOnChange}
        />
      );
      fireEvent.click(screen.getByLabelText('Primary team role'));
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({is_primary_team_role: true})
      );
    });

    it('switching to village clears is_primary_team_role to false', () => {
      render(
        <BasicInfoStep
          draft={createMockDraft({team: 'werewolf', is_primary_team_role: true})}
          onChange={mockOnChange}
        />
      );
      fireEvent.click(screen.getByRole('button', {name: /village/i}));
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({team: 'village', is_primary_team_role: false})
      );
    });

    it('switching to neutral clears is_primary_team_role to false', () => {
      render(
        <BasicInfoStep
          draft={createMockDraft({team: 'werewolf', is_primary_team_role: true})}
          onChange={mockOnChange}
        />
      );
      fireEvent.click(screen.getByRole('button', {name: /neutral/i}));
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({team: 'neutral', is_primary_team_role: false})
      );
    });
  });

  describe('other field interactions', () => {
    it('calls onChange when description changes', () => {
      render(<BasicInfoStep draft={createMockDraft()} onChange={mockOnChange} />);
      fireEvent.change(screen.getByLabelText(/description/i), {target: {value: 'New desc'}});
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({description: 'New desc'}));
    });

    it('calls onChange when wake order changes', () => {
      render(<BasicInfoStep draft={createMockDraft()} onChange={mockOnChange} />);
      fireEvent.change(screen.getByLabelText(/wake order/i), {target: {value: '5'}});
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({wake_order: 5}));
    });

    it('calls onChange when votes changes', () => {
      render(<BasicInfoStep draft={createMockDraft()} onChange={mockOnChange} />);
      fireEvent.change(screen.getByLabelText(/votes/i), {target: {value: '2'}});
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({votes: 2}));
    });

    it('clearing wake order sets it to 0 not null', () => {
      render(<BasicInfoStep draft={createMockDraft({wake_order: 5})} onChange={mockOnChange} />);
      fireEvent.change(screen.getByLabelText(/wake order/i), {target: {value: ''}});
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({wake_order: 0}));
    });
  });

  describe('wake order label and hint', () => {
    it('renders wake order label with range hint (0–40)', () => {
      render(<BasicInfoStep draft={createMockDraft()} onChange={mockOnChange} />);
      expect(screen.getByText(/wake order \(0–40\)/i)).toBeInTheDocument();
    });

    it('shows does-not-wake hint when wake_order is 0', () => {
      render(<BasicInfoStep draft={createMockDraft({wake_order: 0})} onChange={mockOnChange} />);
      expect(screen.getByText('Does not wake up')).toBeInTheDocument();
    });

    it('hides does-not-wake hint when wake_order > 0', () => {
      render(<BasicInfoStep draft={createMockDraft({wake_order: 5})} onChange={mockOnChange} />);
      expect(screen.queryByText('Does not wake up')).not.toBeInTheDocument();
    });

    it('shows does-not-wake hint when wake_order is null (legacy)', () => {
      render(<BasicInfoStep draft={createMockDraft({wake_order: null})} onChange={mockOnChange} />);
      expect(screen.getByText('Does not wake up')).toBeInTheDocument();
    });
  });
});
