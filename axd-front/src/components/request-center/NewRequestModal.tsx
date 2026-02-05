import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Lightbulb,
  Check,
  Database,
  Shield,
  GitBranch,
  BarChart3,
  AlertTriangle,
  Folder,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '../ui/toast';
import { useRequestTypes, useSubmitRequest } from '../../hooks/useRequestCenter';
import { RequestCategory, RequestType, FormField, ServiceRequestPriority } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface NewRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: RequestCategory[];
  allTypes: RequestType[];
  onSuccess: () => void;
}

type Step = 'select' | 'form' | 'review';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendations?: RecommendedType[];
  timestamp: Date;
}

interface RecommendedType {
  type: RequestType;
  category: RequestCategory;
  matchScore: number;
  reason: string;
}

const iconMap: Record<string, React.ElementType> = {
  sparkles: Sparkles,
  database: Database,
  shield: Shield,
  'git-branch': GitBranch,
  'bar-chart-3': BarChart3,
  lightbulb: Lightbulb,
  'alert-triangle': AlertTriangle,
  folder: Folder,
};

const colorMap: Record<string, { bg: string; text: string }> = {
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-600 dark:text-amber-400' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-600 dark:text-blue-400' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-600 dark:text-emerald-400' },
  violet: { bg: 'bg-violet-100 dark:bg-violet-900/50', text: 'text-violet-600 dark:text-violet-400' },
  cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/50', text: 'text-cyan-600 dark:text-cyan-400' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-600 dark:text-orange-400' },
  red: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-600 dark:text-red-400' },
};

const priorityOptions: { value: ServiceRequestPriority; label: string; description: string }[] = [
  { value: 'low', label: '낮음', description: '여유있게 처리' },
  { value: 'medium', label: '보통', description: '일반적인 처리' },
  { value: 'high', label: '높음', description: '우선 처리 필요' },
  { value: 'urgent', label: '긴급', description: '즉시 처리 필요' },
];

const suggestionExamples = [
  '지난달 매출 데이터',
  '데이터 품질 이슈',
  '대시보드 만들고 싶어요',
];

function analyzeRequest(
  input: string,
  categories: RequestCategory[],
  types: RequestType[]
): RecommendedType[] {
  const inputLower = input.toLowerCase();
  const results: RecommendedType[] = [];

  const keywordPatterns: { keywords: string[]; slugs: string[]; reason: string }[] = [
    { keywords: ['데이터', '뽑아', '추출', '엑셀', '목록', '리스트', '필요'], slugs: ['data-extract-simple', 'data-extraction'], reason: '데이터 추출 요청' },
    { keywords: ['이상', '오류', '잘못', '틀린', '안맞', '문제', '품질'], slugs: ['data-issue-simple', 'data-inconsistency'], reason: '데이터 이슈 신고' },
    { keywords: ['권한', '접근', '허용', '볼 수', '조회'], slugs: ['read-access', 'write-access'], reason: '데이터 접근 권한 요청' },
    { keywords: ['대시보드', '시각화', '차트', '그래프'], slugs: ['dashboard-request'], reason: '대시보드 제작 요청' },
    { keywords: ['리포트', '보고서', '정기', '주간', '월간', '발송'], slugs: ['scheduled-report'], reason: '정기 리포트 설정' },
    { keywords: ['자동화', '자동', '반복', '수작업'], slugs: ['automation-consulting'], reason: '업무 자동화 상담' },
    { keywords: ['파이프라인', 'etl', '배치', '스케줄'], slugs: ['new-pipeline', 'modify-pipeline'], reason: '파이프라인 관련 요청' },
    { keywords: ['분석', '인사이트', '알고싶', '궁금'], slugs: ['adhoc-analysis', 'data-inquiry'], reason: '데이터 분석 요청' },
    { keywords: ['지표', '메트릭', 'kpi', '산출'], slugs: ['metric-definition'], reason: '지표 정의 요청' },
    { keywords: ['연동', '연결', 'api', '소스', '외부'], slugs: ['new-data-source'], reason: '데이터 소스 연동' },
    { keywords: ['느려', '성능', '오래걸', '속도'], slugs: ['performance-issue'], reason: '성능 이슈 신고' },
    { keywords: ['장애', '실패', '에러', '안돌아'], slugs: ['pipeline-failure'], reason: '장애 신고' },
    { keywords: ['삭제', 'gdpr', '개인정보'], slugs: ['data-deletion'], reason: '데이터 삭제 요청' },
  ];

  for (const pattern of keywordPatterns) {
    const matchCount = pattern.keywords.filter((kw) => inputLower.includes(kw)).length;
    if (matchCount > 0) {
      for (const slug of pattern.slugs) {
        const type = types.find((t) => t.slug === slug);
        if (type) {
          const category = categories.find((c) => c.id === type.category_id);
          if (category) {
            results.push({ type, category, matchScore: matchCount, reason: pattern.reason });
          }
        }
      }
    }
  }

  results.sort((a, b) => b.matchScore - a.matchScore);
  const uniqueResults: RecommendedType[] = [];
  const seenTypes = new Set<string>();
  for (const result of results) {
    if (!seenTypes.has(result.type.id)) {
      seenTypes.add(result.type.id);
      uniqueResults.push(result);
    }
    if (uniqueResults.length >= 3) break;
  }

  return uniqueResults;
}

export function NewRequestModal({
  open,
  onOpenChange,
  categories,
  allTypes,
  onSuccess,
}: NewRequestModalProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedCategory, setSelectedCategory] = useState<RequestCategory | null>(null);
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ServiceRequestPriority>('medium');
  const [dueDate, setDueDate] = useState('');

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { types, loading: typesLoading } = useRequestTypes(selectedCategory?.id || null);
  const { submitRequest, submitting } = useSubmitRequest();
  const { addToast } = useToast();

  useEffect(() => {
    if (!open) {
      setStep('select');
      setSelectedCategory(null);
      setSelectedType(null);
      setFormData({});
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setChatInput('');
      setMessages([]);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const recommendations = analyzeRequest(chatInput, categories, allTypes);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: recommendations.length > 0
        ? '이런 요청을 찾으시는 것 같아요:'
        : '조금 더 구체적으로 말씀해 주시겠어요?',
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleSelectFromChat = (rec: RecommendedType) => {
    setSelectedCategory(rec.category);
    setSelectedType(rec.type);
    setStep('form');
  };

  const handleCategorySelect = (cat: RequestCategory) => {
    setSelectedCategory(cat);
    setSelectedType(null);
  };

  const handleTypeSelect = (type: RequestType) => {
    setSelectedType(type);
    setFormData({});
    setStep('form');
  };

  const handleFormFieldChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleBack = () => {
    if (step === 'form') {
      setSelectedType(null);
      setStep('select');
    } else if (step === 'review') {
      setStep('form');
    }
  };

  const handleNext = () => {
    if (step === 'form') {
      setStep('review');
    }
  };

  const canProceed = () => {
    if (step === 'form') {
      if (!title.trim()) return false;
      const schema = selectedType?.form_schema || [];
      for (const field of schema) {
        if (field.required && !formData[field.name]?.trim()) {
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedType || submitting) return;
    try {
      const success = await submitRequest({
        requestTypeId: selectedType.id,
        title,
        description,
        formData,
        priority,
        dueDate: dueDate || undefined,
      });
      if (success) {
        addToast({
          type: 'success',
          title: '요청이 제출되었습니다',
          description: `${selectedType.name} 요청이 접수되었습니다. 담당자 배정 후 처리가 시작됩니다.`,
        });
        onSuccess();
        onOpenChange(false);
      } else {
        addToast({
          type: 'error',
          title: '요청 제출 실패',
          description: '문제가 발생했습니다. 다시 시도해 주세요.',
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: '오류 발생',
        description: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      });
    }
  };

  const renderFormField = (field: FormField) => {
    const value = formData[field.name] || '';
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFormFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full min-h-[100px] p-3 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          />
        );
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFormFieldChange(field.name, e.target.value)}
            className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">선택하세요</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'date':
        return <Input type="date" value={value} onChange={(e) => handleFormFieldChange(field.name, e.target.value)} />;
      case 'number':
        return <Input type="number" value={value} onChange={(e) => handleFormFieldChange(field.name, e.target.value)} placeholder={field.placeholder} />;
      default:
        return <Input type="text" value={value} onChange={(e) => handleFormFieldChange(field.name, e.target.value)} placeholder={field.placeholder} />;
    }
  };

  const renderSelectStep = () => (
    <div className="flex h-[500px]">
      <div className="w-1/2 border-r flex flex-col">
        <div className="p-4 border-b bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="font-medium text-sm">AI 도우미</span>
          </div>
          <p className="text-xs text-muted-foreground">필요한 걸 말씀해 주세요</p>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-3">
                <MessageSquare className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                무엇이 필요하신가요?
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestionExamples.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setChatInput(s); inputRef.current?.focus(); }}
                    className="px-3 py-1.5 text-xs rounded-full border bg-background hover:bg-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[90%] rounded-2xl px-3 py-2 text-sm',
                    msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'
                  )}>
                    <p>{msg.content}</p>
                    {msg.recommendations && (
                      <div className="mt-2 space-y-1.5">
                        {msg.recommendations.map((rec) => (
                          <button
                            key={rec.type.id}
                            onClick={() => handleSelectFromChat(rec)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg bg-background border text-left hover:border-primary/50 transition-all text-xs"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{rec.type.name}</div>
                              <div className="text-muted-foreground">{rec.reason}</div>
                            </div>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleChatSubmit} className="p-3 border-t">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="무엇이 필요하세요?"
              className="flex-1 h-9 px-3 rounded-full border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              disabled={isTyping}
            />
            <Button type="submit" size="icon" className="h-9 w-9 rounded-full shrink-0" disabled={!chatInput.trim() || isTyping}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </div>

      <div className="w-1/2 flex flex-col">
        <div className="p-4 border-b">
          <span className="font-medium text-sm">카테고리에서 선택</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {categories.filter(c => !c.is_simple).map((cat) => {
              const Icon = iconMap[cat.icon] || Folder;
              const colors = colorMap[cat.color] || colorMap.blue;
              const isSelected = selectedCategory?.id === cat.id;
              const categoryTypes = allTypes.filter(t => t.category_id === cat.id);

              return (
                <div key={cat.id} className="space-y-2">
                  <button
                    onClick={() => handleCategorySelect(cat)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                      isSelected ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                    )}
                  >
                    <div className={cn('shrink-0 p-2 rounded-lg', colors.bg)}>
                      <Icon className={cn('h-4 w-4', colors.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{cat.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{cat.description}</div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">{categoryTypes.length}</Badge>
                  </button>

                  {isSelected && categoryTypes.length > 0 && (
                    <div className="ml-4 pl-4 border-l-2 space-y-1">
                      {categoryTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => handleTypeSelect(type)}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-accent/50 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium">{type.name}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">~{type.estimated_days}일</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  const renderFormStep = () => {
    const schema = selectedType?.form_schema || [];
    return (
      <ScrollArea className="h-[500px]">
        <div className="p-6 space-y-5">
          {selectedType && (
            <div className="pb-4 border-b">
              <Badge variant="outline" className="mb-2">{selectedCategory?.name}</Badge>
              <h3 className="font-semibold">{selectedType.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedType.description}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">
              요청 제목 <span className="text-red-500">*</span>
            </label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="요청 내용을 한 줄로 요약해 주세요" />
          </div>

          {schema.map((field) => (
            <div key={field.name}>
              <label className="text-sm font-medium mb-2 block">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderFormField(field)}
            </div>
          ))}

          <div>
            <label className="text-sm font-medium mb-2 block">추가 설명 (선택)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="추가로 전달하고 싶은 내용이 있으면 작성해 주세요..."
              className="w-full min-h-[80px] p-3 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">우선순위</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ServiceRequestPriority)}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label} - {opt.description}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">희망 완료일 (선택)</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  };

  const renderReviewStep = () => {
    const schema = selectedType?.form_schema || [];
    return (
      <ScrollArea className="h-[500px]">
        <div className="p-6 space-y-4">
          <div className="rounded-lg border divide-y">
            <div className="p-3 bg-muted/30">
              <span className="text-xs text-muted-foreground">요청 유형</span>
              <div className="font-medium mt-0.5">{selectedCategory?.name} / {selectedType?.name}</div>
            </div>
            <div className="p-3">
              <span className="text-xs text-muted-foreground">요청 제목</span>
              <div className="font-medium mt-0.5">{title}</div>
            </div>
            {schema.map((field) => {
              const value = formData[field.name];
              if (!value) return null;
              return (
                <div key={field.name} className="p-3">
                  <span className="text-xs text-muted-foreground">{field.label}</span>
                  <div className="text-sm mt-0.5 whitespace-pre-wrap">{value}</div>
                </div>
              );
            })}
            {description && (
              <div className="p-3">
                <span className="text-xs text-muted-foreground">추가 설명</span>
                <div className="text-sm mt-0.5 whitespace-pre-wrap">{description}</div>
              </div>
            )}
            <div className="p-3 flex gap-4">
              <div>
                <span className="text-xs text-muted-foreground">우선순위</span>
                <div className="text-sm mt-0.5">{priorityOptions.find((p) => p.value === priority)?.label}</div>
              </div>
              {dueDate && (
                <div>
                  <span className="text-xs text-muted-foreground">희망 완료일</span>
                  <div className="text-sm mt-0.5">{dueDate}</div>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <p>요청이 제출되면 담당자가 검토 후 처리를 시작합니다.</p>
            <p className="mt-1">예상 처리 기간: <strong>약 {selectedType?.estimated_days}일</strong></p>
          </div>
        </div>
      </ScrollArea>
    );
  };

  const getStepTitle = () => {
    switch (step) {
      case 'select': return '새 요청';
      case 'form': return '요청 정보 입력';
      case 'review': return '요청 내용 확인';
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && submitting) return;
    onOpenChange(newOpen);
  };

  const steps: Step[] = ['select', 'form', 'review'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn('p-0 gap-0', step === 'select' ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && 'AI에게 물어보거나 카테고리에서 직접 선택하세요'}
            {step === 'form' && '필요한 정보를 입력해 주세요'}
            {step === 'review' && '입력 내용을 확인하고 요청을 제출하세요'}
          </DialogDescription>
          {step !== 'select' && (
            <div className="flex gap-1.5 mt-3">
              {steps.map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    i <= currentStepIndex ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </div>
          )}
        </DialogHeader>

        {step === 'select' && renderSelectStep()}
        {step === 'form' && renderFormStep()}
        {step === 'review' && renderReviewStep()}

        {step !== 'select' && (
          <div className="flex justify-between p-4 border-t">
            <Button variant="outline" onClick={handleBack} disabled={submitting} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              이전
            </Button>
            {step === 'form' && (
              <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
                다음
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {step === 'review' && (
              <Button onClick={handleSubmit} disabled={submitting} className="gap-2 min-w-[120px]">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    요청 제출
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
