import React from 'react';
import { FiMinus, FiPlus, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getImgUrl } from '../../utils/getImgUrl';
import { clearCart, clearCoupon, removeFromCart, updateCartQty } from '../../redux/features/cart/cartSlice';
import SEO from '../../components/SEO';

const CartPage = () => {
    const cartItems = useSelector((state) => state.cart.cartItems);
    const appliedCoupon = useSelector((state) => state.cart.appliedCoupon);
    const dispatch = useDispatch();

    const subtotal = cartItems.reduce(
        (acc, item) => acc + ((Number(item?.newPrice ?? item?.price) || 0) * (item.quantity || 1)),
        0
    );
    const couponPercent = Number(appliedCoupon?.percent || 0);
    const discountAmount = couponPercent > 0 ? (subtotal * couponPercent) / 100 : 0;
    const totalPrice = Math.max(0, subtotal - discountAmount);

    const handleRemoveFromCart = (product) => {
        dispatch(removeFromCart(product));
    };

    const handleClearCart = async () => {
        if (cartItems.length === 0) return;

        const result = await Swal.fire({
            title: 'Clear all cart items?',
            text: 'This action will remove all products from your cart.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, clear cart',
            cancelButtonText: 'Keep items',
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-popup',
                title: 'swal-modern-title',
                htmlContainer: 'swal-modern-text',
                confirmButton: 'swal-modern-confirm',
                cancelButton: 'swal-modern-cancel',
                actions: 'swal-modern-actions',
            },
        });

        if (result.isConfirmed) {
            dispatch(clearCart());
            dispatch(clearCoupon());
            Swal.fire({
                title: 'Cart cleared',
                text: 'Your cart is now empty.',
                icon: 'success',
                timer: 1400,
                showConfirmButton: false,
                customClass: {
                    popup: 'swal-modern-popup',
                    title: 'swal-modern-title',
                    htmlContainer: 'swal-modern-text',
                },
            });
        }
    };

    const handleClearCoupon = () => {
        dispatch(clearCoupon());
    };

    const handleQtyChange = (id, qty) => {
        dispatch(updateCartQty({ id, quantity: qty }));
    };

    const increaseQty = (id, currentQty) => {
        handleQtyChange(id, Number(currentQty || 1) + 1);
    };

    const decreaseQty = (id, currentQty) => {
        handleQtyChange(id, Math.max(1, Number(currentQty || 1) - 1));
    };

    if (cartItems.length === 0) {
        return (
            <>
                <SEO
                    title="Cart | Booksden"
                    metaDescription="Review selected books in your shopping cart before checkout."
                    keywords="books cart, shopping cart, checkout"
                    canonical="/cart"
                    noIndex
                />
                <section className="mx-auto max-w-screen-2xl py-8 sm:py-10">
                    <div className="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-12 text-center shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] sm:px-8">
                        <div className="mx-auto mb-4 inline-flex size-14 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                            <FiShoppingCart className="size-7" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Your cart is empty</h2>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                            Add your favorite books to the cart and continue to checkout when ready.
                        </p>
                        <Link
                            to="/"
                            className="mt-6 inline-flex items-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </section>
            </>
        );
    }

    return (
        <>
            <SEO
                title="Cart | Booksden"
                metaDescription="Review selected books in your shopping cart before checkout."
                keywords="books cart, shopping cart, checkout"
                canonical="/cart"
                noIndex
            />
            <section className="mx-auto max-w-screen-2xl py-8 sm:py-10">
                <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] sm:p-6">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">My Basket</p>
                            <h2 className="mt-2 text-2xl font-bold text-slate-900">Shopping Cart</h2>
                            <p className="mt-1 text-sm text-slate-500">{cartItems.length} item(s) ready for checkout</p>
                        </div>

                        <button
                            type="button"
                            onClick={handleClearCart}
                            className="!bg-white !text-slate-700 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:!bg-slate-100"
                        >
                            <FiTrash2 className="size-4" />
                            Clear Cart
                        </button>
                    </div>

                    <div className="space-y-3">
                        {cartItems.map((product, index) => {
                            const productId = product?._id || product?.id;
                            const quantity = Number(product?.quantity || 1);
                            const unitPrice = Number(product?.newPrice ?? product?.price) || 0;
                            const lineTotal = unitPrice * quantity;

                            return (
                                <article
                                    key={productId || index}
                                    className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:grid-cols-[7rem_1fr]"
                                >
                                    <Link to={`/books/${product?.slug || productId}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                        <img
                                            alt={product?.title || 'Book'}
                                            src={getImgUrl(product?.coverImage)}
                                            className="h-32 w-full bg-slate-50 object-contain p-2"
                                        />
                                    </Link>

                                    <div className="flex min-w-0 flex-col justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <Link
                                                        to={`/books/${product?.slug || productId}`}
                                                        className="line-clamp-2 text-base font-bold text-slate-900 transition hover:text-cyan-700"
                                                    >
                                                        {product?.title || 'Untitled Book'}
                                                    </Link>
                                                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
                                                        {product?.category || 'General'}
                                                    </p>
                                                </div>
                                                <p className="text-base font-bold text-slate-900">Rs. {lineTotal.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white">
                                                <button
                                                    type="button"
                                                    onClick={() => decreaseQty(productId, quantity)}
                                                    className="!bg-transparent !text-slate-700 px-2.5 py-2 hover:!bg-slate-100"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <FiMinus className="size-4" />
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={quantity}
                                                    onChange={(event) => handleQtyChange(productId, event.target.value)}
                                                    className="w-14 border-x border-slate-300 bg-white px-2 py-2 text-center text-sm font-semibold text-slate-700"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => increaseQty(productId, quantity)}
                                                    className="!bg-transparent !text-slate-700 px-2.5 py-2 hover:!bg-slate-100"
                                                    aria-label="Increase quantity"
                                                >
                                                    <FiPlus className="size-4" />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => handleRemoveFromCart(product)}
                                                type="button"
                                                className="!bg-transparent !text-rose-600 inline-flex items-center gap-1 px-0 py-0 text-sm font-semibold hover:!bg-transparent"
                                            >
                                                <FiTrash2 className="size-4" />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>

                <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] lg:sticky lg:top-28 lg:h-fit">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Order Summary</p>
                    <h3 className="mt-2 text-xl font-bold text-slate-900">Checkout Details</h3>

                    <div className="mt-5 space-y-3 text-sm">
                        <div className="flex items-center justify-between text-slate-600">
                            <span>Subtotal</span>
                            <span className="font-semibold text-slate-900">Rs. {subtotal.toFixed(2)}</span>
                        </div>

                        {appliedCoupon && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                <div className="flex items-center justify-between gap-3 text-xs text-emerald-700">
                                    <p>
                                        Coupon <span className="font-bold">{appliedCoupon.code}</span> ({couponPercent}% off)
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleClearCoupon}
                                        className="!bg-transparent !text-emerald-700 p-0 text-xs font-semibold underline hover:!bg-transparent"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <p className="mt-1 text-sm font-semibold text-emerald-800">- Rs. {discountAmount.toFixed(2)}</p>
                                                    </div>
                        )}

                        <div className="border-t border-slate-200 pt-3">
                            <div className="flex items-center justify-between">
                                <span className="text-base font-semibold text-slate-900">Total</span>
                                <span className="text-lg font-bold text-slate-900">Rs. {totalPrice.toFixed(2)}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">Shipping and taxes calculated at checkout.</p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        <Link
                            to="/checkout"
                            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                            Proceed to Checkout
                        </Link>
                        <Link to="/" className="font-medium text-muted hover:text-text underline-offset-2 hover:underline ml-1">
                            Continue Shopping
                            <span aria-hidden="true"> &rarr;</span>
                        </Link>
                    </div>
                </aside>
                </div>
            </section>
        </>
    );
};

export default CartPage;
