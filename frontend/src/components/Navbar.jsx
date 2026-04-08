import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { HiOutlineHeart, HiOutlineShoppingCart } from "react-icons/hi2";
import { HiOutlineUser } from "react-icons/hi";
import { BsBook } from "react-icons/bs";
import { FiMenu, FiSearch, FiX } from "react-icons/fi";

import avatarImg from "../assets/avatar.png";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext";
import { hydrateWishlist } from "../redux/features/wishlist/wishlistSlice";
import { hydrateCart } from "../redux/features/cart/cartSlice";

const accountNavigation = [
    { name: "Dashboard", href: "/user-dashboard" },
    { name: "Orders", href: "/orders" },
    { name: "Cart", href: "/cart" },
    { name: "Checkout", href: "/checkout" },
];

const primaryLinks = [
    { name: "Home", href: "/" },
    { name: "Top Sellers", href: "/#top-sellers" },
    { name: "Recommended", href: "/#recommended" },
    { name: "Book News", href: "/#book-news" },
];

const Navbar = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const cartItems = useSelector((state) => state.cart.cartItems);
    const wishlistItems = useSelector((state) => state.wishlist.items);
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const profileMenuRef = useRef(null);

    const { currentUser, logout } = useAuth();
    const token = localStorage.getItem("token");

    useEffect(() => {
        dispatch(hydrateWishlist(currentUser?.id || null));
        dispatch(hydrateCart(currentUser?.id || null));
    }, [currentUser?.id, dispatch]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        setSearchText(params.get("search") || "");
    }, [location.search]);

    useEffect(() => {
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
    }, [location.pathname, location.search, location.hash]);

    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMobileMenuOpen]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        const handleEsc = (event) => {
            if (event.key === "Escape") {
                setIsDropdownOpen(false);
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEsc);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEsc);
        };
    }, []);

    const handleLogOut = () => {
        logout();
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const trimmedSearch = searchText.trim();
        if (trimmedSearch) {
            navigate(`/?search=${encodeURIComponent(trimmedSearch)}`);
            return;
        }
        navigate("/");
    };

    const scrollToSection = (sectionId) => {
        const targetSection = document.getElementById(sectionId);
        if (!targetSection) return;

        const nextTop = targetSection.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top: Math.max(nextTop, 0), behavior: "smooth" });
    };

    const handleHashNavigation = (event, href) => {
        const sectionId = href.split("#")[1];
        if (!sectionId) return;

        if (location.pathname === "/") {
            event.preventDefault();
            setIsMobileMenuOpen(false);
            setIsDropdownOpen(false);

            if (location.hash !== `#${sectionId}`) {
                navigate(`/#${sectionId}`);
            }

            window.requestAnimationFrame(() => {
                scrollToSection(sectionId);
            });
        }
    };

    const renderPrimaryLink = (item, isMobile = false) => {
        if (item.href.startsWith("/#")) {
            return (
                <Link
                    to={item.href}
                    onClick={(event) => handleHashNavigation(event, item.href)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isMobile
                            ? "block rounded-xl px-4 py-3 text-slate-700 hover:bg-slate-100"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                >
                    {item.name}
                </Link>
            );
        }

        return (
            <NavLink
                to={item.href}
                className={({ isActive }) =>
                    isMobile
                        ? `block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                                isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                            }`
                        : `rounded-full px-4 py-2 text-sm font-semibold transition ${
                                isActive
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`
                }
            >
                {item.name}
            </NavLink>
        );
    };

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-lg shadow-[0_14px_35px_-25px_rgba(15,23,42,0.55)]">
            <nav className="mx-auto flex h-20 max-w-screen-2xl items-center justify-between gap-3 px-5 sm:px-8 lg:px-10">
                <div className="flex items-center gap-3 lg:gap-6">
                    <Link
                        to="/"
                        className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                    >
                        <span className="inline-flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-white">
                            <BsBook className="size-4" />
                        </span>
                        <span className="text-sm font-black tracking-[0.18em] text-slate-900 sm:text-base">BOOKSDEN</span>
                    </Link>

                    <div className="hidden items-center gap-1 lg:flex">
                        {primaryLinks.map((item) => (
                            <div key={item.name}>{renderPrimaryLink(item)}</div>
                        ))}
                    </div>
                </div>

                <form
                    onSubmit={handleSearchSubmit}
                    className="hidden flex-1 items-center justify-center px-3 md:flex lg:max-w-md"
                >
                    <div className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 shadow-inner">
                        <FiSearch className="size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                            placeholder="Search books, authors, genres..."
                            className="w-full border-none bg-transparent text-sm text-slate-700 outline-none focus:ring-0"
                        />
                    </div>
                </form>

                <div className="relative flex items-center gap-1 sm:gap-2">
                    <Link
                        to="/favorites"
                        className="relative hidden rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:inline-flex"
                        aria-label="Favorites"
                    >
                        <HiOutlineHeart className="size-5" />
                        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-bold text-slate-900">
                            {wishlistItems.length}
                        </span>
                    </Link>

                    <Link
                        to="/cart"
                        className="relative inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 sm:px-4"
                    >
                        <HiOutlineShoppingCart className="size-5" />
                        <span className="hidden sm:inline">Cart</span>
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-bold text-slate-900">
                            {cartItems.length}
                        </span>
                    </Link>

                    <div className="relative" ref={profileMenuRef}>
                        {currentUser ? (
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen((prev) => !prev)}
                                className="!bg-white !text-slate-700 inline-flex items-center rounded-full border border-slate-200 p-1.5 transition hover:border-slate-300 hover:bg-slate-50"
                                aria-label="Open profile menu"
                                aria-expanded={isDropdownOpen}
                            >
                                <img src={avatarImg} alt="User avatar" className="size-7 rounded-full ring-2 ring-slate-900/20" />
                            </button>
                        ) : token ? (
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                aria-label="Go to dashboard"
                            >
                                <HiOutlineUser className="size-5" />
                            </Link>
                        ) : (
                            <Link
                                to="/login"
                                className="inline-flex items-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                aria-label="Go to login"
                            >
                                <HiOutlineUser className="size-5" />
                            </Link>
                        )}

                        {currentUser && isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
                                {accountNavigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleLogOut}
                                    className="!bg-transparent !text-rose-600 block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition hover:!bg-rose-50"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                        className="!bg-white !text-slate-700 inline-flex items-center rounded-full border border-slate-200 p-2 transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
                        aria-label="Toggle navigation menu"
                        aria-expanded={isMobileMenuOpen}
                    >
                        {isMobileMenuOpen ? <FiX className="size-5" /> : <FiMenu className="size-5" />}
                    </button>
                </div>
            </nav>

            {isMobileMenuOpen && (
                <div className="animate-fade-down border-t border-slate-200 bg-white px-5 pb-5 pt-3 sm:px-8 lg:hidden">
                    <form onSubmit={handleSearchSubmit} className="mb-4">
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <FiSearch className="size-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchText}
                                onChange={(event) => setSearchText(event.target.value)}
                                placeholder="Search books"
                                className="w-full border-none bg-transparent text-sm text-slate-700 outline-none focus:ring-0"
                            />
                        </div>
                    </form>

                    <div className="space-y-1">
                        {primaryLinks.map((item) => (
                            <div key={item.name}>{renderPrimaryLink(item, true)}</div>
                        ))}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <Link
                            to="/favorites"
                            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                            <HiOutlineHeart className="size-5" />
                            Favorites ({wishlistItems.length})
                        </Link>
                        <Link
                            to="/cart"
                            className="flex items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                        >
                            <HiOutlineShoppingCart className="size-5" />
                            Cart ({cartItems.length})
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;