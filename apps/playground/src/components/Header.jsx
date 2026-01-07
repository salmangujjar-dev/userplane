export function Header({ user }) {
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
