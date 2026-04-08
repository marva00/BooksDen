import React, { useMemo, useState } from 'react'
import {
  FiBox,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiPackage,
  FiShoppingBag,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/SEO';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: FiGrid, end: true },
  { to: '/dashboard/manage-books', label: 'Inventory', icon: FiPackage },
  { to: '/dashboard/add-new-book', label: 'Add Product', icon: FiBox },
  { to: '/dashboard/manage-orders', label: 'Orders', icon: FiShoppingBag },
  { to: '/dashboard/manage-users', label: 'Users', icon: FiUsers },
];

const SEO_DESCRIPTION_BY_SECTION = {
  Overview: 'Admin overview for revenue, operations, and performance metrics.',
  Inventory: 'Manage product catalog, stock levels, and storefront inventory content.',
  'Add Product': 'Create and publish new products with SEO-ready metadata and pricing.',
  Orders: 'Track fulfillment progress and update order statuses from one place.',
  Users: 'Manage user roles, customer accounts, and platform access.',
};

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const activeSection = useMemo(() => {
    const matched = navItems.find(
      (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
    );
    return matched?.label || 'Overview';
  }, [location.pathname]);

  const seoDescription =
    SEO_DESCRIPTION_BY_SECTION[activeSection] ||
    'Booksden admin workspace for managing catalog, orders, and users.';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title={`${activeSection} | Admin Dashboard | Booksden`}
        metaDescription={seoDescription}
        keywords="admin dashboard, ecommerce management, books inventory, order management"
        canonical={location.pathname}
        noIndex
      />
      {mobileOpen && (
        <button
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 !bg-black/40 !rounded-none md:hidden"
          aria-label="Close menu"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 shadow-sm flex flex-col transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-slate-900 font-bold">
              BS
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Book Store Admin</p>
              <p className="text-xs text-slate-500">Operations Console</p>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden !bg-transparent !text-slate-500 hover:!text-slate-700"
            aria-label="Close navigation"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-transparent hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto p-4 border-t border-slate-200">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Signed in as</p>
          <p className="text-sm font-medium text-slate-800 break-all">{currentUser?.username || 'admin'}</p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 !bg-slate-900 !text-white hover:!bg-slate-700"
          >
            <FiLogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur border-b border-slate-200 px-5 sm:px-8 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden !bg-transparent !text-slate-600 hover:!text-slate-900"
              aria-label="Open navigation"
            >
              <FiMenu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin Dashboard</p>
              <h1 className="text-lg font-semibold text-slate-900">{activeSection}</h1>
            </div>
          </div>

          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-slate-900">{currentUser?.username || 'Admin'}</p>
            <p className="text-xs text-slate-500 capitalize">{currentUser?.role || 'admin'}</p>
          </div>
        </header>

        <main className="px-5 py-4 sm:px-8 sm:py-6 lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout