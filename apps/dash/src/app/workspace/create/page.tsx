'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { DomainUrlSchema } from '@workspace/contract';
import {
  BASE_PRICING_PLANS,
  type BasePricingPlan,
  filterPlansByCycle,
  formatPlanRate,
  PLAN_CARD_HIGHLIGHTS,
  type PlanCycle,
  USER_SELECTABLE_PLAN_IDS,
} from '@workspace/pricing';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import Logo from '@workspace/ui/components/logo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthIcons } from '@/components/auth/auth-icons';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import { URLInput } from '@/components/url-input';
import { useAccount } from '@/hooks/use-account';
import { useAuth } from '@/hooks/use-auth';
import { useCreateWorkspace } from '@/hooks/use-create-workspace';
import { useWorkspaceStore } from '@/stores/workspace';

const workspaceFormSchema = z.object({
  workspace: DomainUrlSchema,
});

type CreateWorkspaceStep = 'url' | 'plan';

export default function CreateWorkspacePage() {
  const [step, setStep] = useState<CreateWorkspaceStep>('url');
  const [workspaceUrl, setWorkspaceUrl] = useState('');
  const [createdWorkspace, setCreatedWorkspace] = useState<{
    workspaceId: string;
    workspaceName: string;
  } | null>(null);
  const [tokenCreationFailed, setTokenCreationFailed] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(workspaceFormSchema),
    mode: 'onTouched',
    defaultValues: {
      workspace: '',
    },
  });

  const router = useRouter();
  const [inviteToken] = useQueryState('token');

  const setWorkspaceStore = useWorkspaceStore((state) => state.setWorkspace);
  const { mutate: createWorkspace, isPending } = useCreateWorkspace();
  const { data: accountResult } = useAccount();
  const { signOut } = useAuth();

  const account = accountResult?.success ? accountResult.data : null;

  // Auto-trigger workspace creation if invite token is present
  useEffect(() => {
    if (inviteToken && !tokenCreationFailed && !createdWorkspace && !isPending) {
      handleCreateWithToken(inviteToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteToken]);

  const handleCreateWithToken = (token: string) => {
    createWorkspace(
      { type: 'invite', inviteToken: token },
      {
        onSuccess: (result) => {
          if (!result.success) {
            // API error - fall back to manual flow
            setTokenCreationFailed(true);
            return;
          }

          // Check if workspace was created
          if (!result.data.created) {
            // Token invalid or workspace exists - silently fall back to manual flow
            setTokenCreationFailed(true);
            return;
          }

          const { workspaceId, workspaceName } = result.data;
          if (!workspaceId || !workspaceName) {
            // Missing data - fall back to manual flow
            setTokenCreationFailed(true);
            return;
          }

          setWorkspaceStore(workspaceId);
          setCreatedWorkspace({
            workspaceId,
            workspaceName,
          });
        },
      }
    );
  };

  const handleUrlSubmit = (data: { workspace: string }) => {
    setWorkspaceUrl(data.workspace);
    setStep('plan');
  };

  const handlePlanSelect = (planId: string) => {
    createWorkspace(
      {
        type: 'manual',
        url: workspaceUrl,
        plan: planId as (typeof USER_SELECTABLE_PLAN_IDS)[number],
      },
      {
        onSuccess: (result) => {
          // Error already handled by mutation's onSuccess
          if (!result.success || !result.data.created) return;

          const { workspaceId, workspaceName } = result.data;
          if (!workspaceId || !workspaceName) return;

          setWorkspaceStore(workspaceId);
          setCreatedWorkspace({
            workspaceId,
            workspaceName,
          });
        },
      }
    );
  };

  const handleGoToWorkspace = () => {
    if (createdWorkspace) {
      router.push(`/${createdWorkspace.workspaceId}`);
    }
  };

  // Show success state after workspace is created
  if (createdWorkspace) {
    return (
      <WorkspaceCreatedSuccess
        createdWorkspace={createdWorkspace}
        onGoToWorkspace={handleGoToWorkspace}
        onConnectToIntercom={() =>
          router.push(`/${createdWorkspace.workspaceId}/settings?tab=team`)
        }
      />
    );
  }

  // Show loading state when creating workspace via invite token
  if (inviteToken && !tokenCreationFailed && isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
        <AuthIcons />

        <div className="flex flex-col items-center gap-6 w-full max-w-md relative z-10">
          <div className="flex flex-col items-center gap-3">
            <Logo />
            <h1 className="text-xl font-medium text-foreground">Creating your workspace</h1>
            <p className="text-sm text-muted-foreground text-center">
              Setting up your workspace with predetermined details
            </p>
          </div>

          <div className="w-full p-6 rounded-xl border bg-card">
            <div className="flex flex-col items-center gap-3">
              <div className="flex -space-x-2">
                <div className="h-7 w-7 animate-pulse rounded-full bg-muted border-2 border-card" />
                <div className="h-7 w-7 animate-pulse rounded-full bg-muted border-2 border-card" />
                <div className="h-7 w-7 animate-pulse rounded-full bg-muted border-2 border-card" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Setting up workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show plan selection step
  if (step === 'plan') {
    return (
      <PlanSelectionStep
        onBack={() => setStep('url')}
        onPlanSelect={handlePlanSelect}
        isPending={isPending}
      />
    );
  }

  // Show manual workspace creation form (default or fallback after token failure)
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 pb-32 lg:pb-12 bg-background overflow-hidden">
      <AuthIcons />

      {account && (
        <div className="absolute bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Not {account.userName}?</span>
            <button onClick={signOut} className="text-foreground hover:underline font-medium">
              Log out
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-xl font-medium text-foreground">Let&apos;s create your workspace</h1>
        </div>

        <form onSubmit={handleSubmit(handleUrlSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workspace">Workspace</Label>
            <p className="text-xs text-muted-foreground">Enter your company domain</p>
            <Controller
              name="workspace"
              control={control}
              render={({ field }) => (
                <URLInput
                  id="workspace"
                  placeholder="ramp.com"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={!!errors.workspace}
                  disabled={isPending}
                />
              )}
            />
            {errors.workspace && (
              <p className="text-sm text-destructive">{errors.workspace.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!isValid}
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            Continue
          </Button>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => router.push('/workspace/connect/intercom')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Connect using Intercom
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Plan highlight item
 */
function PlanHighlight({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
      <span className="text-zinc-700">{text}</span>
    </li>
  );
}

/**
 * Billing toggle component
 */
function BillingToggle({
  cycle,
  onCycleChange,
}: {
  cycle: PlanCycle;
  onCycleChange: (cycle: PlanCycle) => void;
}) {
  return (
    <div className="flex items-center justify-center">
      <div className="bg-zinc-100 rounded-full p-1 flex">
        <button
          type="button"
          onClick={() => onCycleChange('monthly')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            cycle === 'monthly'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onCycleChange('annual')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
            cycle === 'annual'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Annual
          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
            Save 20%
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * Plan card component
 */
function PlanCard({
  plan,
  highlights,
  isSelected,
  isAnnual,
  minHighlights,
  onSelect,
}: {
  plan: BasePricingPlan;
  highlights: string[];
  isSelected: boolean;
  isAnnual: boolean;
  minHighlights: number;
  onSelect: () => void;
}) {
  const { name, description, details, isPopular } = plan;
  const displayRate = formatPlanRate(plan);
  const isCustom = details.planRate === null;
  const isFree = details.planRate === 0;

  const getBillingText = () => {
    if (isCustom || isFree) return 'Billed annually';
    return isAnnual ? 'Billed annually' : 'Billed monthly';
  };

  const minHeight = minHighlights * 28 + (minHighlights - 1) * 12;

  return (
    <div
      onClick={onSelect}
      className={`flex flex-col rounded-2xl p-6 relative bg-white border transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-300 shadow-lg shadow-blue-100/50'
          : 'border-zinc-200 hover:border-zinc-300'
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xl font-semibold text-foreground">{name}</h3>
        {isPopular && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            Popular
          </span>
        )}
      </div>

      <div className="mb-2">
        {isCustom ? (
          <div className="text-4xl font-bold text-foreground">Custom</div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground">{displayRate}</span>
            {!isFree && <span className="text-muted-foreground text-sm">/month</span>}
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4">{getBillingText()}</p>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>

      <ul className="space-y-3 flex-1" style={{ minHeight: `${minHeight}px` }}>
        {highlights.map((highlight, index) => (
          <PlanHighlight key={index} text={highlight} />
        ))}
      </ul>
    </div>
  );
}

/**
 * Plan selection step
 */
function PlanSelectionStep({
  onBack,
  onPlanSelect,
  isPending,
}: {
  onBack: () => void;
  onPlanSelect: (planId: string) => void;
  isPending: boolean;
}) {
  const [billingCycle, setBillingCycle] = useState<PlanCycle>('annual');
  const [selectedPlanName, setSelectedPlanName] = useState<string>('Starter');

  // Get user-selectable plans only
  const userSelectablePlans = BASE_PRICING_PLANS.filter((plan) =>
    USER_SELECTABLE_PLAN_IDS.includes(plan.id as (typeof USER_SELECTABLE_PLAN_IDS)[number])
  );

  const plans = filterPlansByCycle(userSelectablePlans, billingCycle);

  // Get Essential, Starter, Scale Up plans
  const essential = plans.find((p) => p.name === 'Essential');
  const starter = plans.find((p) => p.name === 'Starter');
  const scaleUp = plans.find((p) => p.name === 'Scale Up');

  const plansToShow = [essential, starter, scaleUp].filter(Boolean) as BasePricingPlan[];

  const highlights = plansToShow.map((plan) => PLAN_CARD_HIGHLIGHTS[plan.name] || []);
  const maxHighlights = Math.max(...highlights.map((h) => h.length), 0);
  const isAnnual = billingCycle === 'annual';

  // Get the selected plan ID based on current billing cycle
  const selectedPlan = plansToShow.find((plan) => plan.name === selectedPlanName);
  const selectedPlanId = selectedPlan?.id;

  if (isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
        <AuthIcons />
        <div className="flex flex-col items-center gap-6 w-full max-w-md relative z-10">
          <div className="flex flex-col items-center gap-3">
            <Logo />
            <h1 className="text-xl font-medium text-foreground">Creating your workspace</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Setting up workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 pb-32 lg:pb-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-5xl space-y-8 relative z-10">
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="self-start flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex flex-col items-center gap-2 w-full">
            <Logo />
            <h1 className="text-2xl font-semibold text-foreground">Choose your plan</h1>
          </div>
        </div>

        <BillingToggle cycle={billingCycle} onCycleChange={setBillingCycle} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plansToShow.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              highlights={highlights[index] || []}
              isSelected={selectedPlanName === plan.name}
              isAnnual={isAnnual}
              minHighlights={maxHighlights}
              onSelect={() => setSelectedPlanName(plan.name)}
            />
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => selectedPlanId && onPlanSelect(selectedPlanId)}
            disabled={!selectedPlanId}
            size="lg"
            className="rounded-full px-12 py-6"
          >
            Continue to checkout
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Success screen shown after workspace creation
 */
function WorkspaceCreatedSuccess({
  createdWorkspace,
  onGoToWorkspace,
  onConnectToIntercom,
}: {
  createdWorkspace: { workspaceId: string; workspaceName: string };
  onGoToWorkspace: () => void;
  onConnectToIntercom: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
      <AuthIcons />

      <div className="flex flex-col items-center gap-6 w-full max-w-md relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-xl font-medium text-foreground">Workspace created successfully</h1>
          <p className="text-sm text-muted-foreground text-center">
            You&apos;re all set! Start capturing user feedback
          </p>
        </div>

        <WorkspaceCard workspaceName={createdWorkspace.workspaceName} />

        <div className="w-full space-y-3">
          <Button onClick={onGoToWorkspace} size="lg" className="w-full rounded-full px-7 py-6">
            Go to Workspace
          </Button>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={onConnectToIntercom}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Connect to Intercom
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Workspace card with avatars
 */
function WorkspaceCard({ workspaceName }: { workspaceName: string }) {
  // Generate consistent "member" names based on workspace name for avatars
  const avatarNames = [
    `${workspaceName}-member-1`,
    `${workspaceName}-member-2`,
    `${workspaceName}-member-3`,
  ];

  return (
    <div className="w-full p-6 rounded-xl border bg-card">
      <div className="flex flex-col items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex -space-x-2 shrink-0 cursor-default">
              {avatarNames.map((name, index) => (
                <div key={index} className="rounded-full border-2 border-card overflow-hidden">
                  <BoringAvatar name={name} size={28} />
                </div>
              ))}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <span className="text-xs">{workspaceName} workspace</span>
          </TooltipContent>
        </Tooltip>
        <span className="text-sm font-medium text-foreground text-center">{workspaceName}</span>
      </div>
    </div>
  );
}
