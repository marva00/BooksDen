import React, { useState } from 'react';
import BookCard from '../books/BookCard';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// import required modules
import { Pagination, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { useFetchAllBooksQuery } from '../../redux/features/books/booksApi';

const categories = ['All genres', 'Business', 'Technology', 'Fiction', 'Horror', 'Adventure'];

const TopSellers = ({ books: booksProp }) => {
    const [selectedCategory, setSelectedCategory] = useState('All genres');
    const [swiperRef, setSwiperRef] = useState(null);

    const { data: booksFromApi = [] } = useFetchAllBooksQuery(undefined, { skip: !!booksProp });
    const books = booksProp ?? booksFromApi;

    const filteredBooks =
        selectedCategory === 'All genres'
            ? books
            : books.filter((book) => (book?.category ?? '').toLowerCase() === selectedCategory.toLowerCase());

    const safeCountLabel = `${filteredBooks.length} title${filteredBooks.length === 1 ? '' : 's'}`;

    return (
        <section id="top-sellers" className="animate-fade-up scroll-mt-28 py-8 sm:py-10">
            <div className="rounded-[2rem] border border-slate-200 bg-white px-4 py-7 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.5)] sm:px-6 lg:px-8 lg:py-8">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Best Performing</p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Top Sellers</h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Browse our most-loved books picked by readers this week.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => swiperRef?.slidePrev()}
                            className="!bg-white !text-slate-700 rounded-full border border-slate-300 p-2.5 transition hover:!bg-slate-100"
                            aria-label="Scroll top sellers left"
                        >
                            <FiChevronLeft size={20} />
                        </button>
                        <button
                            type="button"
                            onClick={() => swiperRef?.slideNext()}
                            className="!bg-slate-900 rounded-full border border-slate-900 p-2.5 text-white transition hover:!bg-slate-700"
                            aria-label="Scroll top sellers right"
                        >
                            <FiChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <select
                        onChange={(event) => setSelectedCategory(event.target.value)}
                        name="category"
                        id="category"
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 sm:w-60"
                    >
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>

                    <p className="text-sm font-semibold text-slate-500">Showing {safeCountLabel}</p>
                </div>

                {filteredBooks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        No books found in this genre yet.
                    </div>
                ) : (
                    <Swiper
                        onSwiper={setSwiperRef}
                        slidesPerView={1}
                        spaceBetween={20}
                        navigation={false}
                        breakpoints={{
                            640: {
                                slidesPerView: 1,
                                spaceBetween: 20,
                            },
                            768: {
                                slidesPerView: 2,
                                spaceBetween: 22,
                            },
                            1200: {
                                slidesPerView: 3,
                                spaceBetween: 24,
                            },
                        }}
                        modules={[Pagination, Navigation]}
                        className="mySwiper"
                    >
                        {filteredBooks.map((book, index) => (
                            <SwiperSlide key={book?._id || book?.id || index}>
                                <BookCard book={book} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                )}
            </div>
        </section>
    );
};

export default TopSellers;