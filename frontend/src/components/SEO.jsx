import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Booksden';

const buildCanonical = (canonical) => {
  if (typeof window === 'undefined') return canonical || '';

  if (!canonical) {
    return `${window.location.origin}${window.location.pathname}${window.location.search}`;
  }

  if (/^https?:\/\//i.test(canonical)) return canonical;

  const normalizedPath = canonical.startsWith('/') ? canonical : `/${canonical}`;
  return `${window.location.origin}${normalizedPath}`;
};

const SEO = ({
  title,
  description,
  metaDescription,
  keywords,
  canonical,
  ogType = 'website',
  ogTitle,
  ogDescription,
  ogImage,
  noIndex = false,
}) => {
  const safeTitle = title || `${SITE_NAME} | Online Book Store`;
  const safeDescription =
    metaDescription || description || 'Discover, manage, and explore books in our online store.';
  const safeKeywords = keywords || 'books, bookstore, online books';
  const safeOgTitle = ogTitle || safeTitle;
  const safeOgDescription = ogDescription || safeDescription;
  const safeCanonical = buildCanonical(canonical);
  const safeOgImage = ogImage || '/book-1.png';
  const robots = noIndex ? 'noindex, nofollow' : 'index, follow';

  return (
    <Helmet prioritizeSeoTags>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} data-rh="true" />
      <meta name="robots" content={robots} />
      <meta property="og:description" content={safeOgDescription} />
      <meta property="og:title" content={safeOgTitle} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={safeOgImage} />
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={safeTitle} />
      <meta property="twitter:description" content={safeDescription} />
      <meta property="twitter:image" content={safeOgImage} />
      <meta name="keywords" content={safeKeywords} />
      {safeCanonical && <link rel="canonical" href={safeCanonical} />}
      {safeCanonical && <meta property="og:url" content={safeCanonical} />}
    </Helmet>
  );
};

export default SEO;
