'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Database, X, Cloud } from 'lucide-react';

type StoreProvider = 'Cloudflare' | 'AWS' | 'GCS' | 'Azure';

interface Store {
  id: number;
  title: string;
  provider: StoreProvider;
  providerUrl: string;
  providerRegion: string;
  providerBucket: string;
  providerAccessId: string;
  providerAccessKey: string;
  isDefault: boolean;
}

const STORES: Store[] = [
  {
    id: 1,
    title: 'Production Storage',
    provider: 'AWS',
    providerUrl: 's3.amazonaws.com',
    providerRegion: 'us-east-1',
    providerBucket: 'prod-bucket',
    providerAccessId: 'AKIA...',
    providerAccessKey: '********',
    isDefault: true,
  },
  {
    id: 2,
    title: 'Development Storage',
    provider: 'GCS',
    providerUrl: 'storage.googleapis.com',
    providerRegion: 'us-central1',
    providerBucket: 'dev-bucket',
    providerAccessId: 'dev-access-id',
    providerAccessKey: '********',
    isDefault: false,
  },
];

const PROVIDER_OPTIONS: StoreProvider[] = ['Cloudflare', 'AWS', 'GCS', 'Azure'];

export function StoreSection() {
  const [stores, setStores] = useState<Store[]>(STORES);
  const [showAddStore, setShowAddStore] = useState(false);
  const [newStore, setNewStore] = useState({
    title: '',
    provider: 'AWS' as StoreProvider,
    providerUrl: '',
    providerRegion: '',
    providerBucket: '',
    providerAccessId: '',
    providerAccessKey: '',
  });

  const handleAddStore = () => {
    const isValid =
      newStore.title.trim() &&
      newStore.providerUrl.trim() &&
      newStore.providerRegion.trim() &&
      newStore.providerBucket.trim() &&
      newStore.providerAccessId.trim() &&
      newStore.providerAccessKey.trim();

    if (isValid) {
      const store: Store = {
        id: Math.max(...stores.map((s) => s.id), 0) + 1,
        title: newStore.title,
        provider: newStore.provider,
        providerUrl: newStore.providerUrl,
        providerRegion: newStore.providerRegion,
        providerBucket: newStore.providerBucket,
        providerAccessId: newStore.providerAccessId,
        providerAccessKey: newStore.providerAccessKey,
        isDefault: false,
      };
      setStores((prev) => [...prev, store]);
      setNewStore({
        title: '',
        provider: 'AWS',
        providerUrl: '',
        providerRegion: '',
        providerBucket: '',
        providerAccessId: '',
        providerAccessKey: '',
      });
      setShowAddStore(false);
    }
  };

  const handleCancelAdd = () => {
    setNewStore({
      title: '',
      provider: 'AWS',
      providerUrl: '',
      providerRegion: '',
      providerBucket: '',
      providerAccessId: '',
      providerAccessKey: '',
    });
    setShowAddStore(false);
  };

  const handleDeleteStore = (storeId: number) => {
    setStores((prev) => prev.filter((store) => store.id !== storeId));
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Stores</h2>
        <p className="text-sm text-muted-foreground">Manage storage configurations</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {stores.map((store) => (
          <div
            key={store.id}
            className="flex items-center justify-between p-4 rounded-xl border bg-card"
          >
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{store.title}</span>
                  {store.isDefault && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Cloud className="h-3.5 w-3.5" />
                  <span>{store.provider}</span>
                  <span>•</span>
                  <span>{store.providerRegion}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {showAddStore ? (
          <div className="p-4 rounded-xl border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Add New Store</h3>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleCancelAdd}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-store-title" className="text-sm">
                Store Title
              </Label>
              <Input
                id="new-store-title"
                value={newStore.title}
                onChange={(e) => setNewStore((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Production Storage"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-store-provider" className="text-sm">
                Provider
              </Label>
              <Select
                value={newStore.provider}
                onValueChange={(value) =>
                  setNewStore((prev) => ({ ...prev, provider: value as StoreProvider }))
                }
              >
                <SelectTrigger id="new-store-provider">
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
              <Label htmlFor="new-store-url" className="text-sm">
                Provider URL
              </Label>
              <Input
                id="new-store-url"
                value={newStore.providerUrl}
                onChange={(e) => setNewStore((prev) => ({ ...prev, providerUrl: e.target.value }))}
                placeholder="e.g., s3.amazonaws.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-store-region" className="text-sm">
                Provider Region
              </Label>
              <Input
                id="new-store-region"
                value={newStore.providerRegion}
                onChange={(e) =>
                  setNewStore((prev) => ({ ...prev, providerRegion: e.target.value }))
                }
                placeholder="e.g., us-east-1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-store-bucket" className="text-sm">
                Provider Bucket
              </Label>
              <Input
                id="new-store-bucket"
                value={newStore.providerBucket}
                onChange={(e) =>
                  setNewStore((prev) => ({ ...prev, providerBucket: e.target.value }))
                }
                placeholder="e.g., my-bucket-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-store-access-id" className="text-sm">
                Provider Access ID
              </Label>
              <Input
                id="new-store-access-id"
                value={newStore.providerAccessId}
                onChange={(e) =>
                  setNewStore((prev) => ({ ...prev, providerAccessId: e.target.value }))
                }
                placeholder="Enter access ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-store-access-key" className="text-sm">
                Provider Access Key
              </Label>
              <Input
                id="new-store-access-key"
                type="password"
                value={newStore.providerAccessKey}
                onChange={(e) =>
                  setNewStore((prev) => ({ ...prev, providerAccessKey: e.target.value }))
                }
                placeholder="Enter access key"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleAddStore}
                disabled={
                  !newStore.title.trim() ||
                  !newStore.providerUrl.trim() ||
                  !newStore.providerRegion.trim() ||
                  !newStore.providerBucket.trim() ||
                  !newStore.providerAccessId.trim() ||
                  !newStore.providerAccessKey.trim()
                }
              >
                Add Store
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelAdd}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full max-w-2xl"
            onClick={() => setShowAddStore(true)}
          >
            Add New Store
          </Button>
        )}
      </div>
    </div>
  );
}
