import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="nav">
        <Link to="/dashboard">Session Plan Automation</Link>
        <div className="nav-actions">
          {user && <span>{user.name}</span>}
          {user ? (
            <button className="btn btn-secondary" onClick={logout}>
              Logout
            </button>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
