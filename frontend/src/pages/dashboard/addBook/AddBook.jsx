import React, { useState } from 'react'
import InputField from './InputField'
import SelectField from './SelectField'
import { useForm } from 'react-hook-form';
import { useAddBookMutation } from '../../../redux/features/books/booksApi';
import Swal from 'sweetalert2';
import { getImgUrl } from '../../../utils/getImgUrl';

const AddBook = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const [addBook, {isLoading, isError}] = useAddBookMutation()
    const [imageFileName, setimageFileName] = useState('')
    const [imageDataUrl, setImageDataUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
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
            // Ensure payload shape is stable for backend + homepage rendering.
            trending: !!data.trending,
            oldPrice,
            newPrice,
            slug: data.slug || '',
            // Persist uploaded image data so frontend can render it from API.
            coverImage: imageDataUrl || 'book-1.png'
        }
        try {
            await addBook(newBookData).unwrap();
            Swal.fire({
                title: "Book added",
                text: "Your book is uploaded successfully!",
                icon: "success",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Yes, It's Okay!"
              });
              reset();
              setimageFileName('')
              setImageDataUrl('');
                setImagePreview('');
        } catch (error) {
            console.error(error);
            alert("Failed to add book. Please try again.")   
        }
      
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if(file) {
            setimageFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                setImageDataUrl(reader.result);
                setImagePreview(reader.result);
              }
            };
            reader.readAsDataURL(file);
        } else {
            setimageFileName('');
            setImageDataUrl('');
            setImagePreview('');
        }
    }
  return (
    <div className="max-w-lg   mx-auto md:p-6 p-3 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Book</h2>

      {/* Form starts here */}
      <form onSubmit={handleSubmit(onSubmit)} className=''>
        {/* Reusable Input Field for Title */}
        <InputField
          label="Title"
          name="title"
          placeholder="Enter book title"
          register={register}
        />

        {/* Reusable Textarea for Description */}
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

        {/* Reusable Select Field for Category */}
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
            // Add more options as needed
          ]}
          register={register}
        />

        {/* Trending Checkbox */}
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

        {/* Old Price */}
        <InputField
          label="Old Price"
          name="oldPrice"
          type="number"
          placeholder="Old Price"
          register={register}
         
        />

        {/* New Price */}
        <InputField
          label="New Price"
          name="newPrice"
          type="number"
          placeholder="New Price"
          register={register}
          
        />

        {/* Cover Image Upload */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image</label>
          {imagePreview && (
            <img
              src={getImgUrl(imagePreview)}
              alt="Selected cover preview"
              className="h-32 w-24 object-cover border rounded mb-2"
            />
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} className="mb-2 w-full" />
          {imageFileName && <p className="text-sm text-gray-500">Selected: {imageFileName}</p>}
        </div>

        {/* Submit Button */}
        <button type="submit" className="w-full py-2 bg-green-500 text-white font-bold rounded-md">
         {
            isLoading ? <span className="">Adding.. </span> : <span>Add Book</span>
          }
        </button>
      </form>
    </div>
  )
}

export default AddBook