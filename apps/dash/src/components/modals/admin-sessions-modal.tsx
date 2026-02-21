'use client';

import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Skeleton } from '@workspace/ui/components/skeleton';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Loader2,
  MonitorSmartphone,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

import type { AdminUserSession } from '@/types';

import { AdminRevokeSessionModal } from './admin-revoke-session-modal';

interface AdminSessionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: AdminUserSession[];
  isLoading: boolean;
  sessionsTotal: number;
  sessionsPage: number;
  sessionsPageSize: number;
  onSessionsPageChange: (page: number) => void;
  onRevokeSession: (sessionId: string) => void;
  onRevokeAll: () => void;
  isRevoking: boolean;
  isRevokingAll: boolean;
}

function parseUserAgent(userAgent: string | null): { browser: string; os: string } {
  if (!userAgent) return { browser: 'Unknown', os: 'Unknown' };

  let browser = 'Unknown';
  let os = 'Unknown';

  // Detect browser
  if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edg')) browser = 'Edge';
  else if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';

  // Detect OS
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad'))
    os = 'iOS';

  return { browser, os };
}

function formatDate(date: Date): string {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminSessionsModal({
  open,
  onOpenChange,
  sessions,
  isLoading,
  sessionsTotal,
  sessionsPage,
  sessionsPageSize,
  onSessionsPageChange,
  onRevokeSession,
  onRevokeAll,
  isRevoking,
  isRevokingAll,
}: AdminSessionsModalProps) {
  const [sessionToRevoke, setSessionToRevoke] = useState<AdminUserSession | null>(null);
  const totalPages = Math.ceil(sessionsTotal / sessionsPageSize);

  const handleRevokeClick = (session: AdminUserSession) => {
    setSessionToRevoke(session);
  };

  const confirmRevokeSession = () => {
    if (sessionToRevoke) {
      onRevokeSession(sessionToRevoke.id);
      setSessionToRevoke(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[480px] max-h-[80vh] overflow-hidden flex flex-col"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MonitorSmartphone className="h-5 w-5" />
              Active Sessions ({sessionsTotal})
            </DialogTitle>
            <DialogDescription>Manage active sessions for this user</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }, (_, i) => `session-skeleton-${i}`).map((id) => (
                  <div key={id} className="flex items-start justify-between p-3 rounded-lg border">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No active sessions for this user</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  {sessions.map((session) => {
                    const { browser, os } = parseUserAgent(session.userAgent);
                    return (
                      <div
                        key={session.id}
                        className="flex items-start justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <MonitorSmartphone className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium">
                              {browser} on {os}
                            </span>
                            {session.impersonatedBy && (
                              <Badge variant="secondary" className="text-xs">
                                Impersonated
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {session.ipAddress && (
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {session.ipAddress}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Created {formatDate(session.createdAt)}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Expires {formatDate(session.expiresAt)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeClick(session)}
                          disabled={isRevoking || isRevokingAll}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSessionsPageChange(sessionsPage - 1)}
                      disabled={sessionsPage === 0 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Page {sessionsPage + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSessionsPageChange(sessionsPage + 1)}
                      disabled={sessionsPage >= totalPages - 1 || isLoading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {sessionsTotal > 0 && (
              <Button onClick={onRevokeAll} disabled={isRevoking || isRevokingAll}>
                {isRevokingAll ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  `Revoke All (${sessionsTotal})`
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminRevokeSessionModal
        open={!!sessionToRevoke}
        onOpenChange={(open) => !open && setSessionToRevoke(null)}
        session={
          sessionToRevoke
            ? {
                id: sessionToRevoke.id,
                ipAddress: sessionToRevoke.ipAddress,
                userAgent: sessionToRevoke.userAgent,
                expiresAt: sessionToRevoke.expiresAt,
              }
            : null
        }
        onConfirm={confirmRevokeSession}
        isPending={isRevoking}
      />
    </>
  );
}
