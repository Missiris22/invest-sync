import React, { useEffect } from "react";
import { BrowserRouter, useRoutes } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { routes } from "./routes";

// --- Routes Component ---
const RoutesComponent: React.FC = () => {
  const element = useRoutes(routes);
  return element;
};

// --- Main App Component ---
const App: React.FC = () => {
  useEffect(() => {
    console.log("app -----");
  }, []);
  return (
    <AppProvider>
      <BrowserRouter>
        <RoutesComponent />
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
