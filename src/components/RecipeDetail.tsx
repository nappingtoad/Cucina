import { Recipe, Ingredient, Measurement } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ChefHat, Edit, ArrowLeft, Eye } from 'lucide-react';

/**
 * @interface RecipeDetailProps
 * @description Defines the props required for displaying a single recipe in detail.
 */
interface RecipeDetailProps {
  /** The specific recipe object to display. */
  recipe: Recipe;
  /** List of all available ingredient definitions (used for name lookups). */
  ingredients: Ingredient[];
  /** List of all available measurement definitions (used for name lookups). */
  measurements: Measurement[];
  /** Callback to navigate back to the recipe list or previous view. */
  onBack: () => void;
  /** Callback to switch to the recipe editing interface. */
  onEdit: () => void;
  /** Callback to start the Cook Mode session for this recipe. */
  onCook: () => void;
}

/**
 * @component
 * @name RecipeDetail
 * @description Displays the full details of a single recipe, including metadata (counts),
 * ingredients with quantities, and step-by-step instructions. Provides actions for
 * editing, cooking, and navigation.
 * @param {RecipeDetailProps} props - The component properties.
 * @returns {JSX.Element} The recipe detail view UI.
 */
export function RecipeDetail({
  recipe,
  ingredients,
  measurements,
  onBack,
  onEdit,
  onCook,
}: RecipeDetailProps) {
  
  /**
   * @function getIngredientName
   * @description Finds the human-readable name of an ingredient given its ID.
   * @param {string} id - The ingredient's ID.
   * @returns {string} The ingredient name, or 'Unknown'.
   */
  const getIngredientName = (id: string) => {
    return ingredients.find((i) => i.id === id)?.name || 'Unknown';
  };

  /**
   * @function getMeasurementName
   * @description Finds the human-readable name of a measurement unit given its ID.
   * @param {string} id - The measurement's ID.
   * @returns {string} The measurement name, or an empty string.
   */
  const getMeasurementName = (id: string) => {
    return measurements.find((m) => m.id === id)?.name || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2>{recipe.name}</h2>
          <p className="text-muted-foreground">{recipe.description}</p>
        </div>
        <Button variant="outline" onClick={onEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
        <Button onClick={onCook}>
          <ChefHat className="w-4 h-4 mr-2" />
          Start Cooking
        </Button>
      </div>

      {/* Recipe Statistics */}
      <div className="flex items-center gap-4">
        <Badge variant="secondary">Serves {recipe.servings}</Badge>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Eye className="w-4 h-4" />
          Viewed {recipe.viewCount} times
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <ChefHat className="w-4 h-4" />
          Cooked {recipe.cookCount} times
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
            <CardDescription>What you'll need</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#6b8e6f' }} />
                  <span>
                    {/* Display ingredient quantity, unit name, and ingredient name using lookups */}
                    {ing.quantity} {getMeasurementName(ing.measurementId)}{' '}
                    {getIngredientName(ing.ingredientId)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>Step by step</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-sm" style={{ backgroundColor: '#e8f0e9', color: '#6b8e6f' }}>
                    {index + 1}
                  </span>
                  <span className="flex-1 pt-0.5">{instruction}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}