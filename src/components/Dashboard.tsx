import { Recipe, Ingredient, Measurement } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChefHat, Eye, Plus, TrendingUp } from 'lucide-react';
import { Badge } from './ui/badge';

/**
 * @interface DashboardProps
 * @description Defines the data inputs and necessary callbacks for the Dashboard component.
 */
interface DashboardProps {
  /** List of all recipes available to the user, including cookCount and viewCount. */
  recipes: Recipe[];
  /** List of all defined ingredient types (used for stat display). */
  ingredients: Ingredient[];
  /** List of all defined measurement types (not directly used here, but part of global data). */
  measurements: Measurement[];
  /** Callback function to navigate to the detailed view of a specific recipe. */
  onViewRecipe: (recipeId: string) => void;
  /** Callback function to enter Cook Mode for a specific recipe. */
  onCookRecipe: (recipeId: string) => void;
  /** Callback function to initiate the creation of a new recipe. */
  onAddRecipe: () => void;
}

/**
 * @component
 * @name Dashboard
 * @description Displays key user statistics (total recipes, ingredients, cooks, views) and lists the top 5
 * recipes based on cook count and view count. Provides quick navigation to viewing, cooking, or adding recipes.
 * @param {DashboardProps} props - The component properties.
 * @returns {JSX.Element} The Dashboard UI.
 */
export function Dashboard({
  recipes,
  ingredients,
  measurements,
  onViewRecipe,
  onCookRecipe,
  onAddRecipe,
}: DashboardProps) {
  
  // NOTE: We create a shallow copy ([...recipes]) before sorting to avoid modifying 
  // the original 'recipes' prop, ensuring clean data flow.
  /**
   * Calculates the top 5 most cooked recipes.
   */
  const mostCooked = [...recipes].sort((a, b) => b.cookCount - a.cookCount).slice(0, 5);
  
  /**
   * Calculates the top 5 most viewed recipes.
   */
  const mostViewed = [...recipes].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Dashboard</h2>
          <p className="text-muted-foreground">Your recipe overview and quick actions</p>
        </div>
        <Button onClick={onAddRecipe}>
          <Plus className="w-4 h-4 mr-2" />
          Add Recipe
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Recipes</CardTitle>
            <ChefHat className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{recipes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Ingredients</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* The count of unique ingredient definitions in the database */}
            <div className="text-2xl">{ingredients.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Cooks</CardTitle>
            <ChefHat className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* Aggregate sum of cookCount across all recipes */}
            <div className="text-2xl">{recipes.reduce((sum, r) => sum + r.cookCount, 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Views</CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* Aggregate sum of viewCount across all recipes */}
            <div className="text-2xl">{recipes.reduce((sum, r) => sum + r.viewCount, 0)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Most Cooked</CardTitle>
            <CardDescription>Your favorite recipes to prepare</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mostCooked.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recipes yet. Start cooking!</p>
              ) : (
                mostCooked.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => onViewRecipe(recipe.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{recipe.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Cooked {recipe.cookCount} times
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCookRecipe(recipe.id);
                      }}
                    >
                      Cook
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Viewed</CardTitle>
            <CardDescription>Recipes you visit often</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mostViewed.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recipes yet. Add some!</p>
              ) : (
                mostViewed.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => onViewRecipe(recipe.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{recipe.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Viewed {recipe.viewCount} times
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCookRecipe(recipe.id);
                      }}
                    >
                      Cook
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}