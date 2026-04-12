import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col">
          <div className="brand-title">Fixify+</div>
          <p className="muted">
            Marketplace for trusted services and rentals. Built for fast local discovery and direct lead conversion.
          </p>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <Link to="/">Home</Link>
          <Link to="/post">Post Listing</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>

        <div className="footer-col">
          <h4>Account</h4>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} Fixify+ · Designed for production-grade local operations.
      </div>
    </footer>
  );
}
