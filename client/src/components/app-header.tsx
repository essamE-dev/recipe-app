import { Link, NavLink } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

type AppHeaderProps = {
  query: string;
  onQueryChange: (value: string) => void;
};

export const AppHeader = ({ query, onQueryChange }: AppHeaderProps) => (
  <header className="border-b bg-background/90 backdrop-blur">
    <div className="container flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center justify-between gap-3">
        <Link className="text-xl font-bold text-primary" to="/">
          Recipe PWA
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center gap-2 md:max-w-xl">
        <label htmlFor="recipe-search" className="sr-only">
          Search recipes
        </label>
        <Input
          id="recipe-search"
          placeholder="Search meals by name..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>

      <nav aria-label="Main navigation" className="flex items-center gap-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `rounded-md px-3 py-2 text-sm ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/favorites"
          className={({ isActive }) =>
            `rounded-md px-3 py-2 text-sm ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`
          }
        >
          Favorites
        </NavLink>
      </nav>
    </div>
  </header>
);
