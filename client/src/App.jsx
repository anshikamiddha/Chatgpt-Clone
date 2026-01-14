import React from "react";
import Sidebar from "./components/Sidebar.jsx";
import { Route, Routes, useLocation } from "react-router-dom";
import Chatbox from "./components/Chatbot.jsx";
import Credits from "./pages/Credits.jsx";
import Community from "./pages/Community.jsx";
import Loading from "./pages/Loading.jsx";
import Login from "./pages/Login.jsx";
import { assets } from "./assets/assets.js";
import "./assets/prism.css";
import { useAppContext } from "./context/AppContext.jsx";
import {Toaster} from 'react-hot-toast';
const App = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(true);
  const { pathname } = useLocation();
  const { user } = useAppContext();

  const hideSidebar = pathname === "/loading";

  return (
    
    <div className="bg-white text-black dark:bg-gradient-to-b dark:from-[#242124] dark:to-black dark:text-white transition-all duration-500">
      <Toaster/>
      
      {user ? (
        <>
          {!hideSidebar && !isMenuOpen && (
            <img
              src={assets.menu_icon}
              alt="menu"
              className="w-8 h-8 absolute top-3 left-3 cursor-pointer not-dark:invert md:hidden z-20"
              onClick={() => setIsMenuOpen(true)}
            />
          )}

          <div className="flex h-screen w-screen overflow-hidden">

            {!hideSidebar && (
              <div className={`${isMenuOpen ? "block" : "hidden"} md:block`}>
                <Sidebar
                  ismenuopen={isMenuOpen}
                  setismenuopen={setIsMenuOpen}
                />
              </div>
            )}

            <div className="flex-1">
              <Routes>
                <Route path="/loading" element={<Loading />} />
                <Route path="/" element={<Chatbox />} />
                <Route path="/credits" element={<Credits />} />
                <Route path="/community" element={<Community />} />
              </Routes>
            </div>

          </div>
        </>
      ) : (
        <div className="bg-gradient-to-b from-[#242124] to-black flex items-center justify-center h-screen w-screen">
          <Login />
        </div>
      )}
    </div>
  );
};

export default App;
