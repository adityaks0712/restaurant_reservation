import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand">
          <span>📋</span> Admin Panel
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Reservations
          </NavLink>
          <NavLink to="/admin/tables" className={({ isActive }) => (isActive ? 'active' : '')}>
            Tables
          </NavLink>
        </nav>
        <div className="footer-user">
          <div className="name">{user?.name}</div>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
};

export default AdminLayout;
