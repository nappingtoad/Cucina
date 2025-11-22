import { useState } from 'react';
import { Recipe, Ingredient, Measurement } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Plus, Search, Eye, ChefHat, Edit, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

/**
 * @interface RecipesListProps
 * @description Defines the props required for the RecipesList component, including data and all actions.
 */
interface RecipesListProps {
  /** List of all recipe objects to display. */
  recipes: Recipe[];
  /** List of all ingredient definitions (included for completeness, not used in this component). */
  ingredients: Ingredient[];
  /** List of all measurement definitions (included for completeness, not used in this component). */
  measurements: Measurement[];
  /** Callback to navigate to the detailed view of a specific recipe. */
  onViewRecipe: (recipeId: string) => void;
  /** Callback to navigate to the edit form for a specific recipe. */
  onEditRecipe: (recipeId: string) => void;
  /** Callback to delete a recipe permanently. */
  onDeleteRecipe: (recipeId: string) => void;
  /** Callback to navigate to the creation form for a new recipe. */
  onAddRecipe: () => void;
  /** Callback to start the Cook Mode session for a specific recipe. */
  onCookRecipe: (recipeId: string) => void;
}

/**
 * @component
 * @name RecipesList
 * @description Displays a searchable list of all recipes in a card format, providing quick actions
 * for viewing, editing, cooking, and deleting recipes.
 * @param {RecipesListProps} props - The component properties.
 * @returns {JSX.Element} The recipe list UI.
 */
export function RecipesList({
  recipes,
  ingredients,
  measurements,
  onViewRecipe,
  onEditRecipe,
  onDeleteRecipe,
  onAddRecipe,
  onCookRecipe,
}: RecipesListProps) {
  // State for the user's search query input
  const [searchQuery, setSearchQuery] = useState('');
  // State to hold the ID of the recipe pending deletion (controls AlertDialog visibility)
  const [deleteRecipeId, setDeleteRecipeId] = useState<string | null>(null);

  /**
   * @constant filteredRecipes
   * @description Filters the main recipe list based on the search query.
   * Performs a case-insensitive search matching the recipe name.
   */
  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h2>Recipes</h2>
          <p className="text-muted-foreground">Manage and search your recipe collection</p>
        </div>
        <Button onClick={onAddRecipe}>
          <Plus className="w-4 h-4 mr-2" />
          Add Recipe
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search recipes by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredRecipes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ChefHat className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No recipes found matching your search' : 'No recipes yet'}
            </p>
            {!searchQuery && (
              <Button onClick={onAddRecipe}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Recipe
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <Card key={recipe.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{recipe.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {recipe.description || 'No description'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recipe Metadata (Views, Cooks, Servings) */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {recipe.viewCount}
                  </div>
                  <div className="flex items-center gap-1">
                    <ChefHat className="w-4 h-4" />
                    {recipe.cookCount}
                  </div>
                  <Badge variant="outline">{recipe.servings} servings</Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => onViewRecipe(recipe.id)}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onCookRecipe(recipe.id)}
                  >
                    <ChefHat className="w-4 h-4 mr-1" />
                    Cook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditRecipe(recipe.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteRecipeId(recipe.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog for Deletion */}
      <AlertDialog open={deleteRecipeId !== null} onOpenChange={() => setDeleteRecipeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the recipe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteRecipeId) {
                  onDeleteRecipe(deleteRecipeId);
                  setDeleteRecipeId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}