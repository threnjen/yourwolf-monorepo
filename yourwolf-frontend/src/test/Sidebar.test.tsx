import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {BrowserRouter} from 'react-router-dom';
import {Sidebar} from '../components/Sidebar';

function renderSidebar(props: {isOpen?: boolean; onClose?: () => void} = {}) {
  return render(
    <BrowserRouter>
      <Sidebar {...props} />
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

    it('has sidebar CSS class', () => {
      const {container} = renderSidebar();

      expect(container.querySelector('.sidebar')).toBeInTheDocument();
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

  describe('mobile open/close behavior', () => {
    it('adds sidebar-open class when isOpen is true', () => {
      const {container} = renderSidebar({isOpen: true, onClose: vi.fn()});

      expect(container.querySelector('.sidebar.sidebar-open')).toBeInTheDocument();
    });

    it('does not add sidebar-open class when isOpen is false', () => {
      const {container} = renderSidebar({isOpen: false, onClose: vi.fn()});

      expect(container.querySelector('.sidebar.sidebar-open')).not.toBeInTheDocument();
    });

    it('renders backdrop when isOpen is true', () => {
      const {container} = renderSidebar({isOpen: true, onClose: vi.fn()});

      expect(container.querySelector('.sidebar-backdrop')).toBeInTheDocument();
    });

    it('does not render backdrop when isOpen is false', () => {
      const {container} = renderSidebar({isOpen: false, onClose: vi.fn()});

      expect(container.querySelector('.sidebar-backdrop')).not.toBeInTheDocument();
    });

    it('calls onClose when backdrop is clicked', async () => {
      const onClose = vi.fn();
      const {container} = renderSidebar({isOpen: true, onClose});

      const backdrop = container.querySelector('.sidebar-backdrop')!;
      await userEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when a nav link is clicked', async () => {
      const onClose = vi.fn();
      renderSidebar({isOpen: true, onClose});

      await userEvent.click(screen.getByRole('link', {name: /Home/i}));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose on nav click when onClose is not provided', async () => {
      renderSidebar();

      // Should not throw
      await userEvent.click(screen.getByRole('link', {name: /Home/i}));
    });
  });
});
