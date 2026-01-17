import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.grid}>

        {/* Brand */}
        <div>
          <h2 style={styles.logo}>Fixify+</h2>
          <p style={styles.text}>
            Connecting communities with trusted local services and rentals.
            Quality, reliability, and trust.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={styles.heading}>Quick Links</h4>
          <Link style={styles.link} to="/">Home</Link>
          <Link style={styles.link} to="/post">Post Listing</Link>
          <Link style={styles.link} to="/login">Login</Link>
          <Link style={styles.link} to="/register">Register</Link>
        </div>

        {/* Popular Services */}
        <div>
          <h4 style={styles.heading}>Popular Services</h4>
          <p style={styles.text}>Plumbing</p>
          <p style={styles.text}>Electrical</p>
          <p style={styles.text}>Cleaning</p>
          <p style={styles.text}>Carpentry</p>
        </div>

        {/* Newsletter */}
        <div>
          <h4 style={styles.heading}>Stay Updated</h4>
          <p style={styles.text}>Subscribe for latest updates.</p>
          <input
            placeholder="Your email"
            style={styles.input}
          />
        </div>

      </div>

      <div style={styles.bottom}>
        © {new Date().getFullYear()} Fixify+. All rights reserved.
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    background: '#0f172a',
    color: '#e5e7eb',
    padding: '40px 24px 20px',
    marginTop: '60px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '24px',
    maxWidth: '1100px',
    margin: '0 auto'
  },
  logo: {
    marginBottom: 8
  },
  heading: {
    marginBottom: 10
  },
  text: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 6
  },
  link: {
    display: 'block',
    color: '#e5e7eb',
    textDecoration: 'none',
    marginBottom: 6,
    fontSize: 14
  },
  input: {
    padding: '8px 10px',
    borderRadius: 6,
    border: 'none',
    width: '100%'
  },
  bottom: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 13,
    color: '#94a3b8'
  }
};
