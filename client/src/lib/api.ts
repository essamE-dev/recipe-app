export type Meal = {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags?: string;
  strYoutube?: string;
  [key: string]: string | undefined;
};

export type MealSummary = {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
};

export type Category = {
  idCategory: string;
  strCategory: string;
  strCategoryThumb: string;
  strCategoryDescription: string;
};

const apiRequest = async <T>(path: string): Promise<T> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`API error (${response.status})`);
  }
  return (await response.json()) as T;
};

export const getCategories = async () => {
  const data = await apiRequest<{ categories: Category[] }>("/api/categories");
  return data.categories ?? [];
};

export const searchMeals = async (query: string) => {
  const params = new URLSearchParams({ q: query });
  const data = await apiRequest<{ meals: Meal[] | null }>(`/api/search?${params.toString()}`);
  return data.meals ?? [];
};

export const getMealsByCategory = async (category: string) => {
  const params = new URLSearchParams({ category });
  const data = await apiRequest<{ meals: MealSummary[] | null }>(`/api/filter?${params.toString()}`);
  return data.meals ?? [];
};

export const getMealById = async (id: string) => {
  const data = await apiRequest<{ meals: Meal[] | null }>(`/api/meal/${id}`);
  return data.meals?.[0] ?? null;
};
