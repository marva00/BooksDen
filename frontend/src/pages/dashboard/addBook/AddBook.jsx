import React, { useMemo, useState } from 'react';
import InputField from './InputField';
import SelectField from './SelectField';
import { useForm } from 'react-hook-form';
import { useAddBookMutation } from '../../../redux/features/books/booksApi';
import Swal from 'sweetalert2';
import { getImgUrl } from '../../../utils/getImgUrl';

const CATEGORY_OPTIONS = [
  { value: '', label: 'Choose a category' },
  { value: 'business', label: 'Business' },
  { value: 'technology', label: 'Technology' },
  { value: 'fiction', label: 'Fiction' },
  { value: 'horror', label: 'Horror' },
  { value: 'adventure', label: 'Adventure' },
];

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const AddBook = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm();

  const [addBook, { isLoading }] = useAddBookMutation();
  const [imageFileName, setImageFileName] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  const watchedTitle = watch('title') || '';
  const watchedDescription = watch('description') || '';
  const watchedCategory = watch('category') || '';
  const watchedSeoTitle = watch('seoTitle') || '';
  const watchedMetaDescription = watch('metaDescription') || '';
  const watchedNewPrice = Number(watch('newPrice') || 0);
  const watchedOldPrice = Number(watch('oldPrice') || 0);
  const watchedTrending = Boolean(watch('trending'));

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
        label: 'Price setup',
        done: watchedOldPrice > 0 && watchedNewPrice > 0 && watchedOldPrice >= watchedNewPrice,
      },
      {
        label: 'SEO metadata',
        done: Boolean(watchedSeoTitle.trim()) && Boolean(watchedMetaDescription.trim()),
      },
      {
        label: 'Cover image',
        done: Boolean(imagePreview),
      },
    ],
    [
      imagePreview,
      watchedCategory,
      watchedDescription,
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

    const newBookData = {
      ...data,
      trending: !!data.trending,
      oldPrice,
      newPrice,
      slug: data.slug || '',
      coverImage: imageDataUrl || 'book-1.png',
    };

    try {
      await addBook(newBookData).unwrap();
      Swal.fire({
        title: 'Book added',
        text: 'Your book is uploaded successfully!',
        icon: 'success',
        confirmButtonColor: '#0f172a',
        confirmButtonText: 'Continue',
      });
      handleResetForm();
    } catch (error) {
      console.error(error);
      alert('Failed to add book. Please try again.');
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
            Publish storefront-ready books with structured details, SEO metadata, and pricing control.
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
            <h3 className="text-lg font-semibold text-slate-900">SEO and Discovery</h3>
            <p className="text-sm text-slate-500 mt-1">Improve discoverability in search and social previews.</p>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <InputField
                label="SEO Title"
                name="seoTitle"
                placeholder="Atomic Habits Book | Build Better Routines"
                register={register}
                registerOptions={{}}
                error={errors.seoTitle}
              />

              <InputField
                label="Slug"
                name="slug"
                placeholder="atomic-habits"
                register={register}
                registerOptions={{}}
                error={errors.slug}
              />

              <InputField
                label="Meta Description"
                name="metaDescription"
                placeholder="Practical guide to behavior change and lasting habits."
                register={register}
                registerOptions={{}}
                error={errors.metaDescription}
                wrapperClassName="md:col-span-2 space-y-1.5"
              />

              <InputField
                label="Keywords"
                name="keywords"
                placeholder="habits, productivity, self improvement"
                register={register}
                registerOptions={{}}
                error={errors.keywords}
                helperText="Separate each keyword with commas."
                wrapperClassName="md:col-span-2 space-y-1.5"
              />
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

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={handleResetForm}
              disabled={isLoading}
              className="admin-btn-secondary px-4 py-2"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className={`${isLoading ? 'admin-btn-disabled' : 'admin-btn-primary'} px-5 py-2`}
            >
              {isLoading ? 'Saving Product...' : 'Save Product'}
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