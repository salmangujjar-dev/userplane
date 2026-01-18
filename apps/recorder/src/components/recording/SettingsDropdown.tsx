/**
 * Settings Dropdown
 * Provides user controls for recording settings like privacy blur
 * Only visible in embedded mode where cross-tab features work
 */

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Switch } from '@workspace/ui/components/switch';
import { EyeOff, Settings2 } from 'lucide-react';

interface SettingsDropdownProps {
  /** Whether blur is currently enabled */
  isBlurEnabled: boolean;
  /** Callback when blur toggle changes */
  onBlurToggle: (enabled: boolean) => void;
  /** Whether the toggle is disabled (e.g., during recording) */
  disabled?: boolean;
}

export default function SettingsDropdown({
  isBlurEnabled,
  onBlurToggle,
  disabled = false,
}: SettingsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
          aria-label="Recording settings"
        >
          <Settings2 className="w-5 h-5 text-gray-600" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem
          className="flex items-center justify-between gap-3 cursor-pointer focus:bg-gray-50"
          onSelect={(e) => {
            // Prevent dropdown from closing when clicking the switch
            e.preventDefault();
            if (!disabled) {
              onBlurToggle(!isBlurEnabled);
            }
          }}
        >
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-gray-500" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Hide sensitive content</span>
              <span className="text-xs text-gray-500">
                Blur sensitive on-screen content during recording
              </span>
            </div>
          </div>
          <Switch
            checked={isBlurEnabled}
            onCheckedChange={onBlurToggle}
            disabled={disabled}
            aria-label="Toggle hide sensitive information"
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
