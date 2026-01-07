export function CustomerTable({ customers, selectedCustomer, onSelectCustomer }) {
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
