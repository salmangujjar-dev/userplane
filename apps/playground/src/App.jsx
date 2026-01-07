import { useState, useEffect, useMemo } from 'react';
import { useUserplaneMetadata } from './hooks/useUserplaneMetadata';

// Simulated current user
const currentUser = {
  id: 'user_8kL3mN9pQ2',
  name: 'Sarah Chen',
  email: 'sarah.chen@acme.com',
  role: 'admin',
  plan: 'enterprise',
};

// Sample customer data
const customersData = [
  {
    id: 'cust_001',
    name: 'Acme Corp',
    email: 'contact@acme.com',
    status: 'active',
    revenue: '$12,450',
    lastActivity: '2 hours ago',
  },
  {
    id: 'cust_002',
    name: 'TechStart Inc',
    email: 'hello@techstart.io',
    status: 'active',
    revenue: '$8,200',
    lastActivity: '5 hours ago',
  },
  {
    id: 'cust_003',
    name: 'Global Systems',
    email: 'info@globalsys.com',
    status: 'pending',
    revenue: '$24,800',
    lastActivity: '1 day ago',
  },
  {
    id: 'cust_004',
    name: 'DataFlow Ltd',
    email: 'support@dataflow.co',
    status: 'inactive',
    revenue: '$3,100',
    lastActivity: '3 days ago',
  },
  {
    id: 'cust_005',
    name: 'CloudNine Solutions',
    email: 'team@cloudnine.dev',
    status: 'active',
    revenue: '$18,900',
    lastActivity: '30 minutes ago',
  },
  {
    id: 'cust_006',
    name: 'NextGen Labs',
    email: 'labs@nextgen.ai',
    status: 'active',
    revenue: '$45,200',
    lastActivity: '1 hour ago',
  },
];

// Stats data
const stats = [
  { label: 'Total Customers', value: '2,847', change: '+12%', positive: true },
  { label: 'Active Users', value: '1,423', change: '+8%', positive: true },
  { label: 'Revenue (MTD)', value: '$142,850', change: '+23%', positive: true },
  { label: 'Churn Rate', value: '2.4%', change: '-0.3%', positive: true },
];

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
        selectedCustomerId: selectedCustomer,
      },
      featureFlags,
    }),
    [sessionId, sessionStart, selectedCustomer, featureFlags]
  );

  // Register metadata with Userplane SDK
  useUserplaneMetadata(metadata);

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

function Header({ user }) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">UP</div>
        <h1>Userplane Demo</h1>
      </div>
      <div className="header-right">
        <div className="user-menu">
          <div className="user-avatar">{user.name.charAt(0)}</div>
          <span className="user-name">{user.name}</span>
        </div>
      </div>
    </header>
  );
}

function StatsGrid({ stats }) {
  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="stat-label">{stat.label}</div>
          <div className="stat-value">{stat.value}</div>
          <div className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
            {stat.change} from last month
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomerTable({ customers, selectedCustomer, onSelectCustomer }) {
  return (
    <div className="table-card">
      <div className="table-header">
        <h3 className="table-title">Recent Customers</h3>
        <div className="table-actions">
          <button className="btn btn-secondary">Export</button>
          <button className="btn btn-primary">Add Customer</button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Email</th>
            <th>Status</th>
            <th>Revenue</th>
            <th>Last Activity</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr
              key={customer.id}
              onClick={() => onSelectCustomer(customer.id)}
              style={{
                cursor: 'pointer',
                background: selectedCustomer === customer.id ? '#f0f9ff' : undefined,
              }}
            >
              <td>
                <strong>{customer.name}</strong>
                <br />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{customer.id}</span>
              </td>
              <td>{customer.email}</td>
              <td>
                <span className={`badge ${customer.status}`}>{customer.status}</span>
              </td>
              <td>{customer.revenue}</td>
              <td>{customer.lastActivity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetadataPanel({ metadata }) {
  return (
    <div className="metadata-panel">
      <div className="metadata-header">
        <h3 className="metadata-title">Userplane Metadata</h3>
        <span className="metadata-badge">Live Preview</span>
      </div>
      <div className="metadata-content">
        <p className="metadata-info">
          This metadata is automatically attached to recordings when submitted. Click on a customer
          row to see the <code>selectedCustomerId</code> update.
        </p>
        <pre className="metadata-preview">{JSON.stringify(metadata, null, 2)}</pre>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      Userplane React Example - Custom metadata is registered via useUserplaneMetadata hook
    </footer>
  );
}

export default App;
