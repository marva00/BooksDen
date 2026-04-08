import React from 'react';
import { HiOutlineHeart } from 'react-icons/hi2';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import BookCard from './BookCard';
import { clearWishlist } from '../../redux/features/wishlist/wishlistSlice';
import SEO from '../../components/SEO';

const FavoritesPage = () => {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.wishlist.items);

  const handleClearWishlist = () => {
    dispatch(clearWishlist());
  };

  return (
    <section className="mx-auto max-w-screen-2xl py-8 sm:py-10">
      <SEO
        title="Wishlist | Booksden"
        metaDescription="Save and organize books you want to read in your personal Booksden wishlist."
        keywords="book wishlist, saved books, favorites"
        canonical="/favorites"
        noIndex
      />
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] sm:p-7">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-500">Personal Shelf</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">My Wishlist</h2>
            <p className="mt-2 text-sm text-slate-500">Keep track of books you want to read next.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {items.length} saved
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleClearWishlist}
                className="!bg-white !text-slate-700 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:!bg-slate-100"
              >
                Clear Wishlist
              </button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
            <div className="mx-auto mb-4 inline-flex size-14 items-center justify-center rounded-full bg-rose-100 text-rose-500">
              <HiOutlineHeart className="size-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Your wishlist is empty</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Add books to your wishlist while browsing and revisit them anytime.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Explore Books
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((book, index) => (
              <BookCard key={book?._id || index} book={book} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FavoritesPage;

