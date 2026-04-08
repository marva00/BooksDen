import { useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiClock, FiPackage, FiSearch, FiTruck } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { useGetOrderByUserIdQuery, useGetOrderTrackingQuery } from '../../redux/features/orders/ordersApi';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/SEO';

const formatCurrency = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const formatStatus = (status = '') => {
  const value = (status || '').toString().trim().toLowerCase();
  if (!value) return 'Pending';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const statusStyle = (status = '') => {
  const value = (status || '').toString().toLowerCase();
  if (value === 'delivered') return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  if (value === 'shipped') return 'bg-cyan-100 text-cyan-700 border border-cyan-200';
  if (value === 'processing') return 'bg-amber-100 text-amber-700 border border-amber-200';
  return 'bg-slate-100 text-slate-700 border border-slate-200';
};

const timelineMeta = {
  pending: {
    label: 'Pending',
    icon: FiClock,
  },
  processing: {
    label: 'Processing',
    icon: FiPackage,
  },
  shipped: {
    label: 'Shipped',
    icon: FiTruck,
  },
  delivered: {
    label: 'Delivered',
    icon: FiCheckCircle,
  },
};

const OrderPage = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  const trackFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get('track') || '').trim();
  }, [location.search]);

  const [selectedOrderId, setSelectedOrderId] = useState(trackFromQuery);
  const [trackingInput, setTrackingInput] = useState(trackFromQuery);

  const userId = currentUser?.id || '';
  const { data: orders = [], isLoading, isError } = useGetOrderByUserIdQuery(userId, {
    skip: !userId,
  });

  useEffect(() => {
    if (trackFromQuery) {
      setSelectedOrderId(trackFromQuery);
      setTrackingInput(trackFromQuery);
      return;
    }

    if (!selectedOrderId && orders.length > 0) {
      const firstOrderId = orders[0]?._id || '';
      setSelectedOrderId(firstOrderId);
      setTrackingInput(firstOrderId);
    }
  }, [orders, selectedOrderId, trackFromQuery]);

  const {
    data: trackingData,
    isFetching: isTrackingLoading,
    isError: isTrackingError,
  } = useGetOrderTrackingQuery(selectedOrderId, {
    skip: !selectedOrderId,
  });

  const trackedOrder = useMemo(
    () => orders.find((order) => String(order?._id) === String(selectedOrderId)) || null,
    [orders, selectedOrderId]
  );

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingCount = orders.filter((order) => {
      const status = (order?.status || '').toLowerCase();
      return status === 'pending' || status === 'processing';
    }).length;
    const shippedCount = orders.filter((order) => (order?.status || '').toLowerCase() === 'shipped').length;
    const deliveredCount = orders.filter((order) => (order?.status || '').toLowerCase() === 'delivered').length;

    return {
      totalOrders,
      pendingCount,
      shippedCount,
      deliveredCount,
    };
  }, [orders]);

  const handleTrackSubmit = (event) => {
    event.preventDefault();
    const nextOrderId = trackingInput.trim();
    if (!nextOrderId) return;
    setSelectedOrderId(nextOrderId);
  };

  if (!userId) {
    return (
      <>
        <SEO
          title="Orders | Booksden"
          metaDescription="Track your Booksden order status, delivery timeline, and purchase history."
          keywords="book orders, order tracking, delivery status"
          canonical="/orders"
          noIndex
        />
        <section className="mx-auto max-w-screen-lg py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Login required</h2>
            <p className="mt-2 text-sm text-slate-500">Please login to view and track your orders.</p>
            <Link to="/login" className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">
              Go to Login
            </Link>
          </div>
        </section>
      </>
    );
  }

  if (isLoading) return <div className="py-10 text-center text-sm text-slate-500">Loading your orders...</div>;
  if (isError) return <div className="py-10 text-center text-sm text-rose-600">Error fetching your orders.</div>;

  return (
    <>
      <SEO
        title="Orders | Booksden"
        metaDescription="Track your Booksden order status, delivery timeline, and purchase history."
        keywords="book orders, order tracking, delivery status"
        canonical="/orders"
        noIndex
      />
      <section className="mx-auto max-w-screen-2xl py-8 sm:py-10">
        <div className="space-y-6">
        <header className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Order Center</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Your Orders and Tracking</h1>
          <p className="mt-2 text-sm text-slate-500">Track delivery progress, review past purchases, and monitor status updates.</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Total Orders</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalOrders}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Pending</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.pendingCount}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Shipped</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.shippedCount}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Delivered</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.deliveredCount}</p>
            </article>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] sm:p-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Order History</h2>
              <p className="text-sm text-slate-500">{orders.length} order(s)</p>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                <h3 className="text-lg font-semibold text-slate-900">No orders found</h3>
                <p className="mt-1 text-sm text-slate-500">Once you place orders, they will appear here.</p>
                <Link to="/" className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                  Browse Books
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order, index) => {
                  const itemCount = (order?.items || []).reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
                  return (
                    <article key={order?._id || index} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Order ID</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 break-all">{order?._id}</p>
                          <p className="mt-1 text-xs text-slate-500">Placed on {new Date(order?.createdAt).toLocaleString()}</p>
                        </div>

                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(order?.status)}`}>
                            {formatStatus(order?.status)}
                          </span>
                          <p className="text-sm font-bold text-slate-900">{formatCurrency(order?.totalPrice)}</p>
                          <p className="text-xs text-slate-500">{itemCount} item(s)</p>
                          <button
                            onClick={() => {
                              setTrackingInput(order?._id || '');
                              setSelectedOrderId(order?._id || '');
                            }}
                            className="!bg-white !text-slate-700 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold transition hover:!bg-slate-100"
                          >
                            Track This Order
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <p>Name: <span className="font-semibold text-slate-800">{order?.name}</span></p>
                        <p>Phone: <span className="font-semibold text-slate-800">{order?.phone}</span></p>
                        <p className="sm:col-span-2">
                          Address: <span className="font-semibold text-slate-800">{order?.address?.city}, {order?.address?.state}, {order?.address?.country}, {order?.address?.zipcode}</span>
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] xl:sticky xl:top-28 xl:h-fit">
            <h3 className="text-xl font-bold text-slate-900">Track Order</h3>
            <p className="mt-1 text-sm text-slate-500">Enter an order ID or pick an existing order.</p>

            <form onSubmit={handleTrackSubmit} className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={trackingInput}
                  onChange={(event) => setTrackingInput(event.target.value)}
                  placeholder="Enter order id"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700"
                />
              </div>
              <button type="submit" className="!bg-slate-900 hover:!bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold text-white">
                Track
              </button>
            </form>

            {orders.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {orders.slice(0, 4).map((order, index) => (
                  <button
                    key={order?._id || index}
                    onClick={() => {
                      const nextId = order?._id || '';
                      setTrackingInput(nextId);
                      setSelectedOrderId(nextId);
                    }}
                    className="!bg-white !text-slate-700 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold hover:!bg-slate-100"
                  >
                    {String(order?._id || '').slice(-6)}
                  </button>
                ))}
              </div>
            )}

            {selectedOrderId && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Tracking Order ID</p>
                <p className="mt-1 break-all text-sm font-semibold text-slate-900">{selectedOrderId}</p>

                {isTrackingLoading && <p className="mt-3 text-sm text-slate-500">Fetching tracking details...</p>}

                {!isTrackingLoading && isTrackingError && (
                  <p className="mt-3 text-sm text-rose-600">Could not find tracking details for this order.</p>
                )}

                {!isTrackingLoading && trackingData && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-700">Current Status</p>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(trackingData?.status)}`}>
                        {formatStatus(trackingData?.status)}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Last updated: {new Date(trackingData?.updatedAt).toLocaleString()}
                    </p>

                    <div className="mt-4 space-y-2">
                      {(trackingData?.timeline || []).map((step) => {
                        const StepIcon = timelineMeta[step.step]?.icon || FiPackage;
                        const label = timelineMeta[step.step]?.label || formatStatus(step.step);
                        return (
                          <div
                            key={step.step}
                            className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                              step.current
                                ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                                : step.done
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-200 bg-white text-slate-500'
                            }`}
                          >
                            <StepIcon className="size-4" />
                            <span className="font-medium">{label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {trackedOrder && (
                      <div className="mt-4 border-t border-slate-200 pt-3 text-sm text-slate-600">
                        <p>
                          Total: <span className="font-semibold text-slate-900">{formatCurrency(trackedOrder?.totalPrice)}</span>
                        </p>
                        <p className="mt-1">
                          Items: <span className="font-semibold text-slate-900">{(trackedOrder?.items || []).reduce((sum, item) => sum + Number(item?.quantity || 0), 0)}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
        </div>
      </section>
    </>
  );
};

export default OrderPage;
