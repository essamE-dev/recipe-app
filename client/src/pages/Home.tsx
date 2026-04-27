import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { RecipeCard } from "@/components/recipe-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategories, getMealsByCategory, searchMeals, type Meal } from "@/lib/api";
import { getAllFavorites, removeFavorite, saveFavorite } from "@/features/favorites/db";

type HomeProps = {
  query: string;
};

export const Home = ({ query }: HomeProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [favoriteMap, setFavoriteMap] = useState<Record<string, boolean>>({});

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories
  });

  const mealsQuery = useQuery({
    queryKey: ["meals", query, selectedCategory],
    queryFn: async () => {
      if (query.trim()) {
        return searchMeals(query.trim());
      }

      if (selectedCategory) {
        return getMealsByCategory(selectedCategory);
      }

      return [];
    }
  });

  useQuery({
    queryKey: ["favorites", "home"],
    queryFn: async () => {
      const favorites = await getAllFavorites();
      const nextMap = favorites.reduce<Record<string, boolean>>((acc, item) => {
        acc[item.idMeal] = true;
        return acc;
      }, {});
      setFavoriteMap(nextMap);
      return favorites;
    }
  });

  const toggleFavorite = async (mealLike: Partial<Meal> & { idMeal: string; strMeal: string }) => {
    const isFavorite = !!favoriteMap[mealLike.idMeal];

    if (isFavorite) {
      await removeFavorite(mealLike.idMeal);
      setFavoriteMap((prev) => ({ ...prev, [mealLike.idMeal]: false }));
      toast.success("Removed from favorites");
      return;
    }

    // For category-list results, we may not have full details; save known data safely for offline lists.
    await saveFavorite({
      ...mealLike,
      idMeal: mealLike.idMeal,
      strMeal: mealLike.strMeal,
      strMealThumb: mealLike.strMealThumb ?? "/icons/icon-192.svg",
      strCategory: mealLike.strCategory ?? "",
      strArea: mealLike.strArea ?? "",
      strInstructions: mealLike.strInstructions ?? ""
    } as Meal);
    setFavoriteMap((prev) => ({ ...prev, [mealLike.idMeal]: true }));
    toast.success("Added to favorites");
  };

  const meals = useMemo(() => mealsQuery.data ?? [], [mealsQuery.data]);

  return (
    <section aria-labelledby="discover-recipes" className="space-y-6">
      <div>
        <h1 id="discover-recipes" className="text-2xl font-semibold">
          Discover recipes
        </h1>
        <p className="text-sm text-muted-foreground">Search by name or browse categories.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory ? "outline" : "secondary"}
          onClick={() => setSelectedCategory("")}
          aria-pressed={!selectedCategory}
        >
          All
        </Button>
        {categoriesQuery.isLoading
          ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-9 w-24" />)
          : categoriesQuery.data?.map((category) => (
              <Button
                key={category.idCategory}
                variant={selectedCategory === category.strCategory ? "secondary" : "outline"}
                onClick={() => setSelectedCategory(category.strCategory)}
                aria-pressed={selectedCategory === category.strCategory}
              >
                {category.strCategory}
              </Button>
            ))}
      </div>

      {mealsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-lg border p-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-9 w-28" />
            </div>
          ))}
        </div>
      ) : mealsQuery.isError ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          Could not load meals. Please retry.
        </p>
      ) : meals.length === 0 ? (
        <p className="rounded-md border p-6 text-muted-foreground">No recipes found yet. Try searching above.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meals.map((meal) => (
            <RecipeCard
              key={meal.idMeal}
              meal={meal}
              isFavorite={!!favoriteMap[meal.idMeal]}
              onToggleFavorite={() => {
                void toggleFavorite(meal);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
};
