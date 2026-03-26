import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {GameFacilitatorPage} from '../pages/GameFacilitator';
import {gamesApi} from '../api/games';
import {createMockGameSession} from './mocks';

vi.mock('../api/games', () => ({
  gamesApi: {
    create: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    start: vi.fn(),
    advancePhase: vi.fn(),
    getNightScript: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockGamesApi = vi.mocked(gamesApi);

function renderFacilitator(gameId: string = 'game-123') {
  return render(
    <MemoryRouter initialEntries={[`/games/${gameId}`]}>
      <Routes>
        <Route path="/games/:gameId" element={<GameFacilitatorPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GameFacilitatorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows loading indicator while fetching', () => {
      mockGamesApi.getById.mockReturnValue(new Promise(() => {}));
      renderFacilitator();

      expect(screen.getByText('Loading game...')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error when game fails to load', async () => {
      mockGamesApi.getById.mockRejectedValue(new Error('Network error'));
      renderFacilitator();

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('setup phase', () => {
    it('renders setup phase content', async () => {
      const game = createMockGameSession({phase: 'setup', center_card_count: 3});
      mockGamesApi.getById.mockResolvedValue(game);
      renderFacilitator();

      await waitFor(() => {
        expect(screen.getByText(/setup Phase/i)).toBeInTheDocument();
      });

      expect(screen.getByText('Begin Night Phase')).toBeInTheDocument();
    });

    it('displays error when start game fails', async () => {
      const game = createMockGameSession({phase: 'setup'});
      mockGamesApi.getById.mockResolvedValue(game);
      mockGamesApi.start.mockRejectedValue(new Error('Server error'));
      renderFacilitator();

      await waitFor(() => {
        expect(screen.getByText('Begin Night Phase')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Begin Night Phase'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Server error');
      });
    });

    it('dismisses error when dismiss button is clicked', async () => {
      const game = createMockGameSession({phase: 'setup'});
      mockGamesApi.getById.mockResolvedValue(game);
      mockGamesApi.start.mockRejectedValue(new Error('Server error'));
      renderFacilitator();

      await waitFor(() => {
        expect(screen.getByText('Begin Night Phase')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Begin Night Phase'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Dismiss error'));

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('advance phase error', () => {
    it('displays error when advance phase fails', async () => {
      const game = createMockGameSession({
        phase: 'voting',
      });
      mockGamesApi.getById.mockResolvedValue(game);
      mockGamesApi.advancePhase.mockRejectedValue(
        new Error('Cannot advance'),
      );
      renderFacilitator();

      await waitFor(() => {
        expect(screen.getByText('Reveal Results')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reveal Results'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Cannot advance');
      });
    });
  });
});
