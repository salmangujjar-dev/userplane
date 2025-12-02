'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Progress } from '@workspace/ui/components/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';
import { Info, ChevronDown, Minus, Plus, ArrowRight } from 'lucide-react';
import { ADDITIONAL_RECORDINGS_OPTIONS, ADDITIONAL_SEATS_OPTIONS } from '@workspace/pricing';

export function UsageSection() {
  const [expandedMinutes, setExpandedMinutes] = useState(false);
  const [expandedSeats, setExpandedSeats] = useState(false);
  const [selectedRecordings, setSelectedRecordings] = useState<number | null>(null);
  const [seatQuantities, setSeatQuantities] = useState<Record<number, number>>({
    5: 1,
  });

  const incrementSeats = (users: number) => {
    setSeatQuantities((prev) => ({
      ...prev,
      [users]: (prev[users] || 1) + 1,
    }));
  };

  const decrementSeats = (users: number) => {
    setSeatQuantities((prev) => ({
      ...prev,
      [users]: Math.max(1, (prev[users] || 1) - 1),
    }));
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start max-w-3xl">
        <div className="rounded-xl border bg-card p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Recordings</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">13</span>/50 used this month
            </div>
            <Progress value={(13 / 50) * 100} className="h-2" />
          </div>

          <div className="border-t mt-6 pt-6">
            <Collapsible open={expandedMinutes} onOpenChange={setExpandedMinutes}>
              <CollapsibleTrigger className="flex w-full items-center justify-between hover:opacity-70 transition-opacity">
                <span className="text-sm font-medium">Request additional recordings</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    expandedMinutes ? 'rotate-180' : ''
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-4 space-y-3">
                  {ADDITIONAL_RECORDINGS_OPTIONS.map((option) => (
                    <button
                      key={option.recordings}
                      type="button"
                      onClick={() => setSelectedRecordings(option.recordings)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-sm ${
                        selectedRecordings === option.recordings
                          ? 'bg-primary/10 border-primary'
                          : 'bg-background hover:bg-muted'
                      }`}
                    >
                      <span>{option.recordings} recordings</span>
                      <span className="font-medium">${option.price}</span>
                    </button>
                  ))}
                </div>
                {selectedRecordings && (
                  <Button className="w-full mt-4">
                    Request
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Seats</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">0</span>/15 used this month
            </div>
            <Progress value={0} className="h-2" />
          </div>

          <div className="border-t mt-6 pt-6">
            <Collapsible open={expandedSeats} onOpenChange={setExpandedSeats}>
              <CollapsibleTrigger className="flex w-full items-center justify-between hover:opacity-70 transition-opacity">
                <span className="text-sm font-medium">Request additional seats</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    expandedSeats ? 'rotate-180' : ''
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-4 space-y-3">
                  {ADDITIONAL_SEATS_OPTIONS.map((option) => {
                    const quantity = seatQuantities[option.users] ?? 1;
                    const totalPrice = option.price * quantity;
                    const totalUsers = option.users * quantity;

                    return (
                      <div key={option.users} className="p-3 rounded-lg border bg-background">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              {totalUsers} user{totalUsers !== 1 ? 's' : ''} /{' '}
                            </span>
                            <span className="font-semibold">${totalPrice}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => decrementSeats(option.users)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <div className="h-8 w-16 flex items-center justify-center text-sm font-medium">
                              {quantity}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => incrementSeats(option.users)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button className="w-full mt-4">
                  Request
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
}
