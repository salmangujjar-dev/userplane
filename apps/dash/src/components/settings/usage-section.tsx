'use client';

import { Button } from '@workspace/ui/components/button';
import { Progress } from '@workspace/ui/components/progress';
import { ArrowUpRight, Info } from 'lucide-react';

export function UsageSection() {
  return (
    <div>
      <div className="space-y-8 max-w-2xl">
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Team Usage</h3>
            <p className="text-sm text-muted-foreground">
              Monitor your team's resource consumption
            </p>
          </div>
          <div className="max-w-md rounded-xl border bg-card p-6 space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Recording Minutes</span>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">13</span>/90 minutes used this month
              </div>
              <Progress value={(13 / 90) * 100} className="h-2" />
              <div className="p-3 rounded-lg bg-muted/50 border border-border flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Upgrade your team to get instant access to more links
                </p>
                <Button variant="ghost" size="sm" className="flex-shrink-0 h-8">
                  Upgrade
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>

            <div className="border-t pt-8 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Recording Links</span>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">0</span>/30 used this month
              </div>
              <Progress value={0} className="h-2" />
            </div>

            <div className="border-t pt-8 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Seats</span>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">0</span>/15 used this month
              </div>
              <Progress value={0} className="h-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
