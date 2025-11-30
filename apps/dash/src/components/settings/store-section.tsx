'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Database, Cloud, MoreVertical, Trash2, CheckCircle2 } from 'lucide-react';
import { CreateStoreModal } from '@/components/modals/create-store-modal';

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
  recordingExpiry: string;
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
    recordingExpiry: '90 days',
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
    recordingExpiry: '180 days',
    isDefault: false,
  },
];

export function StoreSection() {
  const [stores, setStores] = useState<Store[]>(STORES);
  const [showModal, setShowModal] = useState(false);

  const handleCreateStore = (newStore: {
    title: string;
    provider: StoreProvider;
    providerUrl: string;
    providerRegion: string;
    providerBucket: string;
    providerAccessId: string;
    providerAccessKey: string;
    recordingExpiry: string;
  }) => {
    const store: Store = {
      id: Math.max(...stores.map((s) => s.id), 0) + 1,
      title: newStore.title,
      provider: newStore.provider,
      providerUrl: newStore.providerUrl,
      providerRegion: newStore.providerRegion,
      providerBucket: newStore.providerBucket,
      providerAccessId: newStore.providerAccessId,
      providerAccessKey: newStore.providerAccessKey,
      recordingExpiry: newStore.recordingExpiry,
      isDefault: false,
    };
    setStores((prev) => [...prev, store]);
  };

  const handleSetDefault = (storeId: number) => {
    setStores((prev) =>
      prev.map((store) => ({
        ...store,
        isDefault: store.id === storeId,
      }))
    );
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
                  <span>•</span>
                  <span>{store.recordingExpiry}</span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSetDefault(store.id)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Set as default
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteStore(store.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete store
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        <Button variant="outline" className="w-full max-w-2xl" onClick={() => setShowModal(true)}>
          Add New Store
        </Button>
      </div>

      <CreateStoreModal
        open={showModal}
        onOpenChange={setShowModal}
        onCreateStore={handleCreateStore}
      />
    </div>
  );
}
