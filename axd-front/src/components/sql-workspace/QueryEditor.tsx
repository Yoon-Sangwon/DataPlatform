import { Play, Save, Trash2, History, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  isRunning: boolean;
}

const recentQueries = [
  'SELECT * FROM users WHERE created_at > now() - interval \'7 days\'',
  'SELECT COUNT(*) FROM orders GROUP BY status',
  'SELECT u.name, COUNT(o.id) FROM users u JOIN orders o ON u.id = o.user_id GROUP BY u.name',
];

export function QueryEditor({ value, onChange, onRun, isRunning }: QueryEditorProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun();
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="flex flex-col border-b">
      <div className="flex items-center justify-between gap-2 px-4 py-2 bg-muted/30 border-b">
        <div className="flex items-center gap-2">
          <Button
            onClick={onRun}
            disabled={isRunning || !value.trim()}
            className="gap-2"
            size="sm"
          >
            {isRunning ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                실행 중...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                실행
              </>
            )}
          </Button>

          <div className="h-4 w-px bg-border" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <History className="h-4 w-4" />
                히스토리
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-96">
              {recentQueries.map((query, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => onChange(query)}
                  className="text-xs font-mono truncate"
                >
                  {query}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" className="gap-2">
            <Save className="h-4 w-4" />
            저장
          </Button>

          <Button variant="ghost" size="sm" onClick={() => onChange('')}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Cmd+Enter로 실행</span>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-muted/50 border-r flex flex-col items-end pr-2 pt-3 text-xs text-muted-foreground font-mono select-none">
          {value.split('\n').map((_, index) => (
            <div key={index} className="leading-6">
              {index + 1}
            </div>
          ))}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="SQL 쿼리를 입력하세요..."
          className="w-full h-48 pl-14 pr-4 py-3 bg-background font-mono text-sm resize-none focus:outline-none leading-6"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
