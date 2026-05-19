import { useEffect, useState } from 'react'
import InputField from '../addBook/InputField'
import SelectField from '../addBook/SelectField'
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useFetchBookByIdQuery, useUpdateBookMutation } from '../../../redux/features/books/booksApi';
import Loading from '../../../components/Loading';
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

const UpdateBook = () => {
  const { id } = useParams();
  const { data: bookData, isLoading, isError, refetch } = useFetchBookByIdQuery(id);
  // console.log(bookData)
  const [updateBook, { isLoading: isUpdating }] = useUpdateBookMutation();
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm();
  const [imageFileName, setImageFileName] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const isBusy = isUpdating || isGeneratingSeo;

  useEffect(() => {
    if (bookData) {
      setValue('title', bookData.title);
      setValue('description', bookData.description);
      setValue('author', bookData.author || '');
      setValue('isbn', bookData.isbn || '');
      setValue('language', bookData.language || '');
      setValue('format', bookData.format || '');
      setValue('publisher', bookData.publisher || '');
      setValue('seoTitle', bookData.seoTitle || '');
      setValue('metaDescription', bookData.metaDescription || '');
      setValue('keywords', bookData.keywords || '');
      setValue('ogTitle', bookData.ogTitle || bookData?.seo?.ogTitle || '');
      setValue('ogDescription', bookData.ogDescription || bookData?.seo?.ogDescription || '');
      setValue('slug', bookData.slug || '');
      setValue('category', bookData?.category);
      setValue('trending', bookData.trending);
      setValue('oldPrice', bookData.oldPrice);
      setValue('newPrice', bookData.newPrice);
      setImagePreview(bookData?.coverImage || bookData?.images?.[0] || 'book-1.png');
      setImageDataUrl('');
      setImageFileName('');
    }
  }, [bookData, setValue])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFileName('');
      setImageDataUrl('');
      setImagePreview(bookData?.coverImage || bookData?.images?.[0] || 'book-1.png');
      return;
    }

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImageDataUrl(reader.result);
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAutoGenerateSeo = async () => {
    const values = getValues();
    const product = {
      title: values.title || bookData?.title || bookData?.name || '',
      name: values.title || bookData?.name || '',
      author: bookData?.author || bookData?.brand || '',
      brand: bookData?.brand || bookData?.author || '',
      genre: values.category || bookData?.category || '',
      category: values.category || bookData?.category || '',
      description: values.description || bookData?.description || '',
      price: values.newPrice || bookData?.newPrice || bookData?.price,
      oldPrice: values.oldPrice || bookData?.oldPrice,
      newPrice: values.newPrice || bookData?.newPrice || bookData?.price,
      isbn: values.isbn || bookData?.isbn || '',
      publisher: values.publisher || bookData?.publisher || '',
      language: values.language || bookData?.language || '',
      format: values.format || bookData?.format || '',
      slug: values.slug || bookData?.slug || '',
    };

    if (!product.title.trim() && !product.description.trim()) {
      alert('Please add a title or description before generating SEO tags.');
      return;
    }

    setIsGeneratingSeo(true);
    try {
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
      setValue('seoTitle', seo.metaTitle || '', { shouldDirty: true });
      setValue('metaDescription', seo.metaDescription || '', { shouldDirty: true });
      setValue('keywords', seo.keywords || '', { shouldDirty: true });
      setValue('ogTitle', seo.ogTitle || '', { shouldDirty: true });
      setValue('ogDescription', seo.ogDescription || '', { shouldDirty: true });
    } catch (error) {
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

    const updateBookData = {
      title: data.title,
      description: data.description,
      author: data.author || '',
      isbn: data.isbn || '',
      language: data.language || '',
      format: data.format || '',
      publisher: data.publisher || '',
      seoTitle: data.seoTitle || '',
      metaDescription: data.metaDescription || '',
      keywords: data.keywords || '',
      ogTitle: data.ogTitle || '',
      ogDescription: data.ogDescription || '',
      slug: data.slug || '',
      category: data.category,
      trending: data.trending,
      oldPrice,
      newPrice,
      coverImage: imageDataUrl || bookData?.coverImage || bookData?.images?.[0] || 'book-1.png',
    };
    try {
      await updateBook({ id, ...updateBookData }).unwrap();
      Swal.fire({
        title: "Book Updated",
        text: "Your book is updated successfully!",
        icon: "success",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, It's Okay!"
      });
      await refetch()
    } catch {
      alert("Failed to update book.");
    }
  }
  if (isLoading) return <Loading />
  if (isError) return <div>Error fetching book data</div>
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold text-slate-900">Update Product</h2>
        <p className="text-sm text-slate-500">Edit book details, review SEO tags, and save storefront changes.</p>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="card-surface bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-900">Product Information</h3>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <InputField
              label="Title"
              name="title"
              placeholder="Enter book title"
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
              placeholder="Enter author name"
              register={register}
              registerOptions={{}}
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
              registerOptions={{}}
              error={errors.language}
            />

            <SelectField
              label="Format"
              name="format"
              options={FORMAT_OPTIONS}
              register={register}
              registerOptions={{}}
              error={errors.format}
            />

            <InputField
              label="Publisher"
              name="publisher"
              placeholder="Enter publisher"
              register={register}
              registerOptions={{}}
              error={errors.publisher}
            />
          </div>

          <div className="mt-4">
            <InputField
              label="Description"
              name="description"
              placeholder="Enter book description"
              type="textarea"
              register={register}
              registerOptions={{ required: 'Description is required.' }}
              error={errors.description}
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
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">SEO Review</h3>
              <p className="text-sm text-slate-500 mt-1">Generate and edit title, description, keywords, and Open Graph tags.</p>
            </div>
            <button
              type="button"
              onClick={handleAutoGenerateSeo}
              disabled={isBusy}
              className={`${isBusy ? 'admin-btn-disabled' : 'admin-btn-primary'} px-4 py-2`}
            >
              {isGeneratingSeo ? 'Generating SEO...' : 'Auto-generate SEO'}
            </button>
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <InputField
              label="SEO Title"
              name="seoTitle"
              placeholder="Enter SEO title"
              register={register}
              registerOptions={{}}
              error={errors.seoTitle}
            />

            <InputField
              label="OG Title"
              name="ogTitle"
              placeholder="Enter Open Graph title"
              register={register}
              registerOptions={{}}
              error={errors.ogTitle}
            />

            <InputField
              label="Meta Description"
              name="metaDescription"
              placeholder="Enter meta description"
              register={register}
              registerOptions={{}}
              error={errors.metaDescription}
              wrapperClassName="md:col-span-2 space-y-1.5"
            />

            <InputField
              label="OG Description"
              name="ogDescription"
              placeholder="Enter Open Graph description"
              register={register}
              registerOptions={{}}
              error={errors.ogDescription}
              wrapperClassName="md:col-span-2 space-y-1.5"
            />

            <InputField
              label="Keywords"
              name="keywords"
              placeholder="keyword1, keyword2, keyword3"
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
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <InputField
              label="Slug"
              name="slug"
              placeholder="book-title-clean-url"
              register={register}
              registerOptions={{}}
              error={errors.slug}
            />

            <InputField
              label="Old Price"
              name="oldPrice"
              type="number"
              placeholder="Old Price"
              register={register}
              registerOptions={{ required: 'Old price is required.' }}
              error={errors.oldPrice}
            />

            <InputField
              label="New Price"
              name="newPrice"
              type="number"
              placeholder="New Price"
              register={register}
              registerOptions={{ required: 'New price is required.' }}
              error={errors.newPrice}
            />
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <label className="block text-sm font-semibold text-slate-700">Cover Image</label>
            {imagePreview && (
              <img
                src={getImgUrl(imagePreview)}
                alt="Book cover preview"
                className="mt-3 h-32 w-24 object-cover border rounded-md"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-3 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
            />
            {imageFileName && <p className="text-xs text-slate-600 mt-2">Selected: {imageFileName}</p>}
            {!imageFileName && (
              <p className="text-xs text-slate-500 mt-2">Leave it unchanged to keep the current image.</p>
            )}
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isBusy}
            className={`${isBusy ? 'admin-btn-disabled' : 'admin-btn-primary'} px-5 py-2`}
          >
            {isUpdating ? 'Updating Product...' : 'Update Product'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default UpdateBook
