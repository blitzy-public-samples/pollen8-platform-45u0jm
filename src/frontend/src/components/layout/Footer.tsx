import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

// Footer component
const Footer: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <footer className={`bg-${isDark ? 'black' : 'white'} text-${isDark ? 'white' : 'black'} py-8`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FooterLinks />
          <FooterSocial />
          <FooterCopyright />
        </div>
      </div>
    </footer>
  );
};

// FooterLinks subcomponent
const FooterLinks: React.FC = () => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Important Links</h3>
      <ul className="space-y-2">
        <li><Link to="/about" className="hover:underline">About Us</Link></li>
        <li><Link to="/privacy" className="hover:underline">Privacy Policy</Link></li>
        <li><Link to="/terms" className="hover:underline">Terms of Service</Link></li>
        <li><Link to="/contact" className="hover:underline">Contact Us</Link></li>
      </ul>
    </div>
  );
};

// FooterSocial subcomponent
const FooterSocial: React.FC = () => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
      <div className="flex space-x-4">
        <a href="https://twitter.com/pollen8" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
          <img src="/icons/twitter.svg" alt="Twitter" className="w-6 h-6" loading="lazy" />
        </a>
        <a href="https://linkedin.com/company/pollen8" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <img src="/icons/linkedin.svg" alt="LinkedIn" className="w-6 h-6" loading="lazy" />
        </a>
        <a href="https://instagram.com/pollen8" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <img src="/icons/instagram.svg" alt="Instagram" className="w-6 h-6" loading="lazy" />
        </a>
      </div>
    </div>
  );
};

// FooterCopyright subcomponent
const FooterCopyright: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Legal</h3>
      <p>&copy; {currentYear} Pollen8. All rights reserved.</p>
    </div>
  );
};

export default Footer;