import React from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import moment from "moment";
import toast from "react-hot-toast";

const Sidebar = ({ ismenuopen, setismenuopen }) => {
  const {
    chats,
    setSelectedChat,
    theme,
    setTheme,
    user,
    navigate,
    createNewChat,
    axios,
    setChats,
    fetchUserChats,
    setToken,
  } = useAppContext();

  const [search, setSearch] = React.useState("");

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    toast.success("Logged out successfully");
  };

  // Delete Chat
  const deleteChat = async (e, chatId) => {
    e.stopPropagation();

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this chat?"
    );
    if (!confirmDelete) return;

    try {
      const { data } = await axios.post(
        "/api/chat/delete",
        { chatId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (data.success) {
        setChats((prev) => prev.filter((chat) => chat._id !== chatId));
        await fetchUserChats();
        toast.success(data.message);
      } else {
        toast.error(data.message || "Failed to delete chat");
      }
    } catch (error) {
      toast.error("Failed to delete chat");
    }
  };

  return (
    <div
      className="
        flex flex-col h-screen min-w-72 p-5
        dark:bg-gradient-to-b from-[#242124]/30 to-[#000000]/30
        border-r border-[#80609F]/30 backdrop-blur-3xl
        transition-all duration-300
      "
    >
      {/* Close icon (mobile) */}
      <img
        src={assets.close_icon}
        alt="close"
        onClick={() => setismenuopen(false)}
        className="absolute top-3 right-3 w-5 h-5 cursor-pointer md:hidden not-dark:invert"
      />

      {/* Logo */}
      <img
        src={theme === "dark" ? assets.logo_full : assets.logo_full_dark}
        alt="logo"
        className="w-full max-w-48"
      />

      {/* New Chat */}
      <button
        onClick={createNewChat}
        className="flex justify-center items-center w-full py-2 mt-10 text-white bg-gradient-to-r from-[#A456F7] to-[#3D81F6] text-sm rounded-md"
      >
        <span className="mr-2 text-xl">+</span>
        New Chat
      </button>

      {/* Search */}
      <div className="flex items-center gap-2 p-3 mt-4 border border-gray-400 dark:border-white/20 rounded-md">
        <img src={assets.search_icon} className="w-4 dark:invert" alt="" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="text"
          placeholder="Search conversations"
          className="text-xs placeholder:text-gray-400 outline-none bg-transparent w-full"
        />
      </div>

      {/* Recent Chats */}
      {chats.length > 0 && <p className="mt-4 text-sm">Recent Chats</p>}

      <div className="flex-1 overflow-y-auto mt-3 space-y-3 text-sm">
        {chats
          .filter((chat) => {
            const text =
              chat?.messages?.[0]?.content?.toLowerCase() ||
              chat?.name?.toLowerCase() ||
              "";
            return text.includes(search.toLowerCase());
          })
          .map((chat) => (
            <div
              key={chat._id}
              onClick={() => {
                navigate("/");
                setSelectedChat(chat);
                setismenuopen(false);
              }}
              className="p-2 px-4 dark:bg-[#57317C]/10 border border-gray-300 dark:border-[#80609F]/15 rounded-md cursor-pointer flex justify-between items-start group"
            >
              <div>
                <p className="truncate w-40">
                  {chat.messages.length
                    ? chat.messages[0].content.slice(0, 32)
                    : chat.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#B1A6C0]">
                  {moment(chat.updatedAt).fromNow()}
                </p>
              </div>

              <img
                onClick={(e) =>
                  toast.promise(deleteChat(e, chat._id), {
                    loading: "Deleting...",
                  })
                }
                src={assets.bin_icon}
                className="hidden group-hover:block w-4 cursor-pointer not-dark:invert"
                alt="delete"
              />
            </div>
          ))}
      </div>

      {/* Community */}
      <div
        onClick={() => {
          navigate("/community");
          setismenuopen(false);
        }}
        className="flex items-center gap-2 p-3 mt-4 border border-gray-300 dark:border-white/15 rounded-md cursor-pointer hover:scale-105 transition-all"
      >
        <img src={assets.gallery_icon} className="w-4.5 not-dark:invert" alt="" />
        <p className="text-sm">Community Images</p>
      </div>

      {/* Credits */}
      <div
        onClick={() => {
          navigate("/credits");
          setismenuopen(false);
        }}
        className="flex items-center gap-2 p-3 mt-4 border border-gray-300 dark:border-white/15 rounded-md cursor-pointer hover:scale-105 transition-all"
      >
        <img src={assets.diamond_icon} className="w-4.5 dark:invert" alt="" />
        <div className="flex flex-col text-sm">
          <p>Credits: {user?.credits}</p>
          <p className="text-xs text-gray-400">
            Purchase credits to use quickgpt
          </p>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="flex items-center justify-between gap-2 p-3 mt-4 border border-gray-300 dark:border-white/15 rounded-md">
        <div className="flex items-center gap-2 text-sm">
          <img src={assets.theme_icon} className="w-4.5 not-dark:invert" alt="" />
          <p>Dark Mode</p>
        </div>

        <label className="relative inline-flex cursor-pointer">
          <input
            type="checkbox"
            checked={theme === "dark"}
            onChange={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-400 rounded-full peer-checked:bg-purple-600"></div>
          <span className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></span>
        </label>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 p-3 mt-4 border border-gray-300 dark:border-white/15 rounded-md group">
        <img src={assets.user_icon} className="w-7 rounded-full" alt="" />
        <p className="text-sm truncate flex-1">
          {user ? user.name : "Login your account"}
        </p>
        {user && (
          <img
            onClick={logout}
            src={assets.logout_icon}
            className="h-5 cursor-pointer hidden group-hover:block not-dark:invert"
            alt="logout"
          />
        )}
      </div>
    </div>
  );
};

export default Sidebar;
