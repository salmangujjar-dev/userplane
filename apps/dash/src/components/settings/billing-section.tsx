'use client';

import { ADDITIONAL_SEATS_OPTIONS } from '@workspace/pricing';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { Label } from '@workspace/ui/components/label';
import { CreditCard, Loader2, Minus, MoveUpRight, Plus } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';

import { AddonChangePreviewModal } from '@/components/modals/addon-change-preview-modal';
import { useOpenCustomerPortal, useSubscriptionStatus } from '@/features/billing';
import { useAddonsStatus } from '@/features/billing/queries';
import { billingAddonModalParser, planModalParser } from '@/lib/parsers';

const SEATS_PER_PACK = 5;
const MAX_SEAT_PACKS = 5;

export function BillingSection() {
  const { data: subscriptionResult } = useSubscriptionStatus();
  const { data: addonsResult } = useAddonsStatus();
  const addonsData = addonsResult?.success ? addonsResult.data : null;

  const subscriptionData = subscriptionResult?.success ? subscriptionResult.data : null;
  const hasSubscription = subscriptionData?.contractDetail.planId !== null;

  const { mutate: openCustomerPortal, isPending: isPortalPending } = useOpenCustomerPortal();
  const [, setPlanModal] = useQueryState('plan-modal', planModalParser);
  const [, setAddonModal] = useQueryState('addon-modal', billingAddonModalParser);

  const currentQuantity = addonsData ? Math.min(addonsData.seatsQuantity, MAX_SEAT_PACKS) : 0;
  const [newSeatsQuantity, setNewSeatsQuantity] = useState(currentQuantity);
  const [accordionValue, setAccordionValue] = useState('');

  useEffect(() => {
    setNewSeatsQuantity(currentQuantity);
  }, [currentQuantity]);

  const hasChange = newSeatsQuantity !== currentQuantity;
  const packPrice = ADDITIONAL_SEATS_OPTIONS[0]!.price;

  if (!hasSubscription) return null;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Billing</h2>
        <p className="text-sm text-muted-foreground">Manage billing and payment settings</p>
      </div>
      <div className="max-w-2xl space-y-6">
        {/* Manage Billing */}
        <div className="space-y-3">
          <div>
            <Label>Manage billing</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Update payment methods and view billing history
            </p>
          </div>
          <button
            onClick={() => openCustomerPortal()}
            disabled={isPortalPending}
            className={`w-full max-w-md flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed bg-background hover:bg-muted/50 transition-colors ${
              isPortalPending
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:border-primary/50'
            }`}
          >
            {isPortalPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Manage billing</span>
              </>
            )}
          </button>
        </div>

        {/* Upgrade Plan */}
        <div className="space-y-3">
          <div>
            <Label>Upgrade plan</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Change or upgrade your current subscription plan
            </p>
          </div>
          <button
            onClick={() => setPlanModal('suggested')}
            className="w-full max-w-md flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed bg-background hover:bg-muted/50 transition-colors cursor-pointer hover:border-primary/50"
          >
            <MoveUpRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Upgrade plan</span>
          </button>
        </div>

        {/* Billing Add-ons Section */}
        <div className="space-y-3">
          <div>
            <Label>Billing add-ons</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Manage seat add-on packs for your active subscription.
            </p>
          </div>
          <Accordion
            type="single"
            collapsible
            className="max-w-md"
            value={accordionValue}
            onValueChange={setAccordionValue}
          >
            <AccordionItem value="seats" className="border rounded-lg overflow-hidden px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Seat packs</span>
                  <span className="text-xs text-muted-foreground">
                    {currentQuantity} {currentQuantity === 1 ? 'pack' : 'packs'} ·{' '}
                    {currentQuantity * SEATS_PER_PACK} add-on seats
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pb-1">
                  <p className="text-xs text-muted-foreground">
                    ${packPrice}/pack · {SEATS_PER_PACK} seats each
                  </p>

                  {/* Stepper */}
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={() => setNewSeatsQuantity((prev) => Math.max(0, prev - 1))}
                      disabled={newSeatsQuantity <= 0}
                      className="h-10 w-10 rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="text-3xl font-bold tabular-nums w-8 text-center">
                      {newSeatsQuantity}
                    </span>
                    <button
                      onClick={() =>
                        setNewSeatsQuantity((prev) => Math.min(MAX_SEAT_PACKS, prev + 1))
                      }
                      disabled={newSeatsQuantity >= MAX_SEAT_PACKS}
                      className="h-10 w-10 rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Save / Cancel — always reserve space to prevent layout shift */}
                  <div
                    className={`flex gap-2 pt-2 transition-opacity ${hasChange ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  >
                    <button
                      onClick={() => {
                        setAddonModal('seats');
                        setAccordionValue('');
                      }}
                      className="flex-1 px-4 py-2 text-sm font-medium rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setNewSeatsQuantity(currentQuantity)}
                      className="flex-1 px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-accent transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <AddonChangePreviewModal requestedQuantity={newSeatsQuantity} />
    </div>
  );
}
