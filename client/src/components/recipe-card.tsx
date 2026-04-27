import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import type { Meal } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type RecipeCardProps = {
  meal: Partial<Meal> & { idMeal: string; strMeal: string; strMealThumb: string };
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
};

export const RecipeCard = ({ meal, isFavorite, onToggleFavorite }: RecipeCardProps) => (
  <Card className="overflow-hidden">
    <img
      src={meal.strMealThumb}
      alt={meal.strMeal}
      className="h-44 w-full object-cover"
      loading="lazy"
      onError={(event) => {
        event.currentTarget.src = "/icons/icon-192.svg";
      }}
    />
    <CardHeader>
      <CardTitle className="line-clamp-1 text-base">{meal.strMeal}</CardTitle>
      <div className="flex flex-wrap gap-2">
        {meal.strCategory ? <Badge variant="secondary">{meal.strCategory}</Badge> : null}
        {meal.strArea ? <Badge variant="outline">{meal.strArea}</Badge> : null}
      </div>
    </CardHeader>
    <CardContent>
      <Link className="text-sm text-primary underline-offset-2 hover:underline" to={`/details/${meal.idMeal}`}>
        View details
      </Link>
    </CardContent>
    <CardFooter>
      <Button
        variant={isFavorite ? "destructive" : "outline"}
        aria-pressed={isFavorite}
        onClick={() => onToggleFavorite(meal.idMeal)}
      >
        <Heart className="mr-2 h-4 w-4" />
        {isFavorite ? "Unfavorite" : "Favorite"}
      </Button>
    </CardFooter>
  </Card>
);
