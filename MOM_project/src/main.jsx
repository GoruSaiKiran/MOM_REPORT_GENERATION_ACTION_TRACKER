import React from "react";
import ReactDOM from "react-dom/client";
import App1 from "./App1";
import toast, { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App1 />
    <Toaster />
  </React.StrictMode>
);
