import { cn } from '@/lib/utils'

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg'
const sizes: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
}

export function Spinner({ size = 'md', className }: { size?: SpinnerSize; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-full border-transparent border-t-brand-500 animate-spin',
        sizes[size],
        className,
      )}
    />
  )
}
