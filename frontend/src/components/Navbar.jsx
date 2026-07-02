import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
        <span className="mark">✦</span> The Amber Table
      </Link>
      <div>
        {!user && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Create account</Link>
          </>
        )}
        {user && (
          <>
            <Link to="/">My Reservations</Link>
            <Link to="/new">Book a Table</Link>
            <span className="userchip">{user.name}</span>
            <button onClick={handleLogout}>Log out</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
