import { Link } from "react-router-dom";
import { HiOutlineHeart, HiOutlineShoppingCart } from "react-icons/hi2";
import { HiOutlineUser } from "react-icons/hi";
import { BsBook } from "react-icons/bs";

import avatarImg from "../assets/avatar.png"
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext";
import { hydrateWishlist } from "../redux/features/wishlist/wishlistSlice";
import { hydrateCart } from "../redux/features/cart/cartSlice";

const navigation = [
    {name: "Dashboard", href:"/user-dashboard"},
    {name: "Orders", href:"/orders"},
    {name: "Cart Page", href:"/cart"},
    {name: "Check Out", href:"/checkout"},
]

const Navbar = () => {

    const  [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const cartItems = useSelector(state => state.cart.cartItems);
    const dispatch = useDispatch();
   
    const {currentUser, logout} = useAuth()
    
    const handleLogOut = () => {
        logout()
    }

    const token = localStorage.getItem('token');

    useEffect(() => {
        dispatch(hydrateWishlist(currentUser?.id || null));
        dispatch(hydrateCart(currentUser?.id || null));
    }, [currentUser?.id, dispatch]);
  
    return (
        <header className="bg-gradient-to-r from-violet-50 via-indigo-50 to-purple-50 border-b border-violet-100 shadow-sm">
            <nav className="max-w-screen-2xl mx-auto px-4 py-4 flex justify-between items-center">
                {/* left side */}
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 border border-violet-100 shadow-sm hover:shadow transition-shadow">
                        <BsBook className="size-5 text-violet-700" />
                        <span className="font-extrabold text-sm sm:text-base tracking-wide text-violet-900">BOOKSDEN</span>
                    </Link>
                </div>


                {/* rigth side */}
                <div className="relative flex items-center md:space-x-3 space-x-2">
                    <div >
                        {
                            currentUser ? <>
                            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                <img src={avatarImg} alt="" className={`size-8 rounded-full ${currentUser ? 'ring-2 ring-violet-500' : ''}`} />
                            </button>
                            {/* show dropdowns */}
                            {
                                isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-52 bg-white shadow-xl rounded-xl z-40 border border-violet-100">
                                        <ul className="py-2">
                                            {
                                                navigation.map((item) => (
                                                    <li key={item.name} onClick={() => setIsDropdownOpen(false)}>
                                                        <Link to={item.href} className="block px-4 py-2 text-sm hover:bg-violet-50">
                                                            {item.name}
                                                        </Link>
                                                    </li>
                                                ))
                                            }
                                            <li>
                                                <button
                                                onClick={handleLogOut}
                                                className="block w-full text-left px-4 py-2 text-sm hover:bg-violet-50">Logout</button>
                                            </li>
                                        </ul>
                                    </div>
                                )
                            }
                            </> : token ? (
                                <Link to="/dashboard" className="inline-flex items-center p-2 rounded-full bg-white/80 border border-violet-100 hover:bg-white">
                                    <HiOutlineUser className="size-6" />
                                </Link>
                            ) : (
                                <Link to="/login" className="inline-flex items-center p-2 rounded-full bg-white/80 border border-violet-100 hover:bg-white"> <HiOutlineUser className="size-6" /></Link>
                            )
                        }
                    </div>
                    
                    <Link to="/favorites" className="hidden sm:block p-2 rounded-full bg-white/80 border border-violet-100 hover:bg-white" aria-label="Favorites">
                        <HiOutlineHeart className="size-6" />
                    </Link>

                    <Link to="/cart" className="bg-violet-600 text-white p-2 sm:px-5 px-3 flex items-center rounded-full hover:bg-violet-700 transition-colors shadow-sm">
                        <HiOutlineShoppingCart className='' />
                        {
                            cartItems.length > 0 ?  <span className="text-sm font-semibold sm:ml-1">{cartItems.length}</span> :  <span className="text-sm font-semibold sm:ml-1">0</span>
                        }
                        
                       
                    </Link>
                </div>
            </nav>
        </header>
    )
}

export default Navbar;