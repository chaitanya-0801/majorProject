import React from "react";
import { Outlet } from "react-router-dom";
import Nav from "./Nav";

const HomeLayout = () => {
  return (
    <div className="app-container">
      <Nav />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default HomeLayout;
