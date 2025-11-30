'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Progress } from '@workspace/ui/components/progress';
import { Input } from '@workspace/ui/components/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';
import { ArrowUpRight, Clock, Info, ChevronDown, Minus, Plus } from 'lucide-react';

const ADDITIONAL_MINUTES_OPTIONS = [
  { minutes: 90, price: 19 },
  { minutes: 180, price: 39 },
  { minutes: 360, price: 79 },
  { minutes: 600, price: 129 },
];

const ADDITIONAL_SEATS_OPTIONS = [
  { users: 5, price: 29, label: '$29 / 5 user' },
  { users: 1, price: 9, label: '$9 / user' },
];

export function UsageSection() {
  const [expandedMinutes, setExpandedMinutes] = useState(false);
  const [expandedLinks, setExpandedLinks] = useState(false);
  const [expandedSeats, setExpandedSeats] = useState(false);
  const [seatQuantities, setSeatQuantities] = useState<Record<number, number>>({
    5: 1,
    1: 1,
  });

  const updateSeatQuantity = (users: number, quantity: number) => {
    setSeatQuantities((prev) => ({
      ...prev,
      [users]: Math.max(1, quantity),
    }));
  };

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
      <div className="space-y-8 max-w-2xl">
        <div>
          <div className="max-w-md rounded-xl border bg-card p-6">
            <div className="mb-4">
              <h4 className="text-xl font-semibold mb-2">Starter</h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Screen recording limit</span>
                </div>
                <span className="text-sm font-medium">3 minutes</span>
              </div>
            </div>
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
        </div>

        <div className="max-w-md rounded-xl border bg-card p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Recording Minutes</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">13</span>/90 minutes used this month
            </div>
            <Progress value={(13 / 90) * 100} className="h-2" />
          </div>

          <div className="border-t mt-4 pt-4">
            <Collapsible open={expandedMinutes} onOpenChange={setExpandedMinutes}>
              <CollapsibleTrigger className="flex w-full items-center justify-between hover:opacity-70 transition-opacity">
                <span className="text-sm font-medium">Request additional minutes</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    expandedMinutes ? 'rotate-180' : ''
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 space-y-2">
                  {ADDITIONAL_MINUTES_OPTIONS.map((option) => (
                    <button
                      key={option.minutes}
                      type="button"
                      className="w-full flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted transition-colors text-sm"
                    >
                      <span>~{option.minutes} min</span>
                      <span className="font-medium">${option.price} per month</span>
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        <div className="max-w-md rounded-xl border bg-card p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Recording Links</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">0</span>/30 used this month
            </div>
            <Progress value={0} className="h-2" />
          </div>

          <div className="border-t mt-4 pt-4">
            <Collapsible open={expandedLinks} onOpenChange={setExpandedLinks}>
              <CollapsibleTrigger className="flex w-full items-center justify-between hover:opacity-70 transition-opacity">
                <span className="text-sm font-medium">Request additional links</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    expandedLinks ? 'rotate-180' : ''
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 space-y-2">
                  {ADDITIONAL_MINUTES_OPTIONS.map((option) => {
                    const minRecordings = option.minutes / 3;
                    const maxRecordings = option.minutes * 2;
                    return (
                      <button
                        key={option.minutes}
                        type="button"
                        className="w-full flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted transition-colors text-sm"
                      >
                        <span>
                          {minRecordings} to {maxRecordings} recordings
                        </span>
                        <span className="font-medium">${option.price} per month</span>
                      </button>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        <div className="max-w-md rounded-xl border bg-card p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Seats</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">0</span>/15 used this month
            </div>
            <Progress value={0} className="h-2" />
          </div>

          <div className="border-t mt-4 pt-4">
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
                <div className="mt-3 space-y-3">
                  {ADDITIONAL_SEATS_OPTIONS.map((option) => {
                    const quantity = seatQuantities[option.users] || 1;
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
                            <Input
                              type="number"
                              min="1"
                              value={quantity}
                              onChange={(e) =>
                                updateSeatQuantity(option.users, parseInt(e.target.value) || 1)
                              }
                              className="h-8 w-16 text-center"
                            />
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
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
}
