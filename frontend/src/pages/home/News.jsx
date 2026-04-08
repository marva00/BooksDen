import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Pagination, Navigation } from 'swiper/modules';
import { useFetchAllNewsQuery } from '../../redux/features/news/newsApi';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/261909/pexels-photo-261909.jpeg?auto=compress&cs=tinysrgb&w=1600';

const News = () => {
  const [swiperRef, setSwiperRef] = useState(null);
  const { data: news = [], isLoading } = useFetchAllNewsQuery();

  return (
    <section id="book-news" className="animate-fade-up scroll-mt-28 py-8 sm:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-slate-900 px-4 py-7 text-white shadow-[0_24px_50px_-30px_rgba(15,23,42,0.95)] sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Editorial Feed</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Book and Culture News</h2>
            <p className="mt-2 text-sm text-slate-300">Stay updated with stories shaping readers and creators.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => swiperRef?.slidePrev()}
              className="!bg-white/10 !text-white rounded-full border border-white/20 p-2.5 transition hover:!bg-white/20"
              aria-label="Scroll news left"
            >
              <FiChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => swiperRef?.slideNext()}
              className="!bg-amber-300 rounded-full border border-amber-300 p-2.5 text-slate-900 transition hover:!bg-amber-200"
              aria-label="Scroll news right"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        </div>

        <Swiper
          onSwiper={setSwiperRef}
          slidesPerView={1}
          spaceBetween={18}
          navigation={false}
          breakpoints={{
            640: {
              slidesPerView: 1,
              spaceBetween: 18,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            1200: {
              slidesPerView: 3,
              spaceBetween: 22,
            },
          }}
          modules={[Pagination, Navigation]}
          className="mySwiper"
        >
          {(news || []).map((item, index) => {
            const title = item?.title || 'Untitled article';
            const description = item?.description || 'No summary available yet.';
            const category = item?.category || 'Weekly Digest';
            const image = item?.image || FALLBACK_IMAGE;
            const sourceUrl = item?.sourceUrl || '';

            return (
              <SwiperSlide key={item?._id || item?.id || index}>
                <article className="group h-full overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/15">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={image}
                      alt={title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-4">
                    <p className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
                      <FiCalendar className="size-3" />
                      {category}
                    </p>

                    {sourceUrl ? (
                      <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 block text-lg font-semibold leading-snug text-white transition hover:text-amber-200"
                      >
                        {title}
                      </a>
                    ) : (
                      <h3 className="mt-3 block text-lg font-semibold leading-snug text-white">{title}</h3>
                    )}

                    <p className="mt-2 line-clamp-3 text-sm text-slate-300">{description}</p>

                    {sourceUrl && (
                      <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center text-sm font-semibold text-amber-200 transition hover:text-amber-100"
                      >
                        Read article
                      </a>
                    )}
                  </div>
                </article>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {!isLoading && (!news || news.length === 0) && (
          <div className="mt-5 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-6 text-center text-sm text-slate-300">
            News feed is currently being updated. Please check back shortly.
          </div>
        )}
      </div>
    </section>
  );
};

export default News;