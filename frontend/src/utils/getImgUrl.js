function getImgUrl(name) {
    if (!name || typeof name !== 'string') return '';

    // Some legacy DB records store full external image URLs.
    if (/^https?:\/\//i.test(name)) return name;
    if (/^data:image\//i.test(name)) return name;

    // Otherwise treat it as a local book cover asset in public/books/.
    return name.includes('/') ? `/${name.replace(/^\/+/, '')}` : `/books/${name}`;
}

export {getImgUrl}
