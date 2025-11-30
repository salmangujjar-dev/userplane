'use client';

export function InfoPanel() {
  const systemMetadata = {
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    browser: 'Chrome 120.0.6099.109',
    os: 'macOS 14.2.1',
    windowSize: '1920 × 1080',
  };

  const integrationMetadata = {
    intercomReference: 'conv_abc123456789',
  };

  const customMetadata = {
    customerId: 'cust_4JhN8fK2pQx9',
    isPaying: true,
    isEnterprise: false,
    plan: 'Pro',
    region: 'US-EAST',
    accountAge: '2 years',
    lastLogin: '2 hours ago',
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-4">System Metadata</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="font-mono">{systemMetadata.date}</span>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Time</span>
            <span className="font-mono">{systemMetadata.time}</span>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Browser</span>
            <span className="font-mono">{systemMetadata.browser}</span>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">OS</span>
            <span className="font-mono">{systemMetadata.os}</span>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Window Size</span>
            <span className="font-mono">{systemMetadata.windowSize}</span>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold mb-4">Integration Metadata</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Intercom Reference</span>
            <span className="font-mono">{integrationMetadata.intercomReference}</span>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold mb-4">Custom Metadata</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Customer ID</span>
            <span className="font-mono">{customMetadata.customerId}</span>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Is Paying</span>
            <span className="flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${customMetadata.isPaying ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="font-mono">{customMetadata.isPaying ? 'Yes' : 'No'}</span>
            </span>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Is Enterprise</span>
            <span className="flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${customMetadata.isEnterprise ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="font-mono">{customMetadata.isEnterprise ? 'Yes' : 'No'}</span>
            </span>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-mono">{customMetadata.plan}</span>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Region</span>
            <span className="font-mono">{customMetadata.region}</span>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Account Age</span>
            <span className="font-mono">{customMetadata.accountAge}</span>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Last Login</span>
            <span className="font-mono">{customMetadata.lastLogin}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
