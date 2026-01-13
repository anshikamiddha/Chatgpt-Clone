import React, { createContext } from "react";
import { useNavigate } from "react-router-dom";

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();

  // States
  const [user, setUser] = React.useState(null);
  const [chats, setChats] = React.useState([]);
  const [selectedChat, setSelectedChat] = React.useState(null);
  const [theme, setTheme] = React.useState(
    localStorage.getItem("theme") || "light"
  );

  // --- Dummy Data (You forgot to define these earlier) ---
  const dummyUserData = {
    name: "John Doe",
    email: "johndoe@example.com",
  };

  const dummyChats = [
    { id: 1, title: "Chat 1", messages: [] },
    { id: 2, title: "Chat 2", messages: [] },
  ];
  // -------------------------------------------------------

  // Fetch user data
  const fetchUser = async () => {
    setUser(dummyUserData);
  };

  // Fetch chats
  const fetchUserChats = async () => {
    setChats(dummyChats);
    setSelectedChat(dummyChats[0]);
  };

  // Run when user state changes
  React.useEffect(() => {
    if (user) {
      fetchUserChats();
    } else {
      setChats([]);
      setSelectedChat(null);
    }
  }, [user]);

  // Theme effect
  React.useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Initial fetch
  React.useEffect(() => {
    fetchUser();
  }, []);

  // Context Value
  const value = {
    navigate,
    user,
    setUser,
    fetchUser,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    theme,
    setTheme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => React.useContext(AppContext);
