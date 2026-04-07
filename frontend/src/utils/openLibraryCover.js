export const openLibraryCoverUrl = (isbn, size = 'L') => {
  if (!isbn || typeof isbn !== 'string') return '';
  const cleanIsbn = isbn.replace(/[^0-9Xx]/g, '');
  const normalizedSize = ['S', 'M', 'L'].includes(size.toUpperCase()) ? size.toUpperCase() : 'L';
  return `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-${normalizedSize}.jpg`;
};

export const addCoverUrlsToBooks = (books, size = 'L') => {
  if (!Array.isArray(books)) return [];
  return books.map((book) => ({
    ...book,
    coverUrl: book.isbn ? openLibraryCoverUrl(book.isbn, size) : undefined,
  }));
};
