export function UsageSection() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Plan & Usage</h2>
        <p className="text-sm text-muted-foreground">Recordings from team links</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-48 rounded-xl bg-muted" />
        <div className="h-48 rounded-xl bg-muted" />
        <div className="md:col-span-1 h-48 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
