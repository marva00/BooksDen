import React, { useEffect, useState } from 'react'
import InputField from '../addBook/InputField'
import SelectField from '../addBook/SelectField'
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useFetchBookByIdQuery, useUpdateBookMutation } from '../../../redux/features/books/booksApi';
import Loading from '../../../components/Loading';
import Swal from 'sweetalert2';
import { getImgUrl } from '../../../utils/getImgUrl';

const UpdateBook = () => {
  const { id } = useParams();
  const { data: bookData, isLoading, isError, refetch } = useFetchBookByIdQuery(id);
  // console.log(bookData)
  const [updateBook] = useUpdateBookMutation();
  const { register, handleSubmit, setValue } = useForm();
  const [imageFileName, setImageFileName] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (bookData) {
      setValue('title', bookData.title);
      setValue('description', bookData.description);
      setValue('seoTitle', bookData.seoTitle || '');
      setValue('metaDescription', bookData.metaDescription || '');
      setValue('keywords', bookData.keywords || '');
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
      seoTitle: data.seoTitle || '',
      metaDescription: data.metaDescription || '',
      keywords: data.keywords || '',
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
    } catch (error) {
      alert("Failed to update book.");
    }
  }
  if (isLoading) return <Loading />
  if (isError) return <div>Error fetching book data</div>
  return (
    <div className="max-w-lg mx-auto md:p-6 p-3 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Update Book</h2>

      <form onSubmit={handleSubmit(onSubmit)}>
        <InputField
          label="Title"
          name="title"
          placeholder="Enter book title"
          register={register}
        />

        <InputField
          label="Description"
          name="description"
          placeholder="Enter book description"
          type="textarea"
          register={register}
        />

        <InputField
          label="SEO Title"
          name="seoTitle"
          placeholder="Enter SEO title"
          register={register}
        />

        <InputField
          label="Meta Description"
          name="metaDescription"
          placeholder="Enter meta description"
          register={register}
        />

        <InputField
          label="Keywords"
          name="keywords"
          placeholder="keyword1, keyword2, keyword3"
          register={register}
        />

        <InputField
          label="Slug"
          name="slug"
          placeholder="book-title-clean-url"
          register={register}
        />

        <SelectField
          label="Category"
          name="category"
          options={[
            { value: '', label: 'Choose A Category' },
            { value: 'business', label: 'Business' },
            { value: 'technology', label: 'Technology' },
            { value: 'fiction', label: 'Fiction' },
            { value: 'horror', label: 'Horror' },
            { value: 'adventure', label: 'Adventure' },
          ]}
          register={register}
        />
        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              {...register('trending')}
              className="rounded text-blue-600 focus:ring focus:ring-offset-2 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-semibold text-gray-700">Trending</span>
          </label>
        </div>

        <InputField
          label="Old Price"
          name="oldPrice"
          type="number"
          placeholder="Old Price"
          register={register}
        />

        <InputField
          label="New Price"
          name="newPrice"
          type="number"
          placeholder="New Price"
          register={register}
        />

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image</label>
          {imagePreview && (
            <img
              src={getImgUrl(imagePreview)}
              alt="Book cover preview"
              className="h-32 w-24 object-cover border rounded mb-2"
            />
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} className="mb-2 w-full" />
          {imageFileName && <p className="text-sm text-gray-500">Selected: {imageFileName}</p>}
          {!imageFileName && (
            <p className="text-xs text-gray-500">Leave it unchanged to keep the current image.</p>
          )}
        </div>

        <button type="submit" className="w-full py-2 bg-blue-500 text-white font-bold rounded-md">
          Update Book
        </button>
      </form>
    </div>
  )
}

export default UpdateBook