import { useMemo, useState } from 'react';
import InputField from './InputField';
import SelectField from './SelectField';
import { useForm } from 'react-hook-form';
import { useAddBookMutation } from '../../../redux/features/books/booksApi';
import Swal from 'sweetalert2';
import { getImgUrl } from '../../../utils/getImgUrl';
import getBaseUrl from '../../../utils/baseURL';

const CATEGORY_OPTIONS = [
  { value: '', label: 'Choose a category' },
  { value: 'business', label: 'Business' },
  { value: 'technology', label: 'Technology' },
  { value: 'fiction', label: 'Fiction' },
  { value: 'horror', label: 'Horror' },
  { value: 'adventure', label: 'Adventure' },
];

const LANGUAGE_OPTIONS = [
  { value: '', label: 'Choose a language' },
  { value: 'English', label: 'English' },
  { value: 'Urdu', label: 'Urdu' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'French', label: 'French' },
  { value: 'Spanish', label: 'Spanish' },
];

const FORMAT_OPTIONS = [
  { value: '', label: 'Choose a format' },
  { value: 'Paperback', label: 'Paperback' },
  { value: 'Hardcover', label: 'Hardcover' },
  { value: 'Ebook', label: 'Ebook' },
  { value: 'Audiobook', label: 'Audiobook' },
];

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const AddBook = () => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm();

  const [addBook, { isLoading }] = useAddBookMutation();
  const [imageFileName, setImageFileName] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);

  const watchedTitle = watch('title') || '';
  const watchedDescription = watch('description') || '';
  const watchedCategory = watch('category') || '';
  const watchedAuthor = watch('author') || '';
  const watchedLanguage = watch('language') || '';
  const watchedFormat = watch('format') || '';
  const watchedSeoTitle = watch('seoTitle') || '';
  const watchedMetaDescription = watch('metaDescription') || '';
  const watchedKeywords = watch('keywords') || '';
  const watchedOgTitle = watch('ogTitle') || '';
  const watchedOgDescription = watch('ogDescription') || '';
  const watchedNewPrice = Number(watch('newPrice') || 0);
  const watchedOldPrice = Number(watch('oldPrice') || 0);
  const watchedTrending = Boolean(watch('trending'));
  const isSaving = isLoading || isGeneratingSeo;
  const hasSeoReview = Boolean(
    watchedSeoTitle.trim() ||
      watchedMetaDescription.trim() ||
      watchedKeywords.trim() ||
      watchedOgTitle.trim() ||
      watchedOgDescription.trim()
  );

  const discountRate = useMemo(() => {
    if (watchedOldPrice <= 0 || watchedNewPrice <= 0 || watchedOldPrice <= watchedNewPrice) {
      return 0;
    }
    return Math.round(((watchedOldPrice - watchedNewPrice) / watchedOldPrice) * 100);
  }, [watchedOldPrice, watchedNewPrice]);

  const checklistItems = useMemo(
    () => [
      {
        label: 'Product basics',
        done: Boolean(watchedTitle.trim()) && Boolean(watchedDescription.trim()) && Boolean(watchedCategory),
      },
      {
        label: 'Book metadata',
        done: Boolean(watchedAuthor.trim()) && Boolean(watchedLanguage) && Boolean(watchedFormat),
      },
      {
        label: 'Price setup',
        done: watchedOldPrice > 0 && watchedNewPrice > 0 && watchedOldPrice >= watchedNewPrice,
      },
      {
        label: 'SEO review',
        done: Boolean(watchedSeoTitle.trim()) && Boolean(watchedMetaDescription.trim()),
      },
      {
        label: 'Cover image',
        done: Boolean(imagePreview),
      },
    ],
    [
      imagePreview,
      watchedAuthor,
      watchedCategory,
      watchedDescription,
      watchedFormat,
      watchedLanguage,
      watchedMetaDescription,
      watchedNewPrice,
      watchedOldPrice,
      watchedSeoTitle,
      watchedTitle,
    ]
  );

  const handleResetForm = () => {
    reset();
    setImageFileName('');
    setImageDataUrl('');
    setImagePreview('');
  };

  const generateSeoTags = async ({ data, oldPrice, newPrice }) => {
    const product = {
      title: data.title || '',
      name: data.title || '',
      author: data.author || data.brand || '',
      brand: data.brand || data.author || '',
      genre: data.category || '',
      category: data.category || '',
      description: data.description || '',
      price: newPrice,
      oldPrice,
      newPrice,
      isbn: data.isbn || '',
      publisher: data.publisher || '',
      language: data.language || '',
      format: data.format || '',
    };

    const token = localStorage.getItem('token');
    const response = await fetch(`${getBaseUrl()}/api/ai/seo-tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ product }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.message || 'Failed to generate SEO tags.');
    }

    const seo = result?.seo || {};
    return {
      seoTitle: seo.metaTitle || '',
      metaDescription: seo.metaDescription || '',
      keywords: seo.keywords || '',
      ogTitle: seo.ogTitle || '',
      ogDescription: seo.ogDescription || '',
    };
  };

  const applySeoFields = (seoFields) => {
    setValue('seoTitle', seoFields.seoTitle || '', { shouldDirty: true });
    setValue('metaDescription', seoFields.metaDescription || '', { shouldDirty: true });
    setValue('keywords', seoFields.keywords || '', { shouldDirty: true });
    setValue('ogTitle', seoFields.ogTitle || '', { shouldDirty: true });
    setValue('ogDescription', seoFields.ogDescription || '', { shouldDirty: true });
  };

  const handleGenerateSeoReview = async () => {
    const data = {
      title: watchedTitle,
      description: watchedDescription,
      category: watchedCategory,
      author: watchedAuthor,
      isbn: watch('isbn') || '',
      publisher: watch('publisher') || '',
      language: watchedLanguage,
      format: watchedFormat,
    };
    const oldPrice = watchedOldPrice;
    const newPrice = watchedNewPrice;

    if (!data.title.trim() || !data.description.trim() || !data.category) {
      alert('Please add title, category, and description before generating SEO.');
      return;
    }

    setIsGeneratingSeo(true);
    try {
      const seoFields = await generateSeoTags({ data, oldPrice, newPrice });
      applySeoFields(seoFields);
    } catch (error) {
      console.error(error);
      alert(error?.message || 'Failed to generate SEO tags.');
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  const onSubmit = async (data) => {
    const oldPrice = Number(data.oldPrice);
    const newPrice = Number(data.newPrice);

    if (!Number.isFinite(oldPrice) || !Number.isFinite(newPrice) || oldPrice <= 0 || newPrice <= 0) {
      alert('Please enter valid positive prices.');
      return;
    }

    if (oldPrice < newPrice) {
      alert('Old Price should be greater than or equal to New Price.');
      return;
    }

    if (imageFileName && !imageDataUrl) {
      alert('Please wait for the selected image to finish processing and try again.');
      return;
    }

    const hasCompleteSeo =
      Boolean(data.seoTitle?.trim()) &&
      Boolean(data.metaDescription?.trim()) &&
      Boolean(data.keywords?.trim()) &&
      Boolean(data.ogTitle?.trim()) &&
      Boolean(data.ogDescription?.trim());

    setIsGeneratingSeo(!hasCompleteSeo);
    try {
      const generatedSeoFields = hasCompleteSeo ? {} : await generateSeoTags({ data, oldPrice, newPrice });
      const seoFields = {
        ...generatedSeoFields,
        ...(data.seoTitle?.trim() ? { seoTitle: data.seoTitle } : {}),
        ...(data.metaDescription?.trim() ? { metaDescription: data.metaDescription } : {}),
        ...(data.keywords?.trim() ? { keywords: data.keywords } : {}),
        ...(data.ogTitle?.trim() ? { ogTitle: data.ogTitle } : {}),
        ...(data.ogDescription?.trim() ? { ogDescription: data.ogDescription } : {}),
      };
      const finalSeoFields = hasCompleteSeo
        ? {
            seoTitle: data.seoTitle || '',
            metaDescription: data.metaDescription || '',
            keywords: data.keywords || '',
            ogTitle: data.ogTitle || '',
            ogDescription: data.ogDescription || '',
          }
        : seoFields;
      const newBookData = {
        ...data,
        ...finalSeoFields,
        trending: !!data.trending,
        oldPrice,
        newPrice,
        coverImage: imageDataUrl || 'book-1.png',
      };

      await addBook(newBookData).unwrap();
      Swal.fire({
        title: 'Book added',
        text: 'Your book is uploaded successfully with AI-generated SEO metadata.',
        icon: 'success',
        confirmButtonColor: '#0f172a',
        confirmButtonText: 'Continue',
      });
      handleResetForm();
    } catch (error) {
      console.error(error);
      alert(error?.message || 'Failed to add book. Please try again.');
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageDataUrl(reader.result);
          setImagePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setImageFileName('');
      setImageDataUrl('');
      setImagePreview('');
    }
  };

  return (
    <div className="space-y-6">
      <section className="card-surface overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-5 py-6 text-white">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Catalog Studio</p>
          <h2 className="mt-2 text-2xl font-semibold">Add New Product</h2>
          <p className="mt-2 text-sm text-slate-200 max-w-2xl">
            Publish storefront-ready books with structured details, pricing, and cover control.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr] items-start">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section className="card-surface bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">Product Information</h3>
            <p className="text-sm text-slate-500 mt-1">Set the details that customers see first.</p>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <InputField
                label="Title"
                name="title"
                placeholder="Atomic Habits"
                register={register}
                registerOptions={{ required: 'Title is required.' }}
                error={errors.title}
              />

              <SelectField
                label="Category"
                name="category"
                options={CATEGORY_OPTIONS}
                register={register}
                registerOptions={{ required: 'Category is required.' }}
                error={errors.category}
              />

              <InputField
                label="Author"
                name="author"
                placeholder="James Clear"
                register={register}
                registerOptions={{ required: 'Author is required.' }}
                error={errors.author}
              />

              <InputField
                label="ISBN"
                name="isbn"
                placeholder="9780735211292"
                register={register}
                registerOptions={{}}
                error={errors.isbn}
              />

              <SelectField
                label="Language"
                name="language"
                options={LANGUAGE_OPTIONS}
                register={register}
                registerOptions={{ required: 'Language is required.' }}
                error={errors.language}
              />

              <SelectField
                label="Format"
                name="format"
                options={FORMAT_OPTIONS}
                register={register}
                registerOptions={{ required: 'Format is required.' }}
                error={errors.format}
              />

              <InputField
                label="Publisher"
                name="publisher"
                placeholder="Avery"
                register={register}
                registerOptions={{}}
                error={errors.publisher}
              />
            </div>

            <div className="mt-4">
              <InputField
                label="Description"
                name="description"
                placeholder="Write a concise product summary for shoppers."
                type="textarea"
                register={register}
                registerOptions={{ required: 'Description is required.' }}
                error={errors.description}
                helperText="Aim for clear value, key takeaways, and audience fit."
              />
            </div>

            <div className="mt-4">
              <label className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  {...register('trending')}
                  className="h-4 w-4 rounded border-slate-400 text-slate-900 focus:ring-slate-900/20"
                />
                Mark as trending on storefront
              </label>
            </div>
          </section>

          <section className="card-surface bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">Pricing and Cover</h3>
            <p className="text-sm text-slate-500 mt-1">Configure list price, sale price, and product image.</p>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <InputField
                label="Old Price"
                name="oldPrice"
                type="number"
                placeholder="1800"
                register={register}
                registerOptions={{ required: 'Old price is required.' }}
                error={errors.oldPrice}
              />

              <InputField
                label="New Price"
                name="newPrice"
                type="number"
                placeholder="1450"
                register={register}
                registerOptions={{ required: 'New price is required.' }}
                error={errors.newPrice}
              />
            </div>

            {discountRate > 0 && (
              <p className="mt-3 inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Discount preview: {discountRate}% off
              </p>
            )}

            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <label className="block text-sm font-semibold text-slate-700">Cover Image</label>
              <p className="text-xs text-slate-500 mt-1">Upload a clear portrait cover for better visual quality.</p>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-3 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
              />

              {imageFileName && <p className="text-xs text-slate-600 mt-2">Selected: {imageFileName}</p>}
            </div>
          </section>

          <section className="card-surface bg-white p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">SEO Review</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Generate tags from the book details, then edit them before saving.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateSeoReview}
                disabled={isSaving}
                className={`${isSaving ? 'admin-btn-disabled' : 'admin-btn-primary'} px-4 py-2`}
              >
                {isGeneratingSeo ? 'Generating SEO...' : 'Auto-generate SEO'}
              </button>
            </div>

            {!hasSeoReview && (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                SEO tags will appear here after generation. Saving can also generate missing tags automatically.
              </div>
            )}

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <InputField
                label="SEO Title"
                name="seoTitle"
                placeholder="Generated search title"
                register={register}
                registerOptions={{}}
                error={errors.seoTitle}
              />

              <InputField
                label="OG Title"
                name="ogTitle"
                placeholder="Generated social title"
                register={register}
                registerOptions={{}}
                error={errors.ogTitle}
              />

              <InputField
                label="Meta Description"
                name="metaDescription"
                placeholder="Generated Google description"
                register={register}
                registerOptions={{}}
                error={errors.metaDescription}
                wrapperClassName="md:col-span-2 space-y-1.5"
              />

              <InputField
                label="OG Description"
                name="ogDescription"
                placeholder="Generated social description"
                register={register}
                registerOptions={{}}
                error={errors.ogDescription}
                wrapperClassName="md:col-span-2 space-y-1.5"
              />

              <InputField
                label="Keywords"
                name="keywords"
                placeholder="Generated keywords"
                register={register}
                registerOptions={{}}
                error={errors.keywords}
                helperText="Edit comma-separated keywords if needed."
                wrapperClassName="md:col-span-2 space-y-1.5"
              />
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={handleResetForm}
              disabled={isSaving}
              className="admin-btn-secondary px-4 py-2"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className={`${isSaving ? 'admin-btn-disabled' : 'admin-btn-primary'} px-5 py-2`}
            >
              {isGeneratingSeo ? 'Generating SEO...' : isLoading ? 'Saving Product...' : 'Save Product'}
            </button>
          </div>
        </form>

        <aside className="space-y-6 xl:sticky xl:top-24">
          <section className="card-surface bg-white p-5">
            <h3 className="text-base font-semibold text-slate-900">Publishing Checklist</h3>
            <p className="text-xs text-slate-500 mt-1">Complete these items before publishing.</p>

            <ul className="mt-4 space-y-2">
              {checklistItems.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
                >
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {item.done ? 'Ready' : 'Pending'}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card-surface bg-white p-5">
            <h3 className="text-base font-semibold text-slate-900">Live Preview</h3>
            <p className="text-xs text-slate-500 mt-1">How this product card may appear to shoppers.</p>

            <div className="mt-4 rounded-lg border border-slate-200 p-3">
              {imagePreview ? (
                <img
                  src={getImgUrl(imagePreview)}
                  alt="Selected cover preview"
                  className="h-48 w-full rounded-md object-cover"
                />
              ) : (
                <div className="h-48 w-full rounded-md border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-sm text-slate-500">
                  Cover preview appears here
                </div>
              )}

              <div className="mt-3 space-y-1.5">
                <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                  {watchedTitle.trim() || 'Product title preview'}
                </p>
                <p className="text-xs text-slate-500 capitalize">{watchedCategory || 'Uncategorized'}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-900">{formatCurrency(watchedNewPrice)}</span>
                  {watchedOldPrice > watchedNewPrice && (
                    <span className="text-xs text-slate-500 line-through">{formatCurrency(watchedOldPrice)}</span>
                  )}
                  {watchedTrending && (
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Trending
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default AddBook;
