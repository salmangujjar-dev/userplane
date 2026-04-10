export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
      <div className="size-6 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
