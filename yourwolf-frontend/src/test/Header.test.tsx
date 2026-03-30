import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {BrowserRouter} from 'react-router-dom';
import {Header} from '../components/Header';

function renderHeader(props: {onToggleSidebar?: () => void} = {}) {
  return render(
    <BrowserRouter>
      <Header {...props} />
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

  describe('hamburger button', () => {
    it('renders hamburger button when onToggleSidebar is provided', () => {
      renderHeader({onToggleSidebar: vi.fn()});

      const button = screen.getByRole('button', {name: /toggle navigation/i});
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('hamburger-btn');
    });

    it('does not render hamburger button when onToggleSidebar is not provided', () => {
      renderHeader();

      expect(screen.queryByRole('button', {name: /toggle navigation/i})).not.toBeInTheDocument();
    });

    it('calls onToggleSidebar when hamburger button is clicked', async () => {
      const onToggle = vi.fn();
      renderHeader({onToggleSidebar: onToggle});

      await userEvent.click(screen.getByRole('button', {name: /toggle navigation/i}));

      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });
});
