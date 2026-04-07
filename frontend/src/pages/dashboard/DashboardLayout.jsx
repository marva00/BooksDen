import React, { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { HiViewGridAdd } from "react-icons/hi";
import { MdOutlineManageHistory } from "react-icons/md";
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "New order", text: "Order #4321 was placed 5 minutes ago.", time: "5m ago", read: false },
    { id: 2, title: "Inventory alert", text: "3 books are low in stock.", time: "18m ago", read: false },
    { id: 3, title: "Revenue update", text: "Today's sales crossed Rs. 250.", time: "1h ago", read: true },
  ]);

  const navigate = useNavigate()
  const { logout } = useAuth();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markOneRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearReadNotifications = () => {
    setNotifications((prev) => prev.filter((n) => !n.read));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/")
  }

  return (
    <section className="flex bg-bg min-h-screen overflow-hidden">
    <aside className="hidden sm:flex sm:flex-col w-20">
      <Link to="/" className="inline-flex items-center justify-center h-20 w-20 bg-secondary hover:bg-primary focus:bg-primary">
        <img src="/fav-icon.png" alt="" />
      </Link>
      <div className="flex-grow flex flex-col justify-between text-gray-300 bg-secondary">
        <nav className="flex flex-col mx-4 my-6 space-y-4">
          {/* Manage Books (folder icon) */}
          <NavLink
            to="/dashboard/manage-books"
            className={({ isActive }) =>
              `inline-flex items-center justify-center py-3 rounded-lg transition-colors ${
                isActive ? 'text-secondary bg-white' : 'hover:text-gray-100 hover:bg-gray-700'
              }`
            }
            title="Manage Books"
            aria-label="Manage Books"
          >
            <span className="sr-only">Manage Books</span>
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </NavLink>

          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `inline-flex items-center justify-center py-3 rounded-lg transition-colors ${
                isActive ? 'text-secondary bg-white' : 'hover:text-gray-100 hover:bg-gray-700'
              }`
            }
            title="Dashboard"
            aria-label="Dashboard"
          >
            <span className="sr-only">Dashboard</span>
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </NavLink>

          <NavLink
            to="/dashboard/add-new-book"
            className={({ isActive }) =>
              `inline-flex items-center justify-center py-3 rounded-lg transition-colors ${
                isActive ? 'text-secondary bg-white' : 'hover:text-gray-100 hover:bg-gray-700'
              }`
            }
            title="Add New Book"
            aria-label="Add New Book"
          >
            <span className="sr-only">Add Book</span>
            <HiViewGridAdd className="h-6 w-6"/>
          </NavLink>

          <NavLink
            to="/dashboard/manage-books"
            className={({ isActive }) =>
              `inline-flex items-center justify-center py-3 rounded-lg transition-colors ${
                isActive ? 'text-secondary bg-white' : 'hover:text-gray-100 hover:bg-gray-700'
              }`
            }
            title="Manage Books"
            aria-label="Manage Books"
          >
            <span className="sr-only">Documents</span>
            <MdOutlineManageHistory className="h-6 w-6"/>
          </NavLink>
        </nav>
        <div className="inline-flex items-center justify-center h-20 w-20 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="p-3 hover:text-gray-400 hover:bg-gray-700 focus:text-gray-400 focus:bg-gray-700 rounded-lg"
          >
            <span className="sr-only">Log out</span>
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
    <div className="flex-grow text-gray-800 min-w-0">
      <header className="flex items-center h-20 px-6 sm:px-10 bg-surface border-b border-border">
        <button className="block sm:hidden relative flex-shrink-0 p-2 mr-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus:bg-gray-100 focus:text-gray-800 rounded-full">
          <span className="sr-only">Menu</span>
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
        <div className="relative w-full max-w-md sm:-ml-2">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="absolute h-6 w-6 mt-2.5 ml-2 text-gray-400">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input type="text" role="search" placeholder="Search..." className="py-2 pl-10 pr-4 w-full border border-border bg-surface2 placeholder-gray-500 focus:bg-white rounded-lg" />
        </div>
        <div className="flex flex-shrink-0 items-center ml-auto">
          <button className="inline-flex items-center p-2 hover:bg-gray-100 focus:bg-gray-100 rounded-lg">
            <span className="sr-only">User Menu</span>
            <div className="hidden md:flex md:flex-col md:items-end md:leading-tight">
              <span className="font-semibold">Grace Simmons</span>
              <span className="text-sm text-gray-600">Lecturer</span>
            </div>
            <span className="h-12 w-12 ml-2 sm:ml-3 mr-2 bg-gray-100 rounded-full overflow-hidden">
              <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="user profile photo" className="h-full w-full object-cover"/>
            </span>
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="hidden sm:block h-6 w-6 text-gray-300">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg> 
          </button>
          <div className="border-l pl-3 ml-3 space-x-1">
            <button
              onClick={() => {
                setShowNotifications((prev) => !prev);
              }}
              className="relative p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:bg-gray-100 focus:text-gray-600 rounded-full"
            >
              <span className="sr-only">Notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            {showNotifications && (
              <div className="absolute right-20 top-16 w-80 bg-white border rounded-md shadow-lg z-50">
                <div className="flex items-center justify-between px-4 py-2 border-b">
                  <p className="font-semibold">Notifications ({unreadCount})</p>
                  <div className="flex gap-3">
                    <button onClick={markAllRead} className="text-sm text-secondary hover:underline">
                      Mark all read
                    </button>
                    <button onClick={clearReadNotifications} className="text-sm text-gray-500 hover:underline">
                      Clear read
                    </button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-gray-500">No notifications right now.</p>
                  ) : (
                    notifications.map((item) => (
                      <div key={item.id} className={`px-4 py-3 border-b last:border-b-0 ${item.read ? "bg-white" : "bg-slate-50"}`}>
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                          <span className="text-xs text-gray-500">{item.time}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{item.text}</p>
                        {!item.read && (
                          <button
                            onClick={() => markOneRead(item.id)}
                            className="mt-2 text-xs text-secondary hover:underline"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            <button
            onClick={handleLogout}
            className="relative p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:bg-gray-100 focus:text-gray-600 rounded-full">
              <span className="sr-only">Log out</span>
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 sm:p-10 space-y-6 ">
        <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row justify-between">
          <div className="mr-6">
            <h1 className="text-4xl font-semibold mb-2">Dashboard</h1>
            <h2 className="text-gray-600 ml-0.5">Book Store Inventory</h2>
          </div>
          <div className="flex flex-col md:flex-row items-start justify-end -mb-3">
            <Link to="/dashboard/manage-books" className="inline-flex px-5 py-3 text-secondary hover:text-gray-800 focus:text-gray-800 hover:bg-surface2 focus:bg-surface2 border border-border rounded-md mb-3">
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 -ml-1 mt-0.5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Manage Books
            </Link>
            <Link to="/dashboard/add-new-book" className="inline-flex px-5 py-3 text-white bg-secondary hover:bg-primary focus:bg-primary rounded-md ml-6 mb-3">
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-6 w-6 text-white -ml-1 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Book
            </Link>
          </div>
        </div>
       <Outlet/>
      </main>
    </div>
  </section>
  )
}

export default DashboardLayout