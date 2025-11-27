export function WorkspaceSection() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Workspace</h2>
        <p className="text-sm text-muted-foreground">Manage current workspaces</p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
