import React from 'react';
import { Link } from 'react-router-dom';

const OrderSuccessPage = () => {
  return (
    <section className="max-w-2xl mx-auto py-14 px-4">
      <div className="bg-white border border-border rounded-xl p-8 text-center shadow-sm">
        <h2 className="text-2xl font-semibold mb-2">Order Confirmed</h2>
        <p className="text-muted mb-6">Your order has been placed successfully.</p>
        <div className="flex justify-center gap-3">
          <Link to="/orders" className="inline-flex items-center px-4 py-2 rounded-md bg-secondary text-white hover:bg-primary transition-colors">
            View My Orders
          </Link>
          <Link to="/" className="inline-flex items-center px-4 py-2 rounded-md border border-border">
            Continue Shopping
          </Link>
        </div>
      </div>
    </section>
  );
};

export default OrderSuccessPage;
