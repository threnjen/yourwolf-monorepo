import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import {GameSetupPage} from '../pages/GameSetup';
import {useRoles} from '../hooks/useRoles';

vi.mock('../hooks/useRoles', () => ({
  useRoles: vi.fn(),
}));

vi.mock('../api/games', () => ({
  gamesApi: {
    create: vi.fn(),
  },
}));

const mockUseRoles = useRoles as ReturnType<typeof vi.fn>;

function renderGameSetup() {
  return render(
    <BrowserRouter>
      <GameSetupPage />
    </BrowserRouter>,
  );
}

describe('GameSetupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRoles.mockReturnValue({
      roles: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  describe('input clamping', () => {
    describe('playerCount', () => {
      it('clamps value below minimum (2) up to 3', () => {
        renderGameSetup();
        const input = screen.getByLabelText('Players');
        fireEvent.change(input, {target: {value: '2'}});
        expect(input).toHaveValue(3);
      });

      it('clamps value above maximum (21) down to 20', () => {
        renderGameSetup();
        const input = screen.getByLabelText('Players');
        fireEvent.change(input, {target: {value: '21'}});
        expect(input).toHaveValue(20);
      });
    });

    describe('centerCount', () => {
      it('clamps value below minimum (-1) up to 0', () => {
        renderGameSetup();
        const input = screen.getByLabelText('Center Cards');
        fireEvent.change(input, {target: {value: '-1'}});
        expect(input).toHaveValue(0);
      });

      it('clamps value above maximum (6) down to 5', () => {
        renderGameSetup();
        const input = screen.getByLabelText('Center Cards');
        fireEvent.change(input, {target: {value: '6'}});
        expect(input).toHaveValue(5);
      });
    });

    describe('timerSeconds', () => {
      it('clamps value below minimum (30) up to 60', () => {
        renderGameSetup();
        const input = screen.getByLabelText('Discussion Timer (seconds)');
        fireEvent.change(input, {target: {value: '30'}});
        expect(input).toHaveValue(60);
      });
    });
  });
});
