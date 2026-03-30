import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {BrowserRouter} from 'react-router-dom';
import {Layout} from '../components/Layout';

// Mock child components to isolate Layout testing
vi.mock('../components/Header', () => ({
  Header: ({onToggleSidebar}: {onToggleSidebar?: () => void}) => (
    <header data-testid="mock-header">
      Header
      {onToggleSidebar && (
        <button data-testid="mock-toggle" onClick={onToggleSidebar}>
          Toggle
        </button>
      )}
    </header>
  ),
}));

vi.mock('../components/Sidebar', () => ({
  Sidebar: ({isOpen, onClose}: {isOpen?: boolean; onClose?: () => void}) => (
    <aside data-testid="mock-sidebar" data-open={isOpen}>
      Sidebar
      {onClose && (
        <button data-testid="mock-close" onClick={onClose}>
          Close
        </button>
      )}
    </aside>
  ),
}));

function renderLayout(children: React.ReactNode = <div>Test Content</div>) {
  return render(
    <BrowserRouter>
      <Layout>{children}</Layout>
    </BrowserRouter>,
  );
}

describe('Layout', () => {
  describe('structure', () => {
    it('renders Header component', () => {
      renderLayout();

      expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    });

    it('renders Sidebar component', () => {
      renderLayout();

      expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
    });

    it('renders main content area', () => {
      renderLayout();

      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('children rendering', () => {
    it('renders children content', () => {
      renderLayout(<p>Child Content</p>);

      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });
  });

  describe('sidebar toggle', () => {
    it('passes onToggleSidebar to Header', () => {
      renderLayout();

      expect(screen.getByTestId('mock-toggle')).toBeInTheDocument();
    });

    it('sidebar starts closed', () => {
      renderLayout();

      expect(screen.getByTestId('mock-sidebar')).toHaveAttribute('data-open', 'false');
    });

    it('toggles sidebar open when Header toggle is clicked', async () => {
      renderLayout();

      await userEvent.click(screen.getByTestId('mock-toggle'));

      expect(screen.getByTestId('mock-sidebar')).toHaveAttribute('data-open', 'true');
    });

    it('closes sidebar when Sidebar onClose is called', async () => {
      renderLayout();

      // Open it first
      await userEvent.click(screen.getByTestId('mock-toggle'));
      expect(screen.getByTestId('mock-sidebar')).toHaveAttribute('data-open', 'true');

      // Close it
      await userEvent.click(screen.getByTestId('mock-close'));
      expect(screen.getByTestId('mock-sidebar')).toHaveAttribute('data-open', 'false');
    });
  });
});
