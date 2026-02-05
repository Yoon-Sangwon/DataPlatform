import { useState } from 'react';
import { Database, Code, ChevronLeft, ChevronRight, Send, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/tooltip';
import { useAuth } from '../../contexts/AuthContext';

export type NavItem = 'data-portal' | 'sql-workspace' | 'request-center' | 'admin';

interface SidebarProps {
  activeNav: NavItem;
  onNavChange: (nav: NavItem) => void;
}

const navItems = [
  { id: 'data-portal' as NavItem, icon: Database, label: '데이터 찾기', adminOnly: false },
  { id: 'sql-workspace' as NavItem, icon: Code, label: '데이터 조회', adminOnly: false },
  { id: 'request-center' as NavItem, icon: Send, label: '신청 관리', adminOnly: false },
  { id: 'admin' as NavItem, icon: Settings, label: '관리자', adminOnly: true },
];

export function Sidebar({ activeNav, onNavChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isAdmin } = useAuth();

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'relative flex h-full flex-col border-r border-border bg-card transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-56'
        )}
      >
        <div className="flex h-14 items-center border-b border-border px-4">
          {!isCollapsed && (
            <span className="text-lg font-bold text-foreground">DataHub</span>
          )}
          {isCollapsed && (
            <Database className="mx-auto h-6 w-6 text-foreground" />
          )}
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;

            if (isCollapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="icon"
                      className={cn(
                        'w-full',
                        isActive && 'bg-secondary'
                      )}
                      onClick={() => onNavChange(item.id)}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  isActive && 'bg-secondary'
                )}
                onClick={() => onNavChange(item.id)}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </nav>

        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-full"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
