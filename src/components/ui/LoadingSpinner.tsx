import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({ size = 'md', className, fullPage }: LoadingSpinnerProps) {
  const sizeClasses = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

  const spinner = (
    <div
      className={clsx(
        'rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-brand-600 animate-spin',
        sizeClasses[size],
        className
      )}
    />
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        {spinner}
      </div>
    );
  }

  return spinner;
}
