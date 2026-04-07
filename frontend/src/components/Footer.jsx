import React from 'react'
import footerLogo  from "../assets/footer-logo.png"

import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa"
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-[#1f1638] via-[#241a46] to-[#1d1538] text-white py-12 px-4 mt-10">
      {/* Top Section */}
      <div className="max-w-screen-2xl mx-auto grid md:grid-cols-2 gap-10 items-start">
        {/* Left Side - Logo and Nav */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img src={footerLogo} alt="Logo" className="w-10 h-10 rounded-md" />
            <h3 className="text-2xl font-bold tracking-wide">BOOKSDEN</h3>
          </div>
          <p className="text-sm text-violet-100 mb-5 max-w-md">
            Discover your next favorite book with curated collections, trending picks, and a seamless shopping experience.
          </p>
          <ul className="flex flex-wrap gap-5 text-sm text-violet-100">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li><Link to="/orders" className="hover:text-white">Orders</Link></li>
            <li><Link to="/favorites" className="hover:text-white">Wishlist</Link></li>
            <li><Link to="/cart" className="hover:text-white">Cart</Link></li>
          </ul>
        </div>

        {/* Right Side - Newsletter */}
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-sm">
          <p className="mb-4 text-violet-100">
            Subscribe to our newsletter to receive the latest updates, news, and offers!
          </p>
          <div className="flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-2 rounded-l-md text-black focus:outline-none"
            />
            <button className="bg-violet-600 px-6 py-2 rounded-r-md hover:bg-violet-700 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center mt-10 border-t border-white/20 pt-6">
        {/* Left Side - Privacy Links */}
        <ul className="flex gap-6 mb-4 md:mb-0 text-sm text-violet-100">
          <li><a href="#privacy" className="hover:text-white">Privacy Policy</a></li>
          <li><a href="#terms" className="hover:text-white">Terms of Service</a></li>
        </ul>

        {/* Right Side - Social Icons */}
        <div className="flex gap-4">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <FaFacebook size={24} />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <FaTwitter size={24} />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <FaInstagram size={24} />
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer