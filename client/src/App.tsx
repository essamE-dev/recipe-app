import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { queryClient } from "@/lib/queryClient";
import { Details } from "@/pages/Details";
import { Favorites } from "@/pages/Favorites";
import { Home } from "@/pages/Home";

export const App = () => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onOffline = () => toast.warning("You are offline. Showing cached data when available.");
    window.addEventListener("offline", onOffline);
    return () => window.removeEventListener("offline", onOffline);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader query={query} onQueryChange={setQuery} />
        <main id="main-content" className="container py-6">
          <Routes>
            <Route path="/" element={<Home query={query} />} />
            <Route path="/details/:id" element={<Details />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </QueryClientProvider>
  );
};
