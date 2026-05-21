import React, { useMemo, useState } from 'react'
import { FiShoppingCart } from 'react-icons/fi'
import { HiOutlineHeart, HiHeart } from 'react-icons/hi2'
import { getImgUrl } from '../../utils/getImgUrl'

import { Link } from'react-router-dom'

import { useDispatch, useSelector } from'react-redux'
import { addToCart } from '../../redux/features/cart/cartSlice'
import { toggleWishlistItem } from '../../redux/features/wishlist/wishlistSlice'
import { useAuth } from '../../context/AuthContext'
import { trackProductClick } from '../../utils/recommendationBehavior'

const BookCard = ({book}) => {
    const dispatch =  useDispatch();
    const { currentUser } = useAuth();
    const wishlistItems = useSelector((state) => state.wishlist.items);
    const isFavorite = wishlistItems.some((item) => item._id === book?._id);

    const description = book?.description ?? '';
    const oldPrice = book?.oldPrice ?? 0;
    const newPrice = book?.newPrice ?? 0;
    const coverImage = book?.coverImage ?? 'book-1.png';
    // Always use a guaranteed local asset for fallback (dev server may not serve `dist/`).
    const fallbackImage = getImgUrl('book-1.png');
    const resolvedCover = useMemo(() => {
        try {
            return `${getImgUrl(coverImage)}`;
        } catch {
            return fallbackImage;
        }
    }, [coverImage]);
    const [imageSrc, setImageSrc] = useState(resolvedCover);
    const bookId = book?._id || book?.id;

    const handleAddToCart = (product) => {
        trackProductClick(bookId);
        dispatch(addToCart(product))
    }
    const handleToggleWishlist = () => {
        if (!currentUser?.id) return;
        dispatch(toggleWishlistItem(book));
    }
        return (
            <article className="group relative flex h-full min-h-[31rem] w-full max-w-[22rem] flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg mx-auto">
                        <button
                            onClick={handleToggleWishlist}
                            className="!bg-white/95 !text-slate-700 absolute right-5 top-5 z-10 rounded-full border border-slate-200 p-2 shadow-sm transition hover:!bg-white"
                            title={currentUser?.id ? 'Toggle wishlist' : 'Login to wishlist'}
                            aria-label="Toggle wishlist"
                        >
                            {isFavorite ? <HiHeart className="size-4 text-rose-500" /> : <HiOutlineHeart className="size-4" />}
                        </button>

                        <Link to={`/books/${book.slug || book._id}`} className="block h-64 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <img
                                        src={imageSrc}
                                        alt={book?.title || book?.name || 'Book cover'}
                                        onClick={() => trackProductClick(bookId)}
                                        onError={() => setImageSrc(fallbackImage)}
                                        className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]"
                                />
                        </Link>

                        <div className="mt-4 flex flex-1 flex-col justify-between gap-3">
                            <div>
                                <Link to={`/books/${book.slug || book._id}`} onClick={() => trackProductClick(bookId)}>
                                <h3 className="line-clamp-2 min-h-[3.4rem] text-lg font-bold text-slate-900 transition hover:text-cyan-700">
                                            {book?.title || book?.name || 'Untitled Book'}
                                        </h3>
                                </Link>

                            <p className="mt-2 line-clamp-3 min-h-[3.9rem] text-sm text-slate-600">
                                    {description.length > 110 ? `${description.slice(0, 110)}...` : description || 'No description available.'}
                                </p>
                            </div>

                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                        <p className="text-base font-bold text-slate-900">Rs. {newPrice}</p>
                                        {oldPrice > newPrice && (
                                            <span className="text-xs font-medium text-slate-500 line-through">Rs. {oldPrice}</span>
                                        )}
                                </div>

                                <button
                                    onClick={() => handleAddToCart(book)}
                                    className="!bg-slate-900 hover:!bg-slate-700 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                                >
                                        <FiShoppingCart />
                                        <span>Add to Cart</span>
                                </button>
                            </div>
                        </div>
                </article>
        )
}

export default BookCard
