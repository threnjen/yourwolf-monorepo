import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import {Home} from '../pages/Home';

function renderHome() {
  return render(
    <BrowserRouter>
      <Home />
    </BrowserRouter>,
  );
}

describe('Home Page', () => {
  describe('rendering', () => {
    it('displays welcome message', () => {
      renderHome();

      expect(screen.getByText(/Welcome to Your/)).toBeInTheDocument();
    });

    it('displays YourWolf branding with Wolf highlighted', () => {
      renderHome();

      expect(screen.getByText('Wolf')).toBeInTheDocument();
    });

    it('displays description text', () => {
      renderHome();

      expect(
        screen.getByText(/A customizable One Night Ultimate Werewolf game facilitator/),
      ).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('has link to roles page', () => {
      renderHome();

      const link = screen.getByRole('link', {name: /Browse Roles/i});
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/roles');
    });
  });

  describe('features section', () => {
    it('displays feature cards', () => {
      renderHome();

      // Should have feature titles
      expect(screen.getByText('Official Roles')).toBeInTheDocument();
      expect(screen.getByText('Custom Roles')).toBeInTheDocument();
      expect(screen.getByText('Game Facilitator')).toBeInTheDocument();
    });

    it('displays feature descriptions', () => {
      renderHome();

      expect(
        screen.getByText(/Access all official One Night Ultimate Werewolf roles/),
      ).toBeInTheDocument();
    });
  });
});
