'use client';

import { Button } from '@userplane/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@userplane/ui/components/dropdown-menu';
import { ChevronRight, Loader2, MoreVertical, Pencil, Settings, Trash2 } from 'lucide-react';

import { formatDomainUrl } from '@/lib/urls';
import type { WorkspaceDomain } from '@/types';

interface DomainListItemProps {
  domain: WorkspaceDomain;
  onConfigure: (
    domainId: string,
    domainUrl: string,
    status: WorkspaceDomain['domainStatus']
  ) => void;
  onEdit: (domainId: string, domainUrl: string) => void;
  onDelete: (domainId: string, domainUrl: string) => void;
  isConfiguring: boolean;
  isDeleteDisabled: boolean;
  canDelete?: boolean;
}

/**
 * Renders a single domain item in the domain list with status indicator,
 * formatted URL, and action buttons
 */
export function DomainListItem({
  domain,
  onConfigure,
  onEdit,
  onDelete,
  isConfiguring,
  isDeleteDisabled,
  canDelete = true,
}: DomainListItemProps) {
  const isVerified = domain.domainStatus === 'verified';
  const { domain: domainPart, path, hasPath } = formatDomainUrl(domain.domainUrl);

  return (
    <div className="flex items-center justify-between p-6 rounded-xl border bg-card">
      <div className="flex items-center gap-3">
        <div
          className={`h-2 w-2 rounded-full ${isVerified ? 'bg-green-500' : 'bg-yellow-500'}`}
          aria-label={isVerified ? 'Verified' : 'Pending verification'}
        />
        <span className="text-sm">
          {hasPath ? (
            <>
              <span className="text-foreground">{domainPart}</span>
              <span className="text-muted-foreground">{path}</span>
            </>
          ) : (
            <span className="text-foreground">{domainPart}</span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          className="min-w-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 border-0"
          onClick={() => onConfigure(domain.domainId, domain.domainUrl, domain.domainStatus)}
          disabled={isConfiguring}
        >
          Configure
          {isConfiguring ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onConfigure(domain.domainId, domain.domainUrl, domain.domainStatus)}
              disabled={isConfiguring}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure Domain
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(domain.domainId, domain.domainUrl)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Domain
            </DropdownMenuItem>
            {canDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(domain.domainId, domain.domainUrl)}
                disabled={isDeleteDisabled}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Domain
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
