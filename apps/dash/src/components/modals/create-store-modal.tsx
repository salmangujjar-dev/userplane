'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Cloud, ArrowLeftRight } from 'lucide-react';

type StoreProvider = 'Cloudflare' | 'AWS' | 'GCS' | 'Azure';

const PROVIDER_OPTIONS: StoreProvider[] = ['Cloudflare', 'AWS', 'GCS', 'Azure'];

const EXPIRY_OPTIONS = ['30 days', '45 days', '90 days', '180 days', '360 days'];

interface CreateStoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateStore: (store: {
    title: string;
    provider: StoreProvider;
    providerUrl: string;
    providerRegion: string;
    providerBucket: string;
    providerAccessId: string;
    providerAccessKey: string;
    recordingExpiry: string;
  }) => void;
}

export function CreateStoreModal({ open, onOpenChange, onCreateStore }: CreateStoreModalProps) {
  const [newStore, setNewStore] = useState({
    title: '',
    provider: 'AWS' as StoreProvider,
    providerUrl: '',
    providerRegion: '',
    providerBucket: '',
    providerAccessId: '',
    providerAccessKey: '',
    recordingExpiry: '90 days',
  });

  const handleCreate = () => {
    const isValid =
      newStore.title.trim() &&
      newStore.providerUrl.trim() &&
      newStore.providerRegion.trim() &&
      newStore.providerBucket.trim() &&
      newStore.providerAccessId.trim() &&
      newStore.providerAccessKey.trim();

    if (isValid) {
      onCreateStore(newStore);
      setNewStore({
        title: '',
        provider: 'AWS',
        providerUrl: '',
        providerRegion: '',
        providerBucket: '',
        providerAccessId: '',
        providerAccessKey: '',
        recordingExpiry: '90 days',
      });
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setNewStore({
      title: '',
      provider: 'AWS',
      providerUrl: '',
      providerRegion: '',
      providerBucket: '',
      providerAccessId: '',
      providerAccessKey: '',
    });
    onOpenChange(false);
  };

  const isFormValid =
    newStore.title.trim() &&
    newStore.providerUrl.trim() &&
    newStore.providerRegion.trim() &&
    newStore.providerBucket.trim() &&
    newStore.providerAccessId.trim() &&
    newStore.providerAccessKey.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-8">
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
                <svg
                  viewBox="0 0 512 512"
                  className="h-8 w-8 flex-shrink-0"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M210.09,0c10.56,0,19.12,8.56,19.12,19.12v63.74c0,10.56-8.56,19.12-19.12,19.12s-19.12-8.56-19.12-19.12V19.12C190.97,8.56,199.53,0,210.09,0z M88.22,50.22c7.47-7.47,19.57-7.47,27.04,0l44.62,44.61c7.47,7.47,7.47,19.57,0,27.04c-7.47,7.47-19.57,7.47-27.04,0L88.22,77.26C80.75,69.8,80.75,57.69,88.22,50.22z M331.97,50.22c7.47,7.47,7.47,19.57,0,27.04l-44.62,44.62c-7.47,7.47-19.57,7.47-27.04,0c-7.47-7.47-7.47-19.57,0-27.04l44.62-44.62C312.39,42.75,324.5,42.75,331.97,50.22z M38,172.09c0-10.56,8.56-19.12,19.12-19.12h63.74c10.56,0,19.12,8.56,19.12,19.12c0,10.56-8.56,19.12-19.12,19.12H57.12C46.56,191.21,38,182.65,38,172.09z M190.97,190.88c0-28.73,33.7-44.23,55.51-25.53l215.71,184.9c23.2,19.89,9.99,57.91-20.54,59.13l-97.9,3.92c-10.52,0.42-20.42,5.09-27.44,12.93l-66.66,74.5c-20.58,23-58.69,8.44-58.69-22.42V190.88z" />
                </svg>
              </div>
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
                <Cloud className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <DialogTitle className="text-xl font-semibold">Create New Store</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Configure a new storage provider for your workspace
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store-title" className="text-sm">
                Store Title
              </Label>
              <Input
                id="store-title"
                value={newStore.title}
                onChange={(e) => setNewStore((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Production Storage"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-provider" className="text-sm">
                Provider
              </Label>
              <Select
                value={newStore.provider}
                onValueChange={(value) =>
                  setNewStore((prev) => ({ ...prev, provider: value as StoreProvider }))
                }
              >
                <SelectTrigger id="store-provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      <div className="flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        {provider}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-url" className="text-sm">
                Provider URL
              </Label>
              <Input
                id="store-url"
                value={newStore.providerUrl}
                onChange={(e) => setNewStore((prev) => ({ ...prev, providerUrl: e.target.value }))}
                placeholder="e.g., s3.amazonaws.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-region" className="text-sm">
                Provider Region
              </Label>
              <Input
                id="store-region"
                value={newStore.providerRegion}
                onChange={(e) =>
                  setNewStore((prev) => ({ ...prev, providerRegion: e.target.value }))
                }
                placeholder="e.g., us-east-1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-bucket" className="text-sm">
                Provider Bucket
              </Label>
              <Input
                id="store-bucket"
                value={newStore.providerBucket}
                onChange={(e) =>
                  setNewStore((prev) => ({ ...prev, providerBucket: e.target.value }))
                }
                placeholder="e.g., my-bucket-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-access-id" className="text-sm">
                Provider Access ID
              </Label>
              <Input
                id="store-access-id"
                value={newStore.providerAccessId}
                onChange={(e) =>
                  setNewStore((prev) => ({ ...prev, providerAccessId: e.target.value }))
                }
                placeholder="Enter access ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-access-key" className="text-sm">
                Provider Access Key
              </Label>
              <Input
                id="store-access-key"
                type="password"
                value={newStore.providerAccessKey}
                onChange={(e) =>
                  setNewStore((prev) => ({ ...prev, providerAccessKey: e.target.value }))
                }
                placeholder="Enter access key"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recording-expiry" className="text-sm">
                Recording Expiry
              </Label>
              <Select
                value={newStore.recordingExpiry}
                onValueChange={(value) =>
                  setNewStore((prev) => ({ ...prev, recordingExpiry: value }))
                }
              >
                <SelectTrigger id="recording-expiry">
                  <SelectValue placeholder="Select expiry period" />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-8">
          <div className="flex gap-2 w-full justify-end">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-6"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full px-6"
              onClick={handleCreate}
              disabled={!isFormValid}
            >
              Create Store
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
