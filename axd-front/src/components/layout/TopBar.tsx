import { useState } from 'react';
import { Search, Bell, Moon, Sun, User, LogIn, Shield, FileText, Clock, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminStats } from '../../hooks/useAdminStats';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { LoginModal } from '../auth/LoginModal';

interface TopBarProps {
  onSearchOpen?: () => void;
  onNavChange?: (nav: 'admin') => void;
}

const mockNotifications = [
  { id: '1', title: '파이프라인 성공', message: 'daily_sales_aggregation 파이프라인이 성공적으로 실행되었습니다.', time: '10분 전', unread: true },
  { id: '2', title: '권한 승인', message: 'users 테이블 접근 권한이 승인되었습니다.', time: '1시간 전', unread: true },
  { id: '3', title: '파이프라인 실패', message: 'product_sync 파이프라인에서 오류가 발생했습니다.', time: '3시간 전', unread: false },
];

export function TopBar({ onSearchOpen, onNavChange }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin, signOut } = useAuth();
  const { stats } = useAdminStats();
  const [notifications] = useState(mockNotifications);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const adminNotificationCount = isAdmin ? stats.pendingPermissions + stats.pendingRequests + stats.newComments : 0;
  const unreadCount = isAdmin ? adminNotificationCount : notifications.filter((n) => n.unread).length;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="데이터 자산, 문서, 파이프라인 검색... (Cmd+K)"
            className="pl-9 bg-background"
            onClick={onSearchOpen}
            readOnly
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              알림
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount}개
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isAdmin ? (
              <>
                {adminNotificationCount === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    처리할 작업이 없습니다
                  </div>
                ) : (
                  <>
                    {stats.pendingPermissions > 0 && (
                      <DropdownMenuItem
                        className="flex items-start gap-3 p-3 cursor-pointer"
                        onClick={() => onNavChange?.('admin')}
                      >
                        <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">권한 요청 승인 대기</span>
                            <Badge variant="secondary" className="text-xs">
                              {stats.pendingPermissions}건
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {stats.pendingPermissions}개의 권한 요청이 검토를 기다리고 있습니다
                          </span>
                        </div>
                      </DropdownMenuItem>
                    )}
                    {stats.pendingRequests > 0 && (
                      <DropdownMenuItem
                        className="flex items-start gap-3 p-3 cursor-pointer"
                        onClick={() => onNavChange?.('admin')}
                      >
                        <Clock className="w-4 h-4 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">미처리 서비스 요청</span>
                            <Badge variant="secondary" className="text-xs">
                              {stats.pendingRequests}건
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {stats.pendingRequests}개의 서비스 요청이 처리를 기다리고 있습니다
                          </span>
                        </div>
                      </DropdownMenuItem>
                    )}
                    {stats.newComments > 0 && (
                      <DropdownMenuItem
                        className="flex items-start gap-3 p-3 cursor-pointer"
                        onClick={() => onNavChange?.('admin')}
                      >
                        <MessageSquare className="w-4 h-4 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">신규 댓글</span>
                            <Badge variant="secondary" className="text-xs">
                              {stats.newComments}건
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            최근 24시간 내 {stats.newComments}개의 댓글이 작성되었습니다
                          </span>
                        </div>
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                새로운 알림이 없습니다
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    'flex flex-col items-start gap-1 p-3 cursor-pointer',
                    notification.unread && 'bg-accent/50'
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-medium text-sm">{notification.title}</span>
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  isAdmin ? "bg-amber-500" : "bg-primary"
                )}>
                  {isAdmin ? (
                    <Shield className="h-4 w-4 text-white" />
                  ) : (
                    <User className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.email?.split('@')[0]}</span>
                    {isAdmin && (
                      <Badge variant="warning" className="text-[10px] px-1.5 py-0">Admin</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>내 프로필</DropdownMenuItem>
              <DropdownMenuItem>설정</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => signOut()}>
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setLoginModalOpen(true)}>
            <LogIn className="h-4 w-4 mr-2" />
            로그인
          </Button>
        )}
      </div>

      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </header>
  );
}
