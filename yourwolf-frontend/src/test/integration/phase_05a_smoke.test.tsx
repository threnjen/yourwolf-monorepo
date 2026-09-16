import {describe, expect, it} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {Layout} from '../../components/Layout';
import {AppRoutes} from '../../routes';
import {createRepositoryTestContext} from '../test_utils';
import {RepositoryProvider} from '../../context/repository_context';
import {apiClient} from '../../api/client';
import {RolesPage} from '../../pages/RolesPage';
import {GameSetupPage} from '../../pages/GameSetup';
import {createCustomRole} from '../../data/conversion';
import {createMockDraft} from '../mocks';

describe('Phase 05A application smoke flow', () => {
  it('makes a saved custom role visible to list and setup consumers', async () => {
    const context = await createRepositoryTestContext();
    const role = createCustomRole(createMockDraft({name: 'Local Hero'}));

    try {
      await context.repositories.roles.put(role);
      const rolesView = render(
        <MemoryRouter>
          <RepositoryProvider repositories={context.repositories}>
            <RolesPage />
          </RepositoryProvider>
        </MemoryRouter>,
      );
      await waitFor(() => expect(screen.getByText('Local Hero')).toBeInTheDocument());
      rolesView.unmount();

      render(
        <MemoryRouter>
          <RepositoryProvider repositories={context.repositories}>
            <GameSetupPage />
          </RepositoryProvider>
        </MemoryRouter>,
      );
      await waitFor(() => expect(screen.getByText('Local Hero')).toBeInTheDocument());
    } finally {
      await context.cleanup();
    }
  });

  it('completes a seeded game through one repository provider without API traffic', async () => {
    const context = await createRepositoryTestContext();
    const apiMethods = [apiClient.get, apiClient.post, apiClient.put, apiClient.patch, apiClient.delete];

    try {
      render(
        <MemoryRouter initialEntries={['/games/new']}>
          <RepositoryProvider repositories={context.repositories}>
            <Layout>
              <AppRoutes />
            </Layout>
          </RepositoryProvider>
        </MemoryRouter>,
      );

      await waitFor(() => expect(screen.getByText('New Game Setup')).toBeInTheDocument());
      fireEvent.change(screen.getByLabelText('Players'), {target: {value: '3'}});
      fireEvent.blur(screen.getByLabelText('Players'));
      fireEvent.change(screen.getByLabelText('Center Cards'), {target: {value: '0'}});
      fireEvent.blur(screen.getByLabelText('Center Cards'));
      fireEvent.click(screen.getByText('Villager').closest('[data-role-id]')!);
      await waitFor(() => expect(screen.getByRole('button', {name: 'Next'})).not.toBeDisabled());
      fireEvent.click(screen.getByRole('button', {name: 'Next'}));
      await waitFor(() => expect(screen.getByText('Review Wake Order')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', {name: 'Start Game'}));
      await waitFor(() => expect(screen.getByText('SETUP Phase')).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', {name: 'Begin Night Phase'}));
      await waitFor(() => expect(screen.getByText('NIGHT Phase')).toBeInTheDocument());

      let nextButton = screen.queryByRole('button', {name: 'Next →'});
      while (nextButton !== null) {
        fireEvent.click(nextButton);
        await waitFor(() => expect(screen.queryByRole('button', {name: 'Next →'})).not.toBe(nextButton));
        nextButton = screen.queryByRole('button', {name: 'Next →'});
      }
      fireEvent.click(screen.getByRole('button', {name: 'Start Discussion'}));
      await waitFor(() => expect(screen.getByText('DISCUSSION Phase')).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', {name: 'Skip to Voting'}));
      await waitFor(() => expect(screen.getByText('VOTING Phase')).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', {name: 'Reveal Results'}));
      await waitFor(() => expect(screen.getByText('RESOLUTION Phase')).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', {name: 'Complete Game'}));
      await waitFor(() => expect(screen.getByText('Game Over')).toBeInTheDocument());
      for (const apiMethod of apiMethods) {
        expect(apiMethod).not.toHaveBeenCalled();
      }
    } finally {
      await context.cleanup();
    }
  }, 20000);
});
