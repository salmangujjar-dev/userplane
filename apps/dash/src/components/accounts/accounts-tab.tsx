import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { AccountSettingsSection } from './account-settings-section';
import { WorkspaceSection } from './workspace-section';

export function AccountsTab() {
  return (
    <div>
      <Tabs defaultValue="workspace" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace" className="space-y-8">
          <WorkspaceSection />
        </TabsContent>

        <TabsContent value="account" className="space-y-8">
          <AccountSettingsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
