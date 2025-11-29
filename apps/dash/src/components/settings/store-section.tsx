'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Database, ChevronDown, X, Cloud } from 'lucide-react';

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
  const [expandedStore, setExpandedStore] = useState<number | null>(null);
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

  const handleToggleStore = (storeId: number) => {
    setExpandedStore(expandedStore === storeId ? null : storeId);
  };

  const handleUpdateStore = (
    storeId: number,
    field: keyof Store,
    value: string | boolean | StoreProvider
  ) => {
    setStores((prev) =>
      prev.map((store) =>
        store.id === storeId
          ? { ...store, [field]: value }
          : field === 'isDefault' && value === true
            ? { ...store, isDefault: false }
            : store
      )
    );
  };

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
    if (expandedStore === storeId) {
      setExpandedStore(null);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Stores</h2>
        <p className="text-sm text-muted-foreground">Manage storage configurations</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {stores.map((store) => (
          <Collapsible
            key={store.id}
            open={expandedStore === store.id}
            onOpenChange={() => handleToggleStore(store.id)}
          >
            <div className="rounded-xl border bg-card">
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-xl">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{store.title}</span>
                  {store.isDefault && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Default
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    expandedStore === store.id ? 'rotate-180' : ''
                  }`}
                />
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border-t p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`title-${store.id}`} className="text-sm">
                      Store Title
                    </Label>
                    <Input
                      id={`title-${store.id}`}
                      value={store.title}
                      onChange={(e) => handleUpdateStore(store.id, 'title', e.target.value)}
                      placeholder="Enter store title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`provider-${store.id}`} className="text-sm">
                      Provider
                    </Label>
                    <Select
                      value={store.provider}
                      onValueChange={(value) =>
                        handleUpdateStore(store.id, 'provider', value as StoreProvider)
                      }
                    >
                      <SelectTrigger id={`provider-${store.id}`}>
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
                    <Label htmlFor={`url-${store.id}`} className="text-sm">
                      Provider URL
                    </Label>
                    <Input
                      id={`url-${store.id}`}
                      value={store.providerUrl}
                      onChange={(e) => handleUpdateStore(store.id, 'providerUrl', e.target.value)}
                      placeholder="e.g., s3.amazonaws.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`region-${store.id}`} className="text-sm">
                      Provider Region
                    </Label>
                    <Input
                      id={`region-${store.id}`}
                      value={store.providerRegion}
                      onChange={(e) =>
                        handleUpdateStore(store.id, 'providerRegion', e.target.value)
                      }
                      placeholder="e.g., us-east-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`bucket-${store.id}`} className="text-sm">
                      Provider Bucket
                    </Label>
                    <Input
                      id={`bucket-${store.id}`}
                      value={store.providerBucket}
                      onChange={(e) =>
                        handleUpdateStore(store.id, 'providerBucket', e.target.value)
                      }
                      placeholder="e.g., my-bucket-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`access-id-${store.id}`} className="text-sm">
                      Provider Access ID
                    </Label>
                    <Input
                      id={`access-id-${store.id}`}
                      value={store.providerAccessId}
                      onChange={(e) =>
                        handleUpdateStore(store.id, 'providerAccessId', e.target.value)
                      }
                      placeholder="Enter access ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`access-key-${store.id}`} className="text-sm">
                      Provider Access Key
                    </Label>
                    <Input
                      id={`access-key-${store.id}`}
                      type="password"
                      value={store.providerAccessKey}
                      onChange={(e) =>
                        handleUpdateStore(store.id, 'providerAccessKey', e.target.value)
                      }
                      placeholder="Enter access key"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
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
