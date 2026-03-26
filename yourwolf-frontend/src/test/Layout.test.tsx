import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import {Layout} from '../components/Layout';

// Mock child components to isolate Layout testing
vi.mock('../components/Header', () => ({
  Header: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock('../components/Sidebar', () => ({
  Sidebar: () => <aside data-testid="mock-sidebar">Sidebar</aside>,
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
    it('renders container div', () => {
      const {container} = renderLayout();

      expect(container.querySelector('.app-container')).toBeInTheDocument();
    });

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

    it('wraps children in page-content div', () => {
      const {container} = renderLayout(<span>Wrapped</span>);

      expect(container.querySelector('.page-content')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies background color style', () => {
      const {container} = renderLayout();

      const appContainer = container.querySelector('.app-container');
      expect(appContainer).toHaveStyle({minHeight: '100vh'});
    });
  });
});
