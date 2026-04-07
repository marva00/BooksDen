import React, { useEffect } from 'react'
import { FiShoppingCart } from "react-icons/fi"
import { HiHeart, HiOutlineHeart } from 'react-icons/hi2'
import { useNavigate, useParams } from "react-router-dom"

import { getImgUrl } from '../../utils/getImgUrl';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../redux/features/cart/cartSlice';
import { useFetchBookBySlugQuery } from '../../redux/features/books/booksApi';
import SEO from '../../components/SEO';
import { toggleWishlistItem } from '../../redux/features/wishlist/wishlistSlice';
import { useAuth } from '../../context/AuthContext';
import { trackProductClick, trackProductView } from '../../utils/recommendationBehavior';

const SingleBook = () => {
    const {slug} = useParams();
    const navigate = useNavigate();
    const {data: book, isLoading, isError} = useFetchBookBySlugQuery(slug);
    const { currentUser } = useAuth();

    const dispatch =  useDispatch();
    const wishlistItems = useSelector((state) => state.wishlist.items);
    const isFavorite = wishlistItems.some((item) => item._id === book?._id);

    const handleAddToCart = (product) => {
        trackProductClick(product?._id || product?.id);
        dispatch(addToCart(product))
    }
    const handleToggleWishlist = () => {
        if (!currentUser?.id || !book) return;
        dispatch(toggleWishlistItem(book));
    }

    useEffect(() => {
        if (book?.slug && slug !== book.slug) {
            navigate(`/books/${book.slug}`, { replace: true });
        }
    }, [book?.slug, slug, navigate]);

    useEffect(() => {
        if (!book?._id) return;
        trackProductView(book._id);
    }, [book?._id]);

    if(isLoading) return <div>Loading...</div>
    if(isError) return <div>Error happending to load book info</div>
  return (
    <div className="max-w-lg shadow-md p-5">
            <SEO
                            title={book?.seo?.metaTitle || `${book?.title || book?.name || 'Book'} | Book Store`}
              metaDescription={book?.seo?.metaDescription || book?.description}
              keywords={book?.seo?.keywords || `${book?.category || ''}, books, bookstore`}
            />
                        <h1 className="text-2xl font-bold mb-6">{book?.title || book?.name || 'Untitled Book'}</h1>

            <div className=''>
                <div>
                    <img
                        src={`${getImgUrl(book?.coverImage || book?.images?.[0] || 'book-1.png')}`}
                        alt={book?.title || book?.name || 'Book cover'}
                        className="mb-8"
                    />
                </div>

                <div className='mb-5'>
                    <p className="text-gray-700 mb-2"><strong>Author:</strong> {book.author || 'admin'}</p>
                    <p className="text-gray-700 mb-4">
                        <strong>Published:</strong> {new Date(book?.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-gray-700 mb-4 capitalize">
                        <strong>Category:</strong> {book?.category}
                    </p>
                    <p className="text-gray-700"><strong>Description:</strong> {book.description}</p>
                </div>

                <div className="flex items-center gap-3">
                <button onClick={() => handleAddToCart(book)} className="btn-primary px-6 space-x-1 flex items-center gap-1 whitespace-nowrap">
                    <FiShoppingCart className="" />
                    <span className="whitespace-nowrap">Add to Cart</span>

                </button>
                <button onClick={handleToggleWishlist} className="px-3 py-2 border rounded-md">
                  {isFavorite ? <HiHeart className="text-red-500" /> : <HiOutlineHeart />}
                </button>
                </div>
            </div>
        </div>
  )
}

export default SingleBook