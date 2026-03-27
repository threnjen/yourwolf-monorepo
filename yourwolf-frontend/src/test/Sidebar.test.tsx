import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import {Sidebar} from '../components/Sidebar';

function renderSidebar() {
  return render(
    <BrowserRouter>
      <Sidebar />
    </BrowserRouter>,
  );
}

describe('Sidebar', () => {
  describe('rendering', () => {
    it('renders aside element', () => {
      const {container} = renderSidebar();

      expect(container.querySelector('aside')).toBeInTheDocument();
    });

    it('renders navigation', () => {
      renderSidebar();

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('navigation links', () => {
    it('has Home link', () => {
      renderSidebar();

      const homeLink = screen.getByRole('link', {name: /Home/i});
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('has Roles link', () => {
      renderSidebar();

      const rolesLink = screen.getByRole('link', {name: /Roles/i});
      expect(rolesLink).toBeInTheDocument();
      expect(rolesLink).toHaveAttribute('href', '/roles');
    });

    it('has New Role link', () => {
      renderSidebar();

      const newRoleLink = screen.getByRole('link', {name: /New Role/i});
      expect(newRoleLink).toBeInTheDocument();
      expect(newRoleLink).toHaveAttribute('href', '/roles/new');
    });

    it('displays Home icon', () => {
      renderSidebar();

      expect(screen.getByText('🏠')).toBeInTheDocument();
    });

    it('displays Roles icon', () => {
      renderSidebar();

      expect(screen.getByText('🎭')).toBeInTheDocument();
    });
  });
});
