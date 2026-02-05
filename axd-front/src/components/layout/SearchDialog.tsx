import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Input } from '../ui/input';
import { Search, Database, FileText, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SearchCategory = 'all' | 'assets' | 'docs';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: 'asset' | 'doc';
  icon: typeof Database;
}

const mockResults: SearchResult[] = [
  { id: '1', title: 'users', description: 'public.main_db - 서비스 사용자 정보 테이블', category: 'asset', icon: Database },
  { id: '2', title: 'orders', description: 'public.main_db - 주문 데이터 테이블', category: 'asset', icon: Database },
  { id: '3', title: '사용자 데이터 정책', description: '문서 - PII 데이터 처리 정책', category: 'doc', icon: FileText },
  { id: '5', title: 'products', description: 'public.main_db - 상품 마스터 테이블', category: 'asset', icon: Database },
];

const recentSearches = ['users 테이블', '매출 대시보드'];

const categoryLabels: Record<SearchCategory, string> = {
  all: '전체',
  assets: '데이터 자산',
  docs: '문서',
};

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (query.length > 0) {
      const filtered = mockResults.filter((r) => {
        const matchesQuery = r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.description.toLowerCase().includes(query.toLowerCase());

        if (category === 'all') return matchesQuery;
        if (category === 'assets') return matchesQuery && r.category === 'asset';
        if (category === 'docs') return matchesQuery && r.category === 'doc';
        return false;
      });
      setResults(filtered);
    } else {
      setResults([]);
    }
    setSelectedIndex(0);
  }, [query, category]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setCategory('all');
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="flex items-center border-b px-4">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="검색어를 입력하세요..."
            className="border-0 focus-visible:ring-0 text-base h-14"
            autoFocus
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            ESC
          </kbd>
        </div>

        <div className="flex items-center gap-2 border-b px-4 py-2">
          {(Object.keys(categoryLabels) as SearchCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                category === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        <ScrollArea className="max-h-[400px]">
          {query.length === 0 ? (
            <div className="p-4">
              <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                최근 검색
              </div>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(search)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Clock className="h-4 w-4" />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">"{query}"에 대한 검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="p-2">
              {results.map((result, index) => {
                const Icon = result.icon;
                return (
                  <button
                    key={result.id}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
                      index === selectedIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{result.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {result.description}
                      </div>
                    </div>
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                      Enter
                    </kbd>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-between border-t bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-background px-1">↑</kbd>
              <kbd className="rounded border bg-background px-1">↓</kbd>
              탐색
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-background px-1">Enter</kbd>
              선택
            </span>
          </div>
          <span>Powered by DataHub</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
