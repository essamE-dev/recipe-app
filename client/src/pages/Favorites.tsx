import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { RecipeCard } from "@/components/recipe-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAllFavorites, removeFavorite } from "@/features/favorites/db";

export const Favorites = () => {
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<"name" | "newest">("name");

  const favoritesQuery = useQuery({
    queryKey: ["favorites"],
    queryFn: getAllFavorites
  });

  const meals = useMemo(() => {
    const list = [...(favoritesQuery.data ?? [])];
    if (sort === "name") {
      list.sort((a, b) => a.strMeal.localeCompare(b.strMeal));
    }
    if (sort === "newest") {
      list.sort((a, b) => Number(b.savedAt ?? 0) - Number(a.savedAt ?? 0));
    }
    if (filter.trim()) {
      return list.filter((meal) => meal.strMeal.toLowerCase().includes(filter.trim().toLowerCase()));
    }
    return list;
  }, [favoritesQuery.data, filter, sort]);

  const handleRemove = async (id: string) => {
    await removeFavorite(id);
    toast.success("Favorite removed");
    await favoritesQuery.refetch();
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="favorites-filter" className="mb-1 block text-sm font-medium">
            Filter favorites
          </label>
          <Input
            id="favorites-filter"
            placeholder="Search saved recipes..."
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        </div>
        <Button variant={sort === "name" ? "secondary" : "outline"} onClick={() => setSort("name")}>
          Sort: Name
        </Button>
        <Button variant={sort === "newest" ? "secondary" : "outline"} onClick={() => setSort("newest")}>
          Sort: Newest
        </Button>
      </div>

      {meals.length === 0 ? (
        <p className="rounded-md border p-6 text-muted-foreground">
          No offline favorites yet. Save a recipe from Home or Details.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meals.map((meal) => (
            <RecipeCard key={meal.idMeal} meal={meal} isFavorite onToggleFavorite={() => void handleRemove(meal.idMeal)} />
          ))}
        </div>
      )}
    </section>
  );
};
