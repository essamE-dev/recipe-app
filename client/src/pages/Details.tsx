import { Heart, Youtube } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMealById } from "@/lib/api";
import { getFavorite, removeFavorite, saveFavorite } from "@/features/favorites/db";
import { warmImageCache } from "@/lib/offline-cache";

const getIngredients = (meal: Record<string, string | undefined>) =>
  Array.from({ length: 20 })
    .map((_, index) => {
      const ingredient = meal[`strIngredient${index + 1}`];
      const measure = meal[`strMeasure${index + 1}`];
      if (!ingredient?.trim()) {
        return null;
      }
      return `${measure?.trim() ?? ""} ${ingredient}`.trim();
    })
    .filter(Boolean) as string[];

export const Details = () => {
  const { id = "" } = useParams();

  const mealQuery = useQuery({
    queryKey: ["meal", id],
    queryFn: async () => {
      try {
        const meal = await getMealById(id);
        if (meal) {
          return meal;
        }
      } catch {
        // Fall back to IndexedDB when offline or the API is unavailable.
      }

      return (await getFavorite(id)) ?? null;
    },
    enabled: Boolean(id)
  });

  const favoriteQuery = useQuery({
    queryKey: ["favorite", id],
    queryFn: () => getFavorite(id),
    enabled: Boolean(id)
  });

  const ingredients = useMemo(() => {
    if (!mealQuery.data) {
      return [];
    }
    return getIngredients(mealQuery.data);
  }, [mealQuery.data]);

  useEffect(() => {
    if (!mealQuery.data?.strMealThumb) {
      return;
    }

    void warmImageCache([mealQuery.data.strMealThumb]);
  }, [mealQuery.data]);

  const handleFavorite = async () => {
    if (!mealQuery.data) {
      return;
    }

    if (favoriteQuery.data) {
      await removeFavorite(mealQuery.data.idMeal);
      await favoriteQuery.refetch();
      toast.success("Removed from favorites");
      return;
    }

    await saveFavorite(mealQuery.data);
    await favoriteQuery.refetch();
    toast.success("Saved for offline favorites");
  };

  if (mealQuery.isLoading) {
    return (
      <section className="space-y-3">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24 w-full" />
      </section>
    );
  }

  if (mealQuery.isError || !mealQuery.data) {
    return (
      <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
        Could not load this recipe. It may be unavailable offline.
      </p>
    );
  }

  const meal = mealQuery.data;

  return (
    <article className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{meal.strMeal}</h1>
        <Button variant={favoriteQuery.data ? "destructive" : "outline"} onClick={handleFavorite}>
          <Heart className="mr-2 h-4 w-4" />
          {favoriteQuery.data ? "Remove favorite" : "Save favorite"}
        </Button>
      </div>

      <img
        src={meal.strMealThumb}
        alt={meal.strMeal}
        className="max-h-[420px] w-full rounded-lg border object-cover"
      />

      <section aria-labelledby="ingredients-title">
        <h2 id="ingredients-title" className="mb-2 text-lg font-semibold">
          Ingredients
        </h2>
        <ul className="grid list-disc gap-1 pl-5 sm:grid-cols-2">
          {ingredients.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="instructions-title">
        <h2 id="instructions-title" className="mb-2 text-lg font-semibold">
          Instructions
        </h2>
        <p className="whitespace-pre-line leading-7 text-muted-foreground">{meal.strInstructions}</p>
      </section>

      {meal.strYoutube ? (
        <a
          className="inline-flex items-center text-primary underline-offset-2 hover:underline"
          href={meal.strYoutube}
          target="_blank"
          rel="noreferrer"
        >
          <Youtube className="mr-2 h-4 w-4" />
          Watch on YouTube
        </a>
      ) : null}
    </article>
  );
};
