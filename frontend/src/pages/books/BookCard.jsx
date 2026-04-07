import React, { useMemo, useState } from 'react'
import { FiShoppingCart } from 'react-icons/fi'
import { HiOutlineHeart, HiHeart } from 'react-icons/hi2'
import { getImgUrl } from '../../utils/getImgUrl'

import { Link } from'react-router-dom'

import { useDispatch, useSelector } from'react-redux'
import { addToCart } from '../../redux/features/cart/cartSlice'
import { toggleWishlistItem } from '../../redux/features/wishlist/wishlistSlice'
import { useAuth } from '../../context/AuthContext'

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

    const handleAddToCart = (product) => {
        dispatch(addToCart(product))
    }
    const handleToggleWishlist = () => {
        if (!currentUser?.id) return;
        dispatch(toggleWishlistItem(book));
    }
    return (
        <div className="rounded-lg border border-border bg-white transition-shadow duration-300 h-full shadow-none max-w-[22rem] mx-auto">
            <div
                className="flex flex-col sm:flex-row sm:items-stretch sm:min-h-[18rem] gap-4"
            >
                <div className="sm:w-44 sm:flex-shrink-0 border rounded-md overflow-hidden">
                    <Link to={`/books/${book.slug || book._id}`}>
                        <img
                            src={imageSrc}
                            alt=""
                            onError={() => setImageSrc(fallbackImage)}
                            className="w-full h-72 object-cover p-2 rounded-md cursor-pointer hover:scale-105 transition-all duration-200"
                        />
                    </Link>
                </div>

                <div className="flex flex-col justify-between flex-1 min-w-0 py-1 pr-1">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link to={`/books/${book.slug || book._id}`} className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold hover:text-blue-600 line-clamp-2 min-h-[3.5rem]">
                          {book?.title}
                          </h3>
                      </Link>
                      <button
                        onClick={handleToggleWishlist}
                        className="!bg-transparent !text-primary !p-0 !rounded-none hover:!bg-transparent shadow-none shrink-0"
                        title={currentUser?.id ? "Toggle wishlist" : "Login to wishlist"}
                      >
                        {isFavorite ? <HiHeart className="text-primary size-5" /> : <HiOutlineHeart className="text-primary size-5" />}
                      </button>
                    </div>
                    <p className="text-gray-600 mb-4 min-h-[3.5rem]">
                      {description.length > 90 ? `${description.slice(0, 90)}...` : description}
                    </p>
                    <p className="font-medium mb-4">
                        Rs. {newPrice} <span className="line-through font-normal ml-2">Rs. {oldPrice}</span>
                    </p>
                  </div>
                    <div className="flex flex-col items-start gap-2">
                    <button 
                    onClick={() => handleAddToCart(book)}
                    className="btn-primary px-6 space-x-1 flex items-center gap-1 whitespace-nowrap self-start">
                        <FiShoppingCart className="" />
                        <span className="whitespace-nowrap">Add to Cart</span>
                    </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BookCard