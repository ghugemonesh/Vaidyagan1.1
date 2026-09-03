import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/ui";
import PublicSite from "./pages/PublicSite";
import AdminConsole from "./pages/AdminConsole";
import Studio from "./pages/Studio";

export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/admin" element={<AdminConsole />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/*" element={<PublicSite />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
}
