import { Link } from 'react-router-dom';
import { CapIcon } from './Icons.jsx';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <section id="about" className="footer-col footer-about">
          <p className="footer-brand">
            <CapIcon size={22} /> CourseHub
          </p>
          <p>
            CourseHub helps learners find courses in their city or online. Providers list their courses and send
            learners straight to their own websites.
          </p>
        </section>

        <nav className="footer-col" aria-label="Footer">
          <h3>Explore</h3>
          <ul>
            <li><Link to="/">Find courses</Link></li>
            <li><Link to="/login">Learner sign in</Link></li>
            <li><Link to="/register">Create learner account</Link></li>
            <li><Link to="/provider">Provider login</Link></li>
          </ul>
        </nav>

        <section id="contact" className="footer-col">
          <h3>Contact</h3>
          <ul>
         <li>Any Quires Contact Us</li>
                     <li><a href="mailto:alexanderkumark954@gmail.com">support@coursehub.example</a></li>
                     <li>Find your Carrier Best</li>
                     <li>Best Wishes From Team CourseHub</li>
          </ul>
        </section>
      </div>

      <p className="footer-bottom">© {new Date().getFullYear()} CourseHub. All rights reserved.</p>
    </footer>
  );
}
