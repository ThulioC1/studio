import { CopyButton } from './copy-button';

interface DataFieldProps {
  label: string;
  value: string | number | undefined;
  allowCopy?: boolean;
}

export function DataField({ label, value, allowCopy = true }: DataFieldProps) {
  const displayValue = value === undefined || value === null || value === '' ? '-' : String(value);

  return (
    <div className="flex flex-col space-y-1 p-3 rounded-md border border-border/40 bg-card hover:bg-accent/5 transition-colors group relative">
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