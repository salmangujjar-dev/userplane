import type { HighlightColor } from '@/types/highlight';

interface HighlightProps {
  children: React.ReactNode;
  color: HighlightColor;
}

const highlightColors: Record<HighlightColor, string> = {
  blue: 'bg-blue-200',
  yellow: 'bg-yellow-200',
  green: 'bg-green-200',
  purple: 'bg-purple-200',
  red: 'bg-red-200',
};

export default function Highlight({ children, color }: HighlightProps) {
  return (
    <span className="relative inline-block">
      <span className="relative z-20 text-black">{children}</span>
      <span
        className={`absolute inset-0 top-1/2 -translate-y-1/2 -rotate-1 z-10 rounded-md ${highlightColors[color]} py-6 md:py-8`}
      />
    </span>
  );
}
