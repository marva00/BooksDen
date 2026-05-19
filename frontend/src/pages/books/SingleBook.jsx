import React, { useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiCheckCircle, FiClock, FiPackage, FiShoppingCart } from "react-icons/fi"
import { HiHeart, HiOutlineHeart } from 'react-icons/hi2'
import { Link, useNavigate, useParams } from "react-router-dom"

import { getImgUrl } from '../../utils/getImgUrl';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../redux/features/cart/cartSlice';
import { useFetchAllBooksQuery, useFetchBookBySlugQuery } from '../../redux/features/books/booksApi';
import SEO from '../../components/SEO';
import { toggleWishlistItem } from '../../redux/features/wishlist/wishlistSlice';
import { useAuth } from '../../context/AuthContext';
import { trackProductClick, trackProductView } from '../../utils/recommendationBehavior';

const formatCurrency = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const formatPublishedDate = (value) => {
    if (!value) return 'Recently added';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recently added';
    return date.toLocaleDateString();
};

const SingleBook = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { data: book, isLoading, isError } = useFetchBookBySlugQuery(slug);
    const { data: books = [] } = useFetchAllBooksQuery();
    const { currentUser } = useAuth();

    const dispatch = useDispatch();
    const wishlistItems = useSelector((state) => state.wishlist.items);
    const isFavorite = wishlistItems.some((item) => item._id === book?._id);

    const [imageSrc, setImageSrc] = useState('/book-1.png');

    const safeTitle = book?.title || book?.name || 'Untitled Book';
    const safeDescription = book?.description || 'No description available for this title right now.';
    const safeAuthor = book?.author || book?.brand || 'Booksden Editorial';
    const safeCategory = (book?.category || 'general').toString();
    const safeNewPrice = Number(book?.newPrice ?? book?.price ?? 0);
    const safeOldPrice = Number(book?.oldPrice ?? safeNewPrice);
    const savings = Math.max(0, safeOldPrice - safeNewPrice);

    const relatedBooks = useMemo(() => {
        if (!book?._id) return [];
        const categoryLower = safeCategory.toLowerCase();
        return (books || [])
            .filter((item) => item?._id !== book._id)
            .filter((item) => (item?.category || '').toLowerCase() === categoryLower)
            .slice(0, 4);
    }, [book?._id, books, safeCategory]);

    const handleAddToCart = (product) => {
        trackProductClick(product?._id || product?.id);
        dispatch(addToCart(product));
    };

    const handleToggleWishlist = () => {
        if (!book) return;
        if (!currentUser?.id) {
            navigate('/login');
            return;
        }
        dispatch(toggleWishlistItem(book));
    };

    useEffect(() => {
        if (book?.slug && slug !== book.slug) {
            navigate(`/books/${book.slug}`, { replace: true });
        }
    }, [book?.slug, slug, navigate]);

    useEffect(() => {
        const resolvedImage = getImgUrl(book?.coverImage || book?.images?.[0] || 'book-1.png');
        setImageSrc(resolvedImage || '/book-1.png');
    }, [book?.coverImage, book?.images]);

    useEffect(() => {
        if (!book?._id) return;
        trackProductView(book._id);
    }, [book?._id]);

    if (isLoading) {
        return (
            <section className="mx-auto max-w-screen-2xl py-8 sm:py-10">
                <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
                    <div className="h-[30rem] animate-pulse rounded-[1.75rem] border border-slate-200 bg-slate-100" />
                    <div className="h-[30rem] animate-pulse rounded-[1.75rem] border border-slate-200 bg-slate-100" />
                </div>
            </section>
        );
    }

    if (isError || !book) {
        return (
            <section className="mx-auto max-w-screen-lg py-10">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-7 text-center shadow-sm">
                    <h2 className="text-2xl font-bold text-rose-800">Book not found</h2>
                    <p className="mt-2 text-sm text-rose-700">We couldn't load this book right now. Please try again.</p>
                    <Link to="/" className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">
                        Back to Home
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className="mx-auto max-w-screen-2xl space-y-8 py-8 sm:py-10">
            <SEO
                title={book?.seo?.metaTitle || `${safeTitle} | Book Store`}
                metaDescription={book?.seo?.metaDescription || safeDescription}
                keywords={book?.seo?.keywords || `${safeCategory}, books, bookstore`}
                ogTitle={book?.seo?.ogTitle}
                ogDescription={book?.seo?.ogDescription}
                canonical={`/books/${book?.slug || slug}`}
            />

            <header className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] sm:p-7">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                    <FiArrowLeft className="h-4 w-4" />
                    Continue Shopping
                </Link>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold capitalize text-cyan-700">
                        {safeCategory}
                    </span>
                    {book?.trending && (
                        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            Trending Choice
                        </span>
                    )}
                </div>

                <h1 className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">{safeTitle}</h1>
                <p className="mt-2 text-sm text-slate-500">by {safeAuthor}</p>
            </header>

            <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
                <article className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] sm:p-6 lg:sticky lg:top-28 lg:h-fit">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 via-white to-cyan-50 p-4 sm:p-6">
                        <img
                            src={imageSrc}
                            alt={safeTitle}
                            onError={(event) => {
                                event.currentTarget.src = '/book-1.png';
                            }}
                            className="mx-auto h-[22rem] w-auto max-w-full object-contain sm:h-[30rem]"
                        />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Published</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{formatPublishedDate(book?.createdAt)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Availability</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">In stock</p>
                        </div>
                    </div>
                </article>

                <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] sm:p-7">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Price</p>
                        <div className="mt-2 flex flex-wrap items-end gap-2">
                            <p className="text-3xl font-black text-slate-900">{formatCurrency(safeNewPrice)}</p>
                            {safeOldPrice > safeNewPrice && (
                                <p className="pb-0.5 text-sm font-medium text-slate-500 line-through">{formatCurrency(safeOldPrice)}</p>
                            )}
                        </div>
                        {savings > 0 && (
                            <p className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                You save {formatCurrency(savings)}
                            </p>
                        )}
                    </div>

                    <div className="mt-5 space-y-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">About This Book</h2>
                            <p className="mt-2 text-sm leading-7 text-slate-600">{safeDescription}</p>
                        </div>

                        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Author</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{safeAuthor}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Category</p>
                                <p className="mt-1 text-sm font-semibold capitalize text-slate-900">{safeCategory}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Format</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">Paperback</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">SKU</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900 break-all">{book?._id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button
                            onClick={() => handleAddToCart(book)}
                            className="!bg-slate-900 hover:!bg-slate-700 inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white"
                        >
                            <FiShoppingCart className="h-4 w-4" />
                            Add to Cart
                        </button>

                        <button
                            onClick={handleToggleWishlist}
                            className="!bg-white !text-slate-700 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 text-sm font-semibold hover:!bg-slate-100"
                        >
                            {isFavorite ? <HiHeart className="h-4 w-4 text-rose-500" /> : <HiOutlineHeart className="h-4 w-4" />}
                            {isFavorite ? 'Saved' : 'Save'}
                        </button>
                    </div>

                    <div className="mt-5 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        <p className="inline-flex items-center gap-2"><FiCheckCircle className="h-4 w-4 text-emerald-600" /> Fast checkout and secure payments.</p>
                        <p className="inline-flex items-center gap-2"><FiPackage className="h-4 w-4 text-cyan-700" /> Professional packaging for safe delivery.</p>
                        <p className="inline-flex items-center gap-2"><FiClock className="h-4 w-4 text-amber-700" /> Order tracking updates after purchase.</p>
                    </div>
                </article>
            </div>

            {relatedBooks.length > 0 && (
                <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] sm:p-7">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">More in {safeCategory}</h2>
                        <Link
                            to={`/?search=${encodeURIComponent(safeCategory)}`}
                            className="text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-700"
                        >
                            View all
                        </Link>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {relatedBooks.map((item, index) => (
                            <Link
                                key={item?._id || `${item?.title}-${index}`}
                                to={`/books/${item?.slug || item?._id}`}
                                onClick={() => trackProductClick(item?._id || item?.id)}
                                className="group rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                            >
                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                    <img
                                        src={getImgUrl(item?.coverImage || item?.images?.[0] || 'book-1.png')}
                                        alt={item?.title || item?.name || 'Book'}
                                        onError={(event) => {
                                            event.currentTarget.src = '/book-1.png';
                                        }}
                                        className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                                    />
                                </div>
                                <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-slate-800">
                                    {item?.title || item?.name || 'Untitled Book'}
                                </h3>
                                <p className="mt-2 text-sm font-bold text-slate-900">{formatCurrency(item?.newPrice ?? item?.price)}</p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </section>
    )
}

export default SingleBook
