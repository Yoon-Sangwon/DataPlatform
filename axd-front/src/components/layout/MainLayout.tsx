import { useState, useEffect, useCallback, ReactNode } from 'react';
import { Sidebar, NavItem } from './Sidebar';
import { TopBar } from './TopBar';
import { SearchDialog } from './SearchDialog';

interface MainLayoutProps {
  children: ReactNode;
  activeNav: NavItem;
  onNavChange: (nav: NavItem) => void;
}

export function MainLayout({ children, activeNav, onNavChange }: MainLayoutProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsSearchOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activeNav={activeNav} onNavChange={onNavChange} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onSearchOpen={() => setIsSearchOpen(true)} onNavChange={onNavChange} />

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </div>
  );
}
