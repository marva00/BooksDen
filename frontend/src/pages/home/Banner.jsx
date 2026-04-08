import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';

import bannerImg from '../../assets/banner.png';

const highlights = [
  'Fresh weekly drops from top publishers',
  'Curated picks by reader interest',
  'Fast checkout with secure payments',
];

const Banner = () => {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 px-5 py-10 text-white shadow-[0_30px_60px_-35px_rgba(15,23,42,0.9)] sm:px-8 lg:px-12 lg:py-14">
      <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-0 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />

      <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="animate-rise-in">
          <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
            Spring 2026 Reading List
          </span>

          <h1 className="mt-5 max-w-xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Discover stories that feel handpicked for your shelf.
          </h1>

          <p className="mt-5 max-w-2xl text-sm text-slate-200 sm:text-base">
            Explore premium collections, trusted bestsellers, and new arrivals across business, fiction, technology, and more.
            Built for readers who value quality, speed, and a polished shopping experience.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/#top-sellers"
              className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-amber-200"
            >
              Browse Top Sellers
              <FiArrowRight className="size-4" />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Join Booksden
            </Link>
          </div>

          <ul className="mt-8 grid gap-2 sm:grid-cols-2">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-100">
                <FiCheckCircle className="mt-0.5 size-4 shrink-0 text-cyan-200" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-rise-in animation-delay-200">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-3 backdrop-blur">
            <img
              src={bannerImg}
              alt="Featured books on Booksden"
              className="h-full w-full rounded-2xl object-cover"
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3 text-center">
              <p className="text-xl font-bold text-amber-200">20k+</p>
              <p className="mt-1 text-xs text-slate-200">Readers</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3 text-center">
              <p className="text-xl font-bold text-amber-200">4.9</p>
              <p className="mt-1 text-xs text-slate-200">User Rating</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3 text-center">
              <p className="text-xl font-bold text-amber-200">1k+</p>
              <p className="mt-1 text-xs text-slate-200">New Titles</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;