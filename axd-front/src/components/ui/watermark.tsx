import { cn } from '../../lib/utils';

interface WatermarkProps {
  text: string;
  className?: string;
  opacity?: number;
}

export function Watermark({ text, className, opacity = 0.06 }: WatermarkProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none overflow-hidden select-none',
        className
      )}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 flex flex-wrap gap-16 -rotate-12 scale-150 origin-center"
        style={{
          transform: 'rotate(-15deg) scale(1.5)',
        }}
      >
        {Array.from({ length: 50 }).map((_, i) => (
          <span
            key={i}
            className="text-foreground font-bold text-lg whitespace-nowrap"
            style={{ opacity }}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
