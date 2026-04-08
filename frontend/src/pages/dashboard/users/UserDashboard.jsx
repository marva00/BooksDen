import { useMemo } from 'react';
import { FiCheckCircle, FiClock, FiPackage, FiTrendingUp, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useGetOrderByUserIdQuery } from '../../../redux/features/orders/ordersApi';
import SEO from '../../../components/SEO';

const formatCurrency = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const formatStatus = (status = '') => {
  const normalized = (status || '').toString().trim().toLowerCase();
  if (!normalized) return 'Pending';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const statusClass = (status = '') => {
  const normalized = (status || '').toString().trim().toLowerCase();
  if (normalized === 'delivered') return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  if (normalized === 'shipped') return 'bg-cyan-100 text-cyan-700 border border-cyan-200';
  if (normalized === 'processing') return 'bg-amber-100 text-amber-700 border border-amber-200';
  return 'bg-slate-100 text-slate-700 border border-slate-200';
};

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id || '';
  const { data: orders = [], isLoading, isError } = useGetOrderByUserIdQuery(userId, {
    skip: !userId,
  });

  const orderStats = useMemo(() => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, item) => sum + Number(item?.totalPrice || 0), 0);
    const deliveredCount = orders.filter((item) => (item?.status || '').toLowerCase() === 'delivered').length;
    const inProgressCount = orders.filter((item) => {
      const status = (item?.status || '').toLowerCase();
      return status === 'pending' || status === 'processing' || status === 'shipped';
    }).length;

    return {
      totalOrders,
      totalSpent,
      deliveredCount,
      inProgressCount,
    };
  }, [orders]);

  const recentOrders = useMemo(() => [...orders].slice(0, 5), [orders]);

  if (!userId) {
    return (
      <>
        <SEO
          title="My Dashboard | Booksden"
          metaDescription="View your profile, orders, and account activity in your Booksden dashboard."
          keywords="user dashboard, account center, book orders"
          canonical="/user-dashboard"
          noIndex
        />
        <section className="mx-auto max-w-screen-lg py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Login required</h2>
            <p className="mt-2 text-sm text-slate-500">Please login to view your dashboard.</p>
            <Link to="/login" className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">
              Go to Login
            </Link>
          </div>
        </section>
      </>
    );
  }

  if (isLoading) {
    return <div className="py-10 text-center text-sm text-slate-500">Loading dashboard...</div>;
  }

  if (isError) {
    return <div className="py-10 text-center text-sm text-rose-600">Could not load your dashboard right now.</div>;
  }

  return (
    <>
      <SEO
        title="My Dashboard | Booksden"
        metaDescription="View your profile, recent orders, and account activity in your Booksden dashboard."
        keywords="user dashboard, account center, order summary"
        canonical="/user-dashboard"
        noIndex
      />
      <section className="mx-auto max-w-screen-2xl py-8 sm:py-10">
        <div className="space-y-6">
        <header className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Account Center</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Welcome back, {currentUser?.username || 'Reader'}</h1>
              <p className="mt-2 text-sm text-slate-500">Manage your profile, monitor orders, and track deliveries from one place.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link to="/orders" className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
                View All Orders
              </Link>
              <Link to="/" className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                Continue Shopping
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Email</p>
              <p className="mt-1 break-all">{currentUser?.email || 'N/A'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Role</p>
              <p className="mt-1 capitalize">{currentUser?.role || 'user'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Member ID</p>
              <p className="mt-1 break-all">{currentUser?.id || '-'}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="inline-flex size-10 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
              <FiPackage className="size-5" />
            </div>
            <p className="mt-3 text-sm text-slate-500">Total Orders</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{orderStats.totalOrders}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="inline-flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <FiClock className="size-5" />
            </div>
            <p className="mt-3 text-sm text-slate-500">In Progress</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{orderStats.inProgressCount}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="inline-flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <FiCheckCircle className="size-5" />
            </div>
            <p className="mt-3 text-sm text-slate-500">Delivered</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{orderStats.deliveredCount}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="inline-flex size-10 items-center justify-center rounded-full bg-violet-100 text-violet-700">
              <FiTrendingUp className="size-5" />
            </div>
            <p className="mt-3 text-sm text-slate-500">Total Spent</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(orderStats.totalSpent)}</p>
          </article>
        </div>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">Recent Orders</h2>
            <Link to="/orders" className="text-sm font-semibold text-cyan-700 hover:text-cyan-600">
              Track all orders
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
              <div className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                <FiUser className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No orders yet</h3>
              <p className="mt-1 text-sm text-slate-500">Start exploring books and place your first order.</p>
              <Link to="/" className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                Browse Books
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order, index) => (
                <article key={order?._id || index} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Order ID</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 break-all">{order?._id}</p>
                      <p className="mt-1 text-xs text-slate-500">Placed on {new Date(order?.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(order?.status)}`}>
                        {formatStatus(order?.status)}
                      </span>
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(order?.totalPrice)}</p>
                      <Link
                        to={`/orders?track=${encodeURIComponent(order?._id || '')}`}
                        className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Track This Order
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        </div>
      </section>
    </>
  );
};

export default UserDashboard;
