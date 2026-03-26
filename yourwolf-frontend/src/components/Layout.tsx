import {ReactNode} from 'react';
import {Header} from './Header';
import {Sidebar} from './Sidebar';
import {theme} from '../styles/theme';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({children}: LayoutProps) {
  return (
    <div
      className="app-container"
      style={{
        backgroundColor: theme.colors.background,
        minHeight: '100vh',
      }}
    >
      <Header />
      <Sidebar />
      <main className="main-content">
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

