import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">

        {/* BRAND */}
        <div className="footer-col brand">
          <div className="logo">Fixify+</div>
          <p>
            Your trusted marketplace for local services and community rentals.
            Find verified professionals near you with ease.
          </p>
        </div>

        {/* LINKS */}
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

        <div className="footer-col">
          <h4>Support</h4>
          <a href="#">Help Center</a>
          <a href="#">Safety Tips</a>
          <a href="#">Contact Us</a>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="footer-bottom">
        © {new Date().getFullYear()} Fixify+ • Built with ❤️ for local communities
      </div>

      {/* STYLES */}
      <style>{`
        .footer {
          margin-top: 80px;
          background: linear-gradient(135deg, #eef2ff, #fdf4ff);
          padding: 60px 20px 0;
        }

        .footer-inner {
          max-width: 1100px;
          margin: auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 30px;
        }

        .footer-col h4 {
          margin-bottom: 12px;
          font-size: 15px;
          font-weight: 700;
          color: #1f2937;
        }

        .footer-col a {
          display: block;
          text-decoration: none;
          color: #4b5563;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .footer-col a:hover {
          color: #4f46e5;
        }

        .brand .logo {
          font-size: 22px;
          font-weight: 900;
          color: #4f46e5;
          margin-bottom: 10px;
        }

        .brand p {
          font-size: 14px;
          color: #555;
          line-height: 1.6;
          max-width: 320px;
        }

        .footer-bottom {
          margin-top: 40px;
          padding: 16px;
          text-align: center;
          font-size: 13px;
          color: #6b7280;
          border-top: 1px solid rgba(0,0,0,0.08);
          background: rgba(255,255,255,0.6);
        }

        @media (max-width: 900px) {
          .footer-inner {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 520px) {
          .footer-inner {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </footer>
  );
}
