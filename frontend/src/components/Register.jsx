import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from "react-hook-form"
import axios from 'axios';
import getBaseUrl from '../utils/baseURL';
import SEO from './SEO';
import { FiArrowRight, FiBookOpen, FiCheckCircle, FiLock, FiMail, FiUserPlus } from 'react-icons/fi';

const Register = () => {
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
      } = useForm()

      const onSubmit = async(data) => {
                setMessage("");
        try {
            const username = (data.email || '').trim().toLowerCase();
            const password = (data.password || '').trim();
            await axios.post(`${getBaseUrl()}/api/auth/register`, {
                username,
                password,
                role: 'user'
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            alert("User registered successfully!");
            navigate("/login");
        } catch (error) {
           const apiMessage = error?.response?.data?.message;
           setMessage(apiMessage || "Registration failed. Please try a different username and password.") 
           console.error(error)
        }
      }

    const passwordValue = watch('password', '');

  return (
        <section className='relative min-h-[72vh] py-6 sm:py-10'>
            <SEO
                title="Register | Booksden"
                metaDescription="Create your Booksden account to save favorites and place book orders online."
                keywords="booksden register, create account, bookstore signup"
                canonical="/register"
                noIndex
            />

            <div className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
                <div className='absolute -right-8 top-8 h-48 w-48 rounded-full bg-cyan-200/60 blur-3xl' />
                <div className='absolute left-2 top-28 h-52 w-52 rounded-full bg-sky-200/45 blur-3xl' />
            </div>

            <div className='mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_70px_-40px_rgba(15,23,42,0.6)] lg:grid-cols-[1.05fr_1fr]'>
                <aside className='hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-10 text-slate-100 lg:flex lg:flex-col lg:justify-between'>
                    <div>
                        <p className='inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300'>
                            <FiUserPlus className='h-3.5 w-3.5' />
                            Join Booksden
                        </p>
                        <h1 className='mt-5 text-3xl font-black leading-tight text-white'>Create your account in a minute.</h1>
                        <p className='mt-3 text-sm leading-6 text-slate-300'>
                            Start building your personal library, save books you love, and follow every order from checkout to delivery.
                        </p>
                    </div>

                    <ul className='mt-8 space-y-3 text-sm text-slate-200'>
                        <li className='flex items-start gap-3'>
                            <FiCheckCircle className='mt-0.5 h-4 w-4 text-cyan-300' />
                            Fast checkout with saved account details.
                        </li>
                        <li className='flex items-start gap-3'>
                            <FiCheckCircle className='mt-0.5 h-4 w-4 text-cyan-300' />
                            Wishlist sync across desktop and mobile.
                        </li>
                        <li className='flex items-start gap-3'>
                            <FiCheckCircle className='mt-0.5 h-4 w-4 text-cyan-300' />
                            Priority access to new arrivals and top deals.
                        </li>
                    </ul>
                </aside>

                <div className='px-5 py-7 sm:px-8 sm:py-9 md:px-10'>
                    <div className='mb-6'>
                        <p className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600'>
                            <FiBookOpen className='h-3.5 w-3.5 text-slate-500' />
                            Create Account
                        </p>
                        <h2 className='mt-4 text-2xl font-black text-slate-900 sm:text-3xl'>Register with Booksden</h2>
                        <p className='mt-2 text-sm text-slate-500'>Create your profile to start ordering and tracking books.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                        <div>
                            <label className='mb-1.5 block text-sm font-semibold text-slate-700' htmlFor='email'>Email Address</label>
                            <div className='relative'>
                                <FiMail className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                                <input
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: 'Enter a valid email address',
                                        },
                                    })}
                                    type='email'
                                    id='email'
                                    placeholder='you@example.com'
                                    className='h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-200'
                                />
                            </div>
                            {errors.email && <p className='mt-1.5 text-xs font-medium text-rose-600'>{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className='mb-1.5 block text-sm font-semibold text-slate-700' htmlFor='password'>Password</label>
                            <div className='relative'>
                                <FiLock className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                                <input
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: {
                                            value: 6,
                                            message: 'Password must be at least 6 characters',
                                        },
                                    })}
                                    type='password'
                                    id='password'
                                    placeholder='Create a password'
                                    className='h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-200'
                                />
                            </div>
                            {errors.password && <p className='mt-1.5 text-xs font-medium text-rose-600'>{errors.password.message}</p>}
                        </div>

                        <div>
                            <label className='mb-1.5 block text-sm font-semibold text-slate-700' htmlFor='confirmPassword'>Confirm Password</label>
                            <div className='relative'>
                                <FiLock className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                                <input
                                    {...register('confirmPassword', {
                                        required: 'Please confirm your password',
                                        validate: (value) => value === passwordValue || 'Passwords do not match',
                                    })}
                                    type='password'
                                    id='confirmPassword'
                                    placeholder='Re-enter your password'
                                    className='h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-200'
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p className='mt-1.5 text-xs font-medium text-rose-600'>{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {message && (
                            <p className='rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700'>
                                {message}
                            </p>
                        )}

                        <button
                            type='submit'
                            className='!bg-slate-900 hover:!bg-slate-700 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition'
                        >
                            <span>Create Account</span>
                            <FiArrowRight className='h-4 w-4' />
                        </button>
                    </form>

                    <p className='mt-5 text-sm text-slate-600'>
                        Already have an account?{' '}
                        <Link to='/login' className='font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-700'>
                            Login here
                        </Link>
                    </p>
                </div>
                        </div>
                </section>

  )
}

export default Register