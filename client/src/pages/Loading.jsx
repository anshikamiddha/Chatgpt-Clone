import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const Loading = () => {
  const navigate = useNavigate();
  const {fetchUser}=useAppContext();
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUser();
      navigate("/"); // home page
    }, 8000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
      <h1 className="text-2xl animate-pulse">Loading...</h1>
    </div>
  );
};

export default Loading;
