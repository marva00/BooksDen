import { useState } from 'react';
import { FiCreditCard, FiLock, FiMapPin } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getImgUrl } from '../../utils/getImgUrl';
import { useCreateOrderMutation } from '../../redux/features/orders/ordersApi';
import { clearCart } from '../../redux/features/cart/cartSlice';
import SEO from '../../components/SEO';

const CheckoutPage = () => {
  const cartItems = useSelector((state) => state.cart.cartItems);
  const appliedCoupon = useSelector((state) => state.cart.appliedCoupon);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + ((Number(item?.newPrice ?? item?.price) || 0) * (item.quantity || 1)),
    0
  );
  const couponPercent = Number(appliedCoupon?.percent || 0);
  const discountAmount = couponPercent > 0 ? (subtotal * couponPercent) / 100 : 0;
  const totalPrice = Math.max(0, subtotal - discountAmount);

  const { currentUser } = useAuth();
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [createOrder, { isLoading, error }] = useCreateOrderMutation();
  const navigate = useNavigate();
  const [isChecked, setIsChecked] = useState(false);

  const onSubmit = async (data) => {
    if (!isChecked) return;

    const newOrder = {
      name: data.name,
      email: currentUser?.email,
      address: {
        street: data.address,
        city: data.city,
        country: data.country,
        state: data.state,
        zipcode: data.zipcode,
      },
      userId: currentUser?.id,
      phone: data.phone,
      productIds: cartItems.map((item) => item?._id),
      items: cartItems.map((item) => ({
        productId: item._id,
        quantity: item.quantity || 1,
        price: Number(item?.newPrice ?? item?.price) || 0,
        title: item.title,
        coverImage: item.coverImage,
      })),
      coupon: appliedCoupon
        ? {
            code: appliedCoupon.code,
            percent: couponPercent,
            discountAmount: Number(discountAmount.toFixed(2)),
          }
        : undefined,
      totalPrice: Number(totalPrice.toFixed(2)),
    };

    try {
      const createdOrder = await createOrder(newOrder).unwrap();
      const createdOrderId = createdOrder?._id;

      await Swal.fire({
        title: 'Order Confirmed',
        html: createdOrderId
          ? `<p>Your order has been placed successfully.</p><p style="margin-top: 6px; font-weight: 700;">Order ID: ${createdOrderId}</p>`
          : 'Your order has been placed successfully.',
        icon: 'success',
        confirmButtonText: 'Great, continue',
        buttonsStyling: false,
        customClass: {
          popup: 'swal-modern-popup',
          title: 'swal-modern-title',
          htmlContainer: 'swal-modern-text',
          confirmButton: 'swal-modern-confirm',
          actions: 'swal-modern-actions',
        },
      });

      dispatch(clearCart());
      navigate('/order-success', {
        state: {
          orderId: createdOrderId || '',
        },
      });
    } catch (requestError) {
      console.error('Error placing an order', requestError);
      Swal.fire({
        title: 'Order failed',
        text: 'We could not place your order. Please try again.',
        icon: 'error',
        confirmButtonText: 'Retry',
        buttonsStyling: false,
        customClass: {
          popup: 'swal-modern-popup',
          title: 'swal-modern-title',
          htmlContainer: 'swal-modern-text',
          confirmButton: 'swal-modern-confirm',
          actions: 'swal-modern-actions',
        },
      });
    }
  };

  if (!currentUser?.id) {
    return (
      <>
        <SEO
          title="Checkout | Booksden"
          metaDescription="Complete your shipping details and place your order securely on Booksden."
          keywords="book checkout, shipping details, place order"
          canonical="/checkout"
          noIndex
        />
        <section className="mx-auto max-w-screen-lg py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Login required</h2>
            <p className="mt-2 text-sm text-slate-500">Please login first to continue checkout.</p>
            <Link to="/login" className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">
              Go to Login
            </Link>
          </div>
        </section>
      </>
    );
  }

  if (cartItems.length === 0) {
    return (
      <>
        <SEO
          title="Checkout | Booksden"
          metaDescription="Complete your shipping details and place your order securely on Booksden."
          keywords="book checkout, shipping details, place order"
          canonical="/checkout"
          noIndex
        />
        <section className="mx-auto max-w-screen-lg py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">No items to checkout</h2>
            <p className="mt-2 text-sm text-slate-500">Your cart is currently empty.</p>
            <Link to="/cart" className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">
              Go to Cart
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Checkout | Booksden"
        metaDescription="Complete your shipping details and place your order securely on Booksden."
        keywords="book checkout, shipping details, place order"
        canonical="/checkout"
        noIndex
      />
      <section className="mx-auto max-w-screen-2xl py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Secure Checkout</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Shipping and Contact Details</h2>
          <p className="mt-2 text-sm text-slate-500">Complete your information to place this order.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-semibold text-slate-700">Full Name</label>
                <input
                  id="name"
                  {...register('name', { required: 'Full name is required.' })}
                  type="text"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700"
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-sm font-semibold text-slate-700">Phone Number</label>
                <input
                  id="phone"
                  {...register('phone', { required: 'Phone number is required.' })}
                  type="tel"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700"
                  placeholder="+92 300 0000000"
                />
                {errors.phone && <p className="text-xs text-rose-600">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
              <input
                id="email"
                type="text"
                disabled
                defaultValue={currentUser?.email}
                className="h-11 w-full rounded-xl border border-slate-300 bg-slate-100 px-4 text-sm text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="address" className="text-sm font-semibold text-slate-700">Street Address</label>
              <input
                id="address"
                {...register('address', { required: 'Address is required.' })}
                type="text"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700"
                placeholder="House no, street, area"
              />
              {errors.address && <p className="text-xs text-rose-600">{errors.address.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label htmlFor="city" className="text-sm font-semibold text-slate-700">City</label>
                <input
                  id="city"
                  {...register('city', { required: 'City is required.' })}
                  type="text"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700"
                />
                {errors.city && <p className="text-xs text-rose-600">{errors.city.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="state" className="text-sm font-semibold text-slate-700">State</label>
                <input
                  id="state"
                  {...register('state', { required: 'State is required.' })}
                  type="text"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700"
                />
                {errors.state && <p className="text-xs text-rose-600">{errors.state.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="country" className="text-sm font-semibold text-slate-700">Country</label>
                <input
                  id="country"
                  {...register('country', { required: 'Country is required.' })}
                  type="text"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700"
                />
                {errors.country && <p className="text-xs text-rose-600">{errors.country.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="zipcode" className="text-sm font-semibold text-slate-700">Zip Code</label>
                <input
                  id="zipcode"
                  {...register('zipcode', { required: 'Zip code is required.' })}
                  type="text"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700"
                />
                {errors.zipcode && <p className="text-xs text-rose-600">{errors.zipcode.message}</p>}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <label htmlFor="terms" className="inline-flex items-start gap-2 text-sm text-slate-600">
                <input
                  id="terms"
                  onChange={(event) => setIsChecked(event.target.checked)}
                  type="checkbox"
                  className="mt-1"
                />
                <span>
                  I agree to the <Link className="font-semibold text-cyan-700 underline">Terms & Conditions</Link> and{' '}
                  <Link className="font-semibold text-cyan-700 underline">Shopping Policy</Link>.
                </span>
              </label>
            </div>

            <button
              disabled={!isChecked || isLoading}
              className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${
                !isChecked || isLoading
                  ? '!bg-slate-400 cursor-not-allowed'
                  : '!bg-slate-900 hover:!bg-slate-700'
              }`}
            >
              {isLoading ? 'Placing Order...' : 'Place Order'}
            </button>

            {error && (
              <p className="text-sm text-rose-600">Failed to place order. Please review your details and try again.</p>
            )}
          </form>
        </div>

        <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] lg:sticky lg:top-28 lg:h-fit">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Order Overview</p>
          <h3 className="mt-2 text-xl font-bold text-slate-900">Cash on Delivery</h3>

          <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <FiMapPin className="size-4" />
              Shipping address will be verified before dispatch.
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <FiCreditCard className="size-4" />
              Payment: Cash on Delivery
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <FiLock className="size-4" />
              Secure encrypted checkout session
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {cartItems.map((item, index) => (
              <div key={item?._id || index} className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5">
                <img
                  src={getImgUrl(item?.coverImage)}
                  alt={item?.title || 'Book'}
                  className="h-16 w-12 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">{item?.title || 'Untitled Book'}</p>
                  <p className="text-xs text-slate-500">Qty: {item?.quantity || 1}</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  Rs. {((Number(item?.newPrice ?? item?.price) || 0) * (item?.quantity || 1)).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">Rs. {subtotal.toFixed(2)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex items-center justify-between text-emerald-700">
                <span>
                  Coupon {appliedCoupon.code} ({couponPercent}%)
                </span>
                <span className="font-semibold">- Rs. {discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-base font-semibold text-slate-900">Total</span>
              <span className="text-lg font-bold text-slate-900">Rs. {totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </aside>
        </div>
      </section>
    </>
  );
};

export default CheckoutPage;
