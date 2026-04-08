import React from 'react';
import Banner from './Banner';
import TopSellers from './TopSellers';
import Recommened from './Recommened';
import News from './News';
import { useFetchAllBooksQuery } from '../../redux/features/books/booksApi';
import { useLocation } from 'react-router-dom';
import SEO from '../../components/SEO';

const TOP_SELLERS_RANGE = { start: 0, end: 8 };
const RECOMMENDED_RANGE = { start: 8, end: 16 };

const Home = () => {
  const { data: books = [] } = useFetchAllBooksQuery();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const searchTerm = (params.get('search') || '').trim().toLowerCase();
  // Make older DB documents safe to render even if some fields are missing
  const safeBooks = (books ?? []).map((book) => ({
    ...book,
    title: typeof book?.title === 'string' && book.title.trim() ? book.title : (book?.name || 'Untitled Book'),
    trending: typeof book?.trending === 'boolean' ? book.trending : false,
    coverImage:
      book?.coverImage ||
      (Array.isArray(book?.images) && book.images.length > 0 ? book.images[0] : '') ||
      'book-1.png',
    oldPrice:
      typeof book?.oldPrice === 'number'
        ? book.oldPrice
        : Number(book?.oldPrice ?? book?.price ?? book?.newPrice) || 0,
    newPrice:
      typeof book?.newPrice === 'number'
        ? book.newPrice
        : Number(book?.newPrice ?? book?.price) || 0,
    description: typeof book?.description === 'string' ? book.description : '',
    category: typeof book?.category === 'string' ? book.category : '',
  }));

  const filteredBooks = searchTerm
    ? safeBooks.filter((b) =>
        `${b.title} ${b.description} ${b.category}`.toLowerCase().includes(searchTerm)
      )
    : safeBooks;

  // Keep fixed ranges for homepage sections.
  const topSellersBooks = filteredBooks.slice(TOP_SELLERS_RANGE.start, TOP_SELLERS_RANGE.end);
  const recommendedBooks = filteredBooks.slice(RECOMMENDED_RANGE.start, RECOMMENDED_RANGE.end);
  const hasSearchResults = filteredBooks.length > 0;

  return (
    <div className="space-y-4 pb-6">
        <SEO
          title="Home | Book Store"
          metaDescription={
            filteredBooks[0]?.metaDescription ||
            'Browse top sellers and recommended books in our online book store.'
          }
          keywords={
            filteredBooks
              .slice(0, 6)
              .map((b) => b?.keywords || b?.category)
              .filter(Boolean)
              .join(', ') || 'books, bookstore, top sellers, recommended'
          }
        />

        <Banner />

        {searchTerm && (
          <div
            className="animate-fade-up rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-sm text-slate-700"
            aria-live="polite"
          >
            Showing results for: <span className="font-bold">{searchTerm}</span>
            <span className="ml-2 text-slate-500">({filteredBooks.length} matches)</span>
          </div>
        )}

        {searchTerm && !hasSearchResults ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
            No books matched your search yet. Try a different keyword.
          </div>
        ) : (
          <>
            <TopSellers books={topSellersBooks} />
            <Recommened books={recommendedBooks.length > 0 ? recommendedBooks : topSellersBooks} />
          </>
        )}

        <News />
    </div>
  );
};

export default Home;