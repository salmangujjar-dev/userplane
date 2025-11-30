import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { AccountSettingsSection } from './account-settings-section';
import { WorkspaceSection } from './workspace-section';

export function AccountsTab() {
  return (
    <div>
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-8">
          <AccountSettingsSection />
        </TabsContent>

        <TabsContent value="workspace" className="space-y-8">
          <WorkspaceSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
