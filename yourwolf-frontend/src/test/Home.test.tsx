import {describe, it, expect} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
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

    it('displays feature icons', () => {
      renderHome();

      // Check for emoji icons
      expect(screen.getByText('📚')).toBeInTheDocument();
      expect(screen.getByText('🔧')).toBeInTheDocument();
      expect(screen.getByText('🎮')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('renders main container', () => {
      const {container} = renderHome();

      expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    });

    it('has heading with proper level', () => {
      renderHome();

      const heading = screen.getByRole('heading', {level: 1});
      expect(heading).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('applies hover styles on CTA button mouse enter', () => {
      renderHome();

      const link = screen.getByRole('link', {name: /Browse Roles/i});
      fireEvent.mouseEnter(link);
      // Browser converts hex to rgb(165, 42, 42) which is #a52a2a (primaryLight)
      expect(link.style.backgroundColor).toBe('rgb(165, 42, 42)');
    });

    it('removes hover styles on CTA button mouse leave', () => {
      renderHome();

      const link = screen.getByRole('link', {name: /Browse Roles/i});
      fireEvent.mouseEnter(link);
      fireEvent.mouseLeave(link);
      // Browser converts hex to rgb(139, 0, 0) which is #8b0000 (primary)
      expect(link.style.backgroundColor).toBe('rgb(139, 0, 0)');
    });
  });
});
