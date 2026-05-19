import React, { useMemo } from 'react';
import Banner from './Banner';
import TopSellers from './TopSellers';
import Recommened from './Recommened';
import News from './News';
import { useFetchAllBooksQuery } from '../../redux/features/books/booksApi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import BookCard from '../books/BookCard';
import { FiSearch, FiX } from 'react-icons/fi';

const TOP_SELLERS_RANGE = { start: 0, end: 8 };
const RECOMMENDED_RANGE = { start: 8, end: 16 };

const buildSearchBlob = (book = {}) => {
  return [
    book?.title,
    book?.name,
    book?.description,
    book?.category,
    book?.author,
    book?.brand,
    book?.keywords,
    book?.metaDescription,
    book?.seo?.keywords,
    book?.seo?.metaDescription,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

const getRelevanceScore = (book, searchTokens) => {
  if (!searchTokens.length) return 0;

  const title = `${book?.title || book?.name || ''}`.toLowerCase();
  const category = `${book?.category || ''}`.toLowerCase();
  const author = `${book?.author || ''}`.toLowerCase();
  const description = `${book?.description || ''}`.toLowerCase();

  return searchTokens.reduce((score, token) => {
    let tokenScore = 0;
    if (title === token) tokenScore += 60;
    if (title.startsWith(token)) tokenScore += 20;
    if (title.includes(token)) tokenScore += 14;
    if (author.includes(token)) tokenScore += 10;
    if (category.includes(token)) tokenScore += 8;
    if (description.includes(token)) tokenScore += 4;
    return score + tokenScore;
  }, 0);
};

const Home = () => {
  const { data: books = [], isLoading, isError } = useFetchAllBooksQuery();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const searchTermRaw = (params.get('search') || '').trim();
  const searchTerm = searchTermRaw.toLowerCase();
  const searchTokens = useMemo(
    () => searchTerm.split(/\s+/).map((token) => token.trim()).filter(Boolean),
    [searchTerm]
  );

  // Make older DB documents safe to render even if some fields are missing.
  const safeBooks = useMemo(
    () =>
      (books ?? []).map((book) => ({
        ...book,
        title:
          typeof book?.title === 'string' && book.title.trim() ? book.title : (book?.name || 'Untitled Book'),
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
      })),
    [books]
  );

  const searchResults = useMemo(() => {
    if (!searchTokens.length) return [];

    const matchingBooks = safeBooks.filter((book) => {
      const blob = buildSearchBlob(book);
      return searchTokens.every((token) => blob.includes(token));
    });

    return [...matchingBooks].sort((a, b) => {
      const bScore = getRelevanceScore(b, searchTokens);
      const aScore = getRelevanceScore(a, searchTokens);
      return bScore - aScore;
    });
  }, [safeBooks, searchTokens]);

  // Keep fixed ranges for homepage sections when no search query is active.
  const topSellersBooks = safeBooks.slice(TOP_SELLERS_RANGE.start, TOP_SELLERS_RANGE.end);
  const recommendedBooks = safeBooks.slice(RECOMMENDED_RANGE.start, RECOMMENDED_RANGE.end);

  const showSearchView = Boolean(searchTokens.length);
  const clearSearch = () => navigate('/');

  if (showSearchView) {
    return (
      <div className="space-y-5 pb-6">
        <SEO
          title={`Search: ${searchTermRaw} | Book Store`}
          metaDescription={`Search results for \"${searchTermRaw}\" across the complete Booksden inventory.`}
          keywords={`${searchTermRaw}, books, search, inventory`}
          canonical={`/?search=${encodeURIComponent(searchTermRaw)}`}
        />

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">
                <FiSearch className="h-3.5 w-3.5" />
                Inventory Search
              </p>
              <h1 className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">Search Results</h1>
              <p className="mt-2 text-sm text-slate-600">
                Showing matches for <span className="font-semibold text-slate-900">"{searchTermRaw}"</span> across the full inventory.
              </p>
            </div>

            <button
              type="button"
              onClick={clearSearch}
              className="!bg-white !text-slate-700 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:!bg-slate-100"
            >
              <FiX className="h-4 w-4" />
              Clear Search
            </button>
          </div>

          {!isLoading && !isError && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <article className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Matches</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{searchResults.length}</p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Total Inventory</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{safeBooks.length}</p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Search Scope</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Titles, categories, authors, descriptions</p>
              </article>
            </div>
          )}
        </section>

        {isLoading ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-[31rem] animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
            ))}
          </section>
        ) : isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-center text-sm font-medium text-rose-700">
            We could not load inventory right now. Please try again.
          </div>
        ) : searchResults.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
            <h2 className="text-xl font-bold text-slate-900">No books found</h2>
            <p className="mt-2 text-sm text-slate-500">Try searching with title, author, category, or fewer keywords.</p>
            <Link to="/" className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
              Back to Homepage
            </Link>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {searchResults.map((book, index) => (
              <BookCard key={book?._id || book?.id || `${book?.title}-${index}`} book={book} />
            ))}
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
        <SEO
          title="Home | Book Store"
          metaDescription={
            safeBooks[0]?.metaDescription ||
            'Browse top sellers and recommended books in our online book store.'
          }
          keywords={
            safeBooks
              .slice(0, 6)
              .map((b) => b?.keywords || b?.category)
              .filter(Boolean)
              .join(', ') || 'books, bookstore, top sellers, recommended'
          }
        />

        <Banner />

        <TopSellers books={topSellersBooks} />
        <Recommened books={recommendedBooks.length > 0 ? recommendedBooks : topSellersBooks} />

        <News />
    </div>
  );
};

export default Home;