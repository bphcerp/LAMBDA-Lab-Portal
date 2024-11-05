import { FunctionComponent, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { RxHamburgerMenu, RxCross2 } from "react-icons/rx";
import SidebarComponent from "../components/Sidebar";

const Layout: FunctionComponent = () => {
  const [isSideBarOpen, setISSideBarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/user/logout`, {
      method: "POST",
      credentials: "include",
    });
    navigate("/login");
  };

  return (
    <div className="flex flex-col w-screen h-screen">
      <SidebarComponent isOpen={isSideBarOpen} setIsOpen={setISSideBarOpen} />
      <div className="header relative flex w-full h-14 px-4 bg-gray-100 shadow-lg items-center justify-between">
        <div className="flex items-center space-x-3">
          {isSideBarOpen ? (
            <RxCross2
              className="hover:cursor-pointer"
              onClick={() => setISSideBarOpen(false)}
              size="30px"
            />
          ) : (
            <RxHamburgerMenu
              className="hover:cursor-pointer"
              onClick={() => setISSideBarOpen(true)}
              size="30px"
            />
          )}
          <Link to="/" className="flex items-center">
            <img className="w-32 h-auto" src="/logo.jpg" alt="Company Logo" />
          </Link>
        </div>
        <div className="flex items-center">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 hover:shadow-md transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex w-full grow overflow-y-auto p-2">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
