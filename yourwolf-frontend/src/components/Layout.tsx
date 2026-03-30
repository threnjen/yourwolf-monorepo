import {ReactNode, useState} from 'react';
import {Header} from './Header';
import {Sidebar} from './Sidebar';
import {theme} from '../styles/theme';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({children}: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div
      className="app-container"
      style={{
        backgroundColor: theme.colors.background,
        minHeight: '100vh',
      }}
    >
      <Header onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="main-content">
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

