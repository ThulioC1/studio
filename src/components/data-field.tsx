import { CopyButton } from './copy-button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DataFieldProps {
  label: string;
  value: string | number | undefined;
  allowCopy?: boolean;
  className?: string;
}

export function DataField({ label, value, allowCopy = true, className }: DataFieldProps) {
  const { toast } = useToast();
  const displayValue = value === undefined || value === null || value === '' ? '-' : String(value);

  const handleCopy = async () => {
    if (!allowCopy || displayValue === '-') return;
    
    try {
      await navigator.clipboard.writeText(displayValue);
      toast({
        title: "Copiado!",
        description: `${label} copiado para a área de transferência.`,
        duration: 2000,
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o texto.',
      });
    }
  };

  return (
    <div 
      onClick={handleCopy}
      className={cn(
        "flex flex-col space-y-1 p-3 rounded-md border border-border/40 bg-card transition-all group relative",
        allowCopy && displayValue !== '-' ? "cursor-pointer hover:bg-accent/10 hover:border-accent/30 active:scale-[0.98]" : "",
        className
      )}
    >
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold break-words pr-8">
          {displayValue}
        </span>
        {allowCopy && displayValue !== '-' && (
          <CopyButton 
            value={displayValue} 
            className="h-6 w-6 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity" 
          />
        )}
      </div>
    </div>
  );
}
