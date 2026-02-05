import { useState } from 'react';
import { Send, Sparkles, Code, Copy, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';

interface AICopilotProps {
  onInsertSQL: (sql: string) => void;
  currentQuery: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
}

const quickActions = [
  { label: '이 쿼리 설명해줘', prompt: '현재 쿼리를 분석하고 설명해줘' },
  { label: 'SQL 최적화', prompt: '이 쿼리를 최적화해줘' },
  { label: '에러 분석', prompt: '쿼리 에러를 분석해줘' },
];

export function AICopilot({ onInsertSQL, currentQuery }: AICopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '안녕하세요! SQL 작성을 도와드리겠습니다. 자연어로 질문하시면 SQL로 변환해 드릴게요.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    let responseContent = '';
    let responseSql = '';

    if (input.includes('사용자') || input.includes('users')) {
      responseContent = '최근 7일간 가입한 사용자를 조회하는 쿼리입니다.';
      responseSql = `SELECT id, email, name, created_at
FROM users
WHERE created_at > now() - interval '7 days'
ORDER BY created_at DESC;`;
    } else if (input.includes('주문') || input.includes('orders')) {
      responseContent = '주문 상태별 통계를 조회하는 쿼리입니다.';
      responseSql = `SELECT
  status,
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue
FROM orders
GROUP BY status
ORDER BY order_count DESC;`;
    } else if (input.includes('설명') || input.includes('explain')) {
      responseContent = `현재 쿼리를 분석해 드리겠습니다.\n\n이 쿼리는 users 테이블에서 모든 컬럼을 조회하고 있으며, LIMIT 10을 통해 결과를 10개로 제한하고 있습니다.\n\n최적화 제안:\n1. 필요한 컬럼만 명시적으로 SELECT\n2. WHERE 조건 추가 검토\n3. 인덱스 활용 확인`;
    } else {
      responseContent = '요청하신 내용을 기반으로 SQL을 생성했습니다.';
      responseSql = `SELECT *
FROM your_table
WHERE condition = 'value'
LIMIT 100;`;
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseContent,
      sql: responseSql,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleCopy = (sql: string, messageId: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt + (currentQuery ? `\n\n현재 쿼리:\n${currentQuery}` : ''));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="h-12 border-b px-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <h2 className="font-semibold text-sm">AI 코파일럿</h2>
      </div>

      <div className="p-2 border-b flex flex-wrap gap-1.5">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleQuickAction(action.prompt)}
          >
            {action.label}
          </Button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex flex-col gap-2',
                message.role === 'user' && 'items-end'
              )}
            >
              <div
                className={cn(
                  'rounded-lg px-3 py-2 text-sm max-w-[90%]',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>

              {message.sql && (
                <div className="w-full rounded-lg border bg-zinc-900 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800 text-zinc-400">
                    <span className="text-xs flex items-center gap-1">
                      <Code className="h-3 w-3" />
                      SQL
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-zinc-400 hover:text-white"
                        onClick={() => handleCopy(message.sql!, message.id)}
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-zinc-400 hover:text-white"
                        onClick={() => onInsertSQL(message.sql!)}
                      >
                        에디터에 삽입
                      </Button>
                    </div>
                  </div>
                  <pre className="p-3 text-xs text-zinc-100 overflow-x-auto">
                    <code>{message.sql}</code>
                  </pre>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs">생각 중...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="자연어로 SQL을 생성하거나 질문하세요..."
            className="flex-1 min-h-[60px] max-h-[120px] p-2 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
