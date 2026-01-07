import { useState, useMemo, useEffect } from 'react';
import { userplane } from '@workspace/sdk';
import { Header } from './components/Header';
import { StatsGrid } from './components/StatsGrid';
import { CustomerTable } from './components/CustomerTable';
import { MetadataPanel } from './components/MetadataPanel';
import { Footer } from './components/Footer';
import currentUser from './data/currentUser.json';
import customersData from './data/customersData.json';
import stats from './data/stats.json';
import organizationMeta from './data/organizationMeta.json';

function App() {
  const [sessionId] = useState(() => 'ses_' + Math.random().toString(36).substring(2, 15));
  const [sessionStart] = useState(() => new Date().toISOString());
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [featureFlags] = useState(['dark_mode', 'beta_dashboard', 'ai_insights']);

  // Build metadata object
  const metadata = useMemo(
    () => ({
      user: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        plan: currentUser.plan,
      },
      app: {
        version: '2.4.1',
        environment: 'staging',
        framework: 'react',
      },
      session: {
        id: sessionId,
        startedAt: sessionStart,
      },
      context: {
        page: 'customers',
      },
      featureFlags,
      organizationMeta,
    }),
    [sessionId, sessionStart, featureFlags]
  );

  // Register metadata with Userplane SDK
  useEffect(() => {
    userplane.metadata(() => metadata);
  }, [metadata]);

  return (
    <div className="app">
      <Header user={currentUser} />

      <main className="main">
        <div className="page-header">
          <h2 className="page-title">Customer Dashboard</h2>
          <p className="page-subtitle">Manage your customer accounts and track performance</p>
        </div>

        <StatsGrid stats={stats} />

        <CustomerTable
          customers={customersData}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
        />

        <MetadataPanel metadata={metadata} />
      </main>

      <Footer />
    </div>
  );
}

export default App;
