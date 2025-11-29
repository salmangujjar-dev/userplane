'use client';

import { useState } from 'react';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';

const EXPIRY_OPTIONS = ['30 days', '45 days', '90 days', '180 days', '360 days'];

export function DataSection() {
  const [hideSensitiveFields, setHideSensitiveFields] = useState(false);
  const [recordingExpiry, setRecordingExpiry] = useState('90 days');

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Data</h2>
        <p className="text-sm text-muted-foreground">Manage your data and Privacy</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
          <Label htmlFor="hide-sensitive" className="text-sm font-medium cursor-pointer">
            Hide sensitive fields
          </Label>
          <Switch
            id="hide-sensitive"
            checked={hideSensitiveFields}
            onCheckedChange={setHideSensitiveFields}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recording-expiry" className="text-sm font-medium">
            Recording expiry
          </Label>
          <Select value={recordingExpiry} onValueChange={setRecordingExpiry}>
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
  );
}
