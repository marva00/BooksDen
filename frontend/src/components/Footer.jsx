import React from 'react';
import footerLogo from '../assets/footer-logo.png';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Top Sellers', to: '/#top-sellers' },
  { label: 'Recommended', to: '/#recommended' },
  { label: 'Book News', to: '/#book-news' },
];

const accountLinks = [
  { label: 'Orders', to: '/orders' },
  { label: 'Wishlist', to: '/favorites' },
  { label: 'Cart', to: '/cart' },
  { label: 'Checkout', to: '/checkout' },
];

const supportLinks = [
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'Terms of Service', href: '#terms' },
  { label: 'Customer Support', href: '#support' },
  { label: 'Shipping & Returns', href: '#shipping' },
];

const socialLinks = [
  { name: 'Facebook', href: 'https://facebook.com', icon: FaFacebook },
  { name: 'Twitter', href: 'https://twitter.com', icon: FaTwitter },
  { name: 'Instagram', href: 'https://instagram.com', icon: FaInstagram },
  { name: 'LinkedIn', href: 'https://linkedin.com', icon: FaLinkedin },
];

const Footer = () => {
  return (
    <footer className="mt-14 border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-screen-2xl px-12 py-12 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
          <section>
            <div className="flex items-center gap-3">
              <img src={footerLogo} alt="Booksden logo" className="h-11 w-11 rounded-lg object-cover" />
              <h3 className="text-2xl font-black tracking-[0.16em] text-white">BOOKSDEN</h3>
            </div>

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
              Your modern destination for discovering meaningful reads, trusted bestsellers, and beautifully curated
              collections for every reader.
            </p>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Newsletter</p>
              <p className="mt-2 text-sm text-slate-300">Get weekly new arrivals, editor picks, and special offers.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 placeholder:text-slate-500"
                />
                <button type="button" className="!bg-cyan-500 hover:!bg-cyan-400 rounded-xl px-4 py-2 text-sm font-bold text-slate-900">
                  Subscribe
                </button>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-white">Browse</h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="transition hover:text-cyan-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-white">My Account</h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {accountLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="transition hover:text-cyan-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-white">Support</h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {supportLinks.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="transition hover:text-cyan-300">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-slate-400">Email: support@booksden.com</p>
            <p className="mt-1 text-xs text-slate-400">Phone: +92 300 000 0000</p>
          </section>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} Booksden. All rights reserved.</p>

          <div className="flex items-center gap-2">
            {socialLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.name}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
                >
                  <Icon size={16} />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;