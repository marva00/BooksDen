import React from 'react';
import { HiOutlineHeart } from 'react-icons/hi2';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import BookCard from './BookCard';

const FavoritesPage = () => {
  const items = useSelector((state) => state.wishlist.items);
  return (
    <section className="max-w-3xl mx-auto py-10 px-4">
      <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
        <div className="flex justify-center mb-4 text-secondary">
          <HiOutlineHeart className="size-10" />
        </div>
        <h2 className="text-2xl font-semibold mb-2 text-center">Favorites</h2>
        {items.length === 0 ? (
          <div className="text-center">
            <p className="text-muted mb-6">No wishlist items yet.</p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 rounded-md bg-secondary text-white hover:bg-primary transition-colors"
            >
              Continue Browsing
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {items.map((book) => <BookCard key={book._id} book={book} />)}
          </div>
        )}
      </div>
    </section>
  );
};

export default FavoritesPage;

