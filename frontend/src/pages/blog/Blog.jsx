import React from 'react';
import { Link } from 'react-router-dom';
import { FiBarChart2, FiBookOpen, FiSearch, FiShield, FiShoppingCart, FiTag } from 'react-icons/fi';
import SEO from '../../components/SEO';
import bannerImage from '../../assets/banner.png';

const highlights = [
  {
    icon: FiSearch,
    title: 'Smart Book Discovery',
    text: 'BooksDen helps readers explore books through search, categories, top sellers, recommendations, and product pages with useful book details.',
  },
  {
    icon: FiShoppingCart,
    title: 'Smooth Shopping Flow',
    text: 'The storefront includes cart, wishlist, checkout, order success, and user order tracking flows for a complete online bookstore experience.',
  },
  {
    icon: FiShield,
    title: 'Secure Admin Dashboard',
    text: 'Admins can manage books, orders, users, inventory, and sales analytics through protected dashboard routes.',
  },
  {
    icon: FiTag,
    title: 'AI SEO And Pricing Tools',
    text: 'The admin product workflow supports AI-generated SEO tags and promotional price forecasting before publishing a new book.',
  },
];

const Blog = () => {
  return (
    <article className="space-y-10 pb-8">
      <SEO
        title="About BooksDen Blog | Online Bookstore Project"
        metaDescription="Read about BooksDen, a modern online bookstore website with book discovery, cart, checkout, admin dashboard, AI SEO tools, and sales analytics."
        keywords="BooksDen blog, online bookstore project, MERN bookstore, book store admin dashboard, AI SEO bookstore"
        canonical="/blog"
      />

      <section className="grid items-center gap-8 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <div>
          <p className="inline-flex rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">
            Project Blog
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
            Building BooksDen: A Modern Online Bookstore Experience
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            BooksDen is an online bookstore designed to make book discovery, shopping, and store management easier.
            The project combines a reader-friendly storefront with an admin dashboard for managing products, orders,
            SEO, promotional pricing, and sales performance.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
              Visit Storefront
            </Link>
            <Link
              to="/admin"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              Admin Login
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <img src={bannerImage} alt="BooksDen featured books display" className="h-full min-h-72 w-full object-cover" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-950">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
            <FiBookOpen className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Why This Website Matters</p>
            <h2 className="text-2xl font-black text-slate-950">A complete bookstore system for readers and admins</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-5 text-sm leading-7 text-slate-600 lg:grid-cols-2">
          <p>
            For customers, BooksDen focuses on a clean shopping journey. Readers can browse featured books, search by
            title or genre, add books to the cart, save favorites, and complete checkout with a clear order flow.
          </p>
          <p>
            For administrators, the dashboard turns store management into a more practical workflow. The admin can add
            products, review AI-generated SEO metadata, manage inventory, monitor sales analytics, and use a promotional
            scenario engine while setting prices for new books.
          </p>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-300">
              <FiBarChart2 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-[0.16em]">Admin Intelligence</span>
            </div>
            <h2 className="mt-2 text-2xl font-black">BooksDen is built as more than a catalog.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              The dashboard adds sales analytics, seasonal insights, top-selling products, category performance, and
              AI-assisted SEO so the store can be managed with data instead of guesswork.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="shrink-0 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            View Dashboard
          </Link>
        </div>
      </section>
    </article>
  );
};

export default Blog;
