import React, { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const AppContext = createContext();

// Axios base URL
axios.defaults.baseURL =
  import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();

  // ================= STATES =================
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loadingUser, setLoadingUser] = useState(true);
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  // ================= FETCH USER =================
  const fetchUser = async () => {
    try {
      const { data } = await axios.get("/api/user/data", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        setUser(data.user);
      } else {
        toast.error(data.message);
        setUser(null);
      }
    } catch (error) {
      toast.error("Failed to fetch user data");
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  // ================= FETCH USER CHATS =================
  const fetchUserChats = async () => {
    try {
      const { data } = await axios.get("/api/chat/get", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        setChats(data.chats);

        // Preserve currently selected chat if it exists, otherwise select first chat
        if (selectedChat && selectedChat._id) {
          const updatedChat = data.chats.find(
            (chat) => chat._id === selectedChat._id
          );
          if (updatedChat) {
            setSelectedChat(updatedChat);
          } else if (data.chats.length > 0) {
            setSelectedChat(data.chats[0]);
          }
        } else if (data.chats.length > 0) {
          setSelectedChat(data.chats[0]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to fetch chats");
    }
  };

  // ================= CREATE NEW CHAT =================
  const createNewChat = async () => {
    try {
      if (!user) {
        toast.error("Please login to create a new chat");
        navigate("/login");
        return;
      }

      const { data } = await axios.post(
        "/api/chat/create",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!data?.success || !data?.chat) {
        toast.error(data?.message || "Failed to create new chat");
        return;
      }

      // Optimistically add & select the new chat before refetching
      setChats((prev) => [data.chat, ...prev]);
      setSelectedChat(data.chat);

      toast.success("New chat created");
      fetchUserChats(); // refresh to stay in sync with server ordering
    } catch (error) {
      toast.error("Failed to create new chat");
    }
  };

  // ================= EFFECTS =================

  // Load user when token changes
  useEffect(() => {
    if (token) {
      fetchUser();
      fetchUserChats();
    } else {
      setUser(null);
      setLoadingUser(false);
    }
  }, [token]);

  // Theme handling
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ================= CONTEXT VALUE =================
  const value = {
    navigate,
    user,
    setUser,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    theme,
    setTheme,
    createNewChat,
    loadingUser,
    fetchUser,
    fetchUserChats,
    token,
    setToken,
    axios, // expose configured axios instance for components that need it
  };

  return (
    <AppContext.Provider value={value}>{children}</AppContext.Provider>
  );
};

export const useAppContext = () => React.useContext(AppContext);
