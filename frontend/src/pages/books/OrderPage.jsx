import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useGetOrderByUserIdQuery, useGetOrderTrackingQuery } from '../../redux/features/orders/ordersApi';
import { useAuth } from '../../context/AuthContext';

const formatStatus = (status = '') => {
  const value = (status || '').toString().trim().toLowerCase();
  if (!value) return 'Pending';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const statusStyle = (status = '') => {
  const value = (status || '').toString().toLowerCase();
  if (value === 'delivered') return 'bg-green-100 text-green-700';
  if (value === 'shipped') return 'bg-blue-100 text-blue-700';
  if (value === 'processing') return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-700';
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

  const {
    data: trackingData,
    isFetching: isTrackingLoading,
    isError: isTrackingError,
  } = useGetOrderTrackingQuery(selectedOrderId, {
    skip: !selectedOrderId,
  });

  const handleTrackSubmit = (event) => {
    event.preventDefault();
    const nextOrderId = trackingInput.trim();
    if (!nextOrderId) return;
    setSelectedOrderId(nextOrderId);
  };

  if (!userId) return <div>Please login to view your orders.</div>;
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error getting orders data.</div>;

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Your Orders</h2>

      <div className="mb-6 p-4 border rounded-lg bg-white">
        <h3 className="font-semibold mb-2">Track an Order</h3>
        <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            value={trackingInput}
            onChange={(e) => setTrackingInput(e.target.value)}
            placeholder="Enter order id"
            className="flex-1 border rounded px-3 py-2"
          />
          <button type="submit" className="px-4 py-2 bg-secondary text-white rounded">
            Track
          </button>
        </form>

        {selectedOrderId && (
          <div className="mt-4 border rounded p-3 bg-gray-50">
            <p className="text-sm text-gray-600 mb-1">Tracking Order ID: {selectedOrderId}</p>
            {isTrackingLoading && <p className="text-sm">Fetching tracking details...</p>}
            {!isTrackingLoading && isTrackingError && (
              <p className="text-sm text-red-600">Could not find tracking details for that order.</p>
            )}
            {!isTrackingLoading && trackingData && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold">Status:</span>
                  <span className={`text-xs px-2 py-1 rounded ${statusStyle(trackingData.status)}`}>
                    {formatStatus(trackingData.status)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Last updated: {new Date(trackingData.updatedAt).toLocaleString()}
                </p>
                <div className="space-y-1 text-sm">
                  {(trackingData.timeline || []).map((step) => (
                    <p key={step.step} className={step.current ? 'font-semibold text-secondary' : 'text-gray-700'}>
                      {step.done ? '✓' : '○'} {formatStatus(step.step)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div>No orders found!</div>
      ) : (
        <div>
          {orders.map((order, index) => (
            <div key={order._id} className="border-b mb-4 pb-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="p-1 bg-secondary text-white w-10 rounded"># {index + 1}</p>
                <span className={`text-xs px-2 py-1 rounded ${statusStyle(order.status)}`}>
                  {formatStatus(order.status)}
                </span>
              </div>
              <h2 className="font-bold">Order ID: {order._id}</h2>
              <p className="text-gray-600">Name: {order.name}</p>
              <p className="text-gray-600">Email: {order.email}</p>
              <p className="text-gray-600">Phone: {order.phone}</p>
              <p className="text-gray-600">Total Price: Rs. {order.totalPrice}</p>
              <h3 className="font-semibold mt-2">Address:</h3>
              <p>{order.address.city}, {order.address.state}, {order.address.country}, {order.address.zipcode}</p>
              <h3 className="font-semibold mt-2">Items:</h3>
              <ul>
                {(order.items || []).map((item) => (
                  <li key={`${item.productId}-${item.title}`}>{item.title} x {item.quantity}</li>
                ))}
              </ul>
              <button
                onClick={() => {
                  setTrackingInput(order._id);
                  setSelectedOrderId(order._id);
                }}
                className="mt-3 px-3 py-1 border rounded text-sm"
              >
                Track This Order
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderPage;
