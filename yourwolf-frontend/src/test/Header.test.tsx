import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import {Header} from '../components/Header';

function renderHeader() {
  return render(
    <BrowserRouter>
      <Header />
    </BrowserRouter>,
  );
}

describe('Header', () => {
  describe('rendering', () => {
    it('renders header element', () => {
      renderHeader();

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('displays YourWolf branding', () => {
      renderHeader();

      expect(screen.getByText('Your')).toBeInTheDocument();
      expect(screen.getByText('Wolf')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('has link to home page', () => {
      renderHeader();

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/');
    });
  });
});
