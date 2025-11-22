import { useState, useEffect } from 'react';
import { Recipe, RecipeIngredient, Ingredient, Measurement } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, X, ArrowLeft, Search } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

/**
 * @interface RecipeFormProps
 * @description Defines the props for the RecipeForm component.
 */
interface RecipeFormProps {
  /** Optional. The recipe object if we are in Edit Mode. Undefined if in Create Mode. */
  recipe?: Recipe;
  /** List of all available ingredient definitions for lookup and selection. */
  ingredients: Ingredient[];
  /** List of all available measurement definitions for lookup and selection. */
  measurements: Measurement[];
  /** * @function onSave 
   * @description Callback executed upon successful form submission.
   * @param {Omit<Recipe, '...'>} recipe - The new or updated recipe data, stripped of backend-managed fields.
   */
  onSave: (recipe: Omit<Recipe, 'id' | 'userId' | 'viewCount' | 'cookCount' | 'createdAt'>) => void;
  /** Callback executed when the user cancels the form (returns to previous view). */
  onCancel: () => void;
}

/**
 * @component
 * @name RecipeForm
 * @description A comprehensive form component used for both creating new recipes and editing existing ones.
 * It handles the recipe's core fields (name, servings) and manages dynamic arrays for ingredients and instructions.
 * Validation is performed on submission.
 * @param {RecipeFormProps} props - The component properties.
 * @returns {JSX.Element} The recipe form UI.
 */
export function RecipeForm({ recipe, ingredients, measurements, onSave, onCancel }: RecipeFormProps) {
  // --- Basic Fields State (initialized from props or defaults) ---
  const [name, setName] = useState(recipe?.name || '');
  const [description, setDescription] = useState(recipe?.description || '');
  const [servings, setServings] = useState(recipe?.servings || 4);
  
  // --- Dynamic Array States ---
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>(
    recipe?.ingredients || []
  );
  const [instructions, setInstructions] = useState<string[]>(recipe?.instructions || ['']);
  
  // States used for potential future custom ingredient/measurement creation (currently unused in UI)
  const [customIngredient, setCustomIngredient] = useState('');
  const [customMeasurement, setCustomMeasurement] = useState('');

  /**
   * @function addIngredient
   * @description Adds a new, empty RecipeIngredient object to the ingredient list array.
   * @returns {void}
   */
  const addIngredient = () => {
    setRecipeIngredients([
      ...recipeIngredients,
      { ingredientId: '', quantity: 0, measurementId: '' },
    ]);
  };

  /**
   * @function updateIngredient
   * @description Updates a specific field (quantity, ingredientId, or measurementId) of an ingredient at a given index.
   * @param {number} index - The index of the ingredient to update.
   * @param {keyof RecipeIngredient} field - The field name to update.
   * @param {any} value - The new value for the field.
   * @returns {void}
   */
  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
    const updated = [...recipeIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipeIngredients(updated);
  };

  /**
   * @function removeIngredient
   * @description Removes an ingredient row from the list by its index.
   * @param {number} index - The index of the ingredient to remove.
   * @returns {void}
   */
  const removeIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  /**
   * @function addInstruction
   * @description Adds an empty string (new step) to the instructions list.
   * @returns {void}
   */
  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  /**
   * @function updateInstruction
   * @description Updates the text content of an instruction step at a given index.
   * @param {number} index - The index of the instruction to update.
   * @param {string} value - The new instruction text.
   * @returns {void}
   */
  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  /**
   * @function removeInstruction
   * @description Removes an instruction step from the list by its index.
   * @param {number} index - The index of the instruction to remove.
   * @returns {void}
   */
  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  /**
   * @function handleSubmit
   * @description Handles the form submission event.
   * Performs critical validation checks on required fields, ingredient completion, and instructions.
   * Calls the parent `onSave` function with the sanitized recipe object on success.
   * @param {React.FormEvent} e - The form submission event.
   * @returns {void}
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a recipe name');
      return;
    }

    if (recipeIngredients.length === 0) {
      toast.error('Please add at least one ingredient');
      return;
    }

    // Filter out incomplete ingredient rows for submission validation
    const validIngredients = recipeIngredients.filter(
      (ing) => ing.ingredientId && ing.quantity > 0 && ing.measurementId
    );

    if (validIngredients.length === 0) {
      toast.error('Please complete all ingredient fields');
      return;
    }

    // Filter out empty instruction rows
    const validInstructions = instructions.filter((inst) => inst.trim());

    if (validInstructions.length === 0) {
      toast.error('Please add at least one instruction');
      return;
    }

    // Submit a sanitized and complete recipe object
    onSave({
      name: name.trim(),
      description: description.trim(),
      servings,
      ingredients: validIngredients,
      instructions: validInstructions,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2>{recipe ? 'Edit Recipe' : 'Add New Recipe'}</h2>
          <p className="text-muted-foreground">
            {recipe ? 'Update your recipe details' : 'Create a new recipe'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Recipe Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Spaghetti Carbonara"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your recipe"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servings">Servings *</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                step="0.5"
                value={servings}
                onChange={(e) => setServings(parseFloat(e.target.value) || 1)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ingredients</CardTitle>
            <Button type="button" size="sm" onClick={addIngredient}>
              <Plus className="w-4 h-4 mr-2" />
              Add Ingredient
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* NOTE: IngredientRow handles the complex search and selection logic for a single ingredient item */}
            {recipeIngredients.map((ing, index) => (
              <IngredientRow
                key={index}
                ingredient={ing}
                ingredients={ingredients}
                measurements={measurements}
                onChange={(field, value) => updateIngredient(index, field, value)}
                onRemove={() => removeIngredient(index)}
              />
            ))}
            {recipeIngredients.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No ingredients added yet. Click "Add Ingredient" to get started.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Instructions</CardTitle>
            <Button type="button" size="sm" onClick={addInstruction}>
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {instructions.map((instruction, index) => (
              <div key={index} className="flex gap-2">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 mt-2 rounded-full text-sm" style={{ backgroundColor: '#e8f0e9', color: '#6b8e6f' }}>
                  {index + 1}
                </span>
                <Textarea
                  value={instruction}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  placeholder={`Step ${index + 1}`}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-2"
                  onClick={() => removeInstruction(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {instructions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No instructions added yet. Click "Add Step" to get started.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{recipe ? 'Update Recipe' : 'Create Recipe'}</Button>
        </div>
      </form>
    </div>
  );
}

/**
 * @interface IngredientRowProps
 * @description Props for the helper component that manages the input fields for a single ingredient item.
 */
interface IngredientRowProps {
  /** The current ingredient object being edited. */
  ingredient: RecipeIngredient;
  /** List of all available ingredient definitions for searching. */
  ingredients: Ingredient[];
  /** List of all available measurement definitions for searching. */
  measurements: Measurement[];
  /** Callback to update a specific field of the parent ingredient array. */
  onChange: (field: keyof RecipeIngredient, value: any) => void;
  /** Callback to remove this ingredient row from the parent array. */
  onRemove: () => void;
}

/**
 * @component
 * @name IngredientRow
 * @description A helper component managing the input fields (Ingredient Search, Quantity, Unit Search)
 * for a single recipe ingredient item. It implements complex auto-complete search functionality.
 * @param {IngredientRowProps} props - The component properties.
 * @returns {JSX.Element} The ingredient input row UI.
 */
function IngredientRow({
  ingredient,
  ingredients,
  measurements,
  onChange,
  onRemove,
}: IngredientRowProps) {
  // --- Search/Selection States ---
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [measurementSearch, setMeasurementSearch] = useState('');
  const [showIngredientSuggestions, setShowIngredientSuggestions] = useState(false);
  const [showMeasurementSuggestions, setShowMeasurementSuggestions] = useState(false);

  // Derived state to get the currently selected item objects based on IDs
  const selectedIngredient = ingredients.find((i) => i.id === ingredient.ingredientId);
  const selectedMeasurement = measurements.find((m) => m.id === ingredient.measurementId);

  // Filtered lists for suggestions (runs on every search input change)
  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

  const filteredMeasurements = measurements.filter((meas) =>
    meas.name.toLowerCase().includes(measurementSearch.toLowerCase())
  );

  /**
   * @function handleSelectIngredient
   * @description Selects an ingredient from the dropdown. Updates the ingredientId 
   * in the parent component and sets the search input display name.
   * @param {string} ingredientId - ID of the selected ingredient.
   * @param {string} ingredientName - Name of the selected ingredient.
   * @returns {void}
   */
  const handleSelectIngredient = (ingredientId: string, ingredientName: string) => {
    onChange('ingredientId', ingredientId);
    setIngredientSearch(ingredientName);
    setShowIngredientSuggestions(false);
  };

  /**
   * @function handleSelectMeasurement
   * @description Selects a measurement from the dropdown. Updates the measurementId 
   * in the parent component and sets the search input display name.
   * @param {string} measurementId - ID of the selected measurement.
   * @param {string} measurementName - Name of the selected measurement.
   * @returns {void}
   */
  const handleSelectMeasurement = (measurementId: string, measurementName: string) => {
    onChange('measurementId', measurementId);
    setMeasurementSearch(measurementName);
    setShowMeasurementSuggestions(false);
  };

  /**
   * @effect Sync Ingredient Name
   * @description Ensures the text input displays the actual name when the ingredient ID changes (e.g., on load/edit).
   */
  useEffect(() => {
    if (selectedIngredient) {
      setIngredientSearch(selectedIngredient.name);
    }
  }, [selectedIngredient]);

  /**
   * @effect Sync Measurement Name
   * @description Ensures the text input displays the actual name when the measurement ID changes (e.g., on load/edit).
   */
  useEffect(() => {
    if (selectedMeasurement) {
      setMeasurementSearch(selectedMeasurement.name);
    }
  }, [selectedMeasurement]);

  return (
    <div className="flex gap-2 items-start">
      <div className="flex-1 space-y-2">
        <Label>Ingredient</Label>
        <div className="relative">
          <Input
            placeholder="Search ingredients..."
            value={ingredientSearch}
            onChange={(e) => {
              setIngredientSearch(e.target.value);
              setShowIngredientSuggestions(true);
              // Clear the underlying ID if the user starts typing again
              if (!e.target.value) {
                onChange('ingredientId', '');
              }
            }}
            onFocus={() => setShowIngredientSuggestions(true)}
            // Delaying blur prevents closing suggestions before click handler runs
            onBlur={() => setTimeout(() => setShowIngredientSuggestions(false), 200)}
          />
          {/* Ingredient Search Suggestions Dropdown */}
          {showIngredientSuggestions && ingredientSearch && filteredIngredients.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto">
              {filteredIngredients.slice(0, 10).map((ing) => (
                <button
                  key={ing.id}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => handleSelectIngredient(ing.id, ing.name)}
                >
                  {ing.name}
                </button>
              ))}
              {filteredIngredients.length > 10 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  +{filteredIngredients.length - 10} more...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-24 space-y-2">
        <Label>Quantity</Label>
        <Input
          type="number"
          min="0"
          step="0.1"
          value={ingredient.quantity || ''}
          // Update parent state on change, defaulting to 0 for invalid input
          onChange={(e) => onChange('quantity', parseFloat(e.target.value) || 0)}
          placeholder="0"
        />
      </div>

      <div className="w-32 space-y-2">
        <Label>Unit</Label>
        <div className="relative">
          <Input
            placeholder="Search units..."
            value={measurementSearch}
            onChange={(e) => {
              setMeasurementSearch(e.target.value);
              setShowMeasurementSuggestions(true);
              // Clear the underlying ID if the user starts typing again
              if (!e.target.value) {
                onChange('measurementId', '');
              }
            }}
            onFocus={() => setShowMeasurementSuggestions(true)}
            onBlur={() => setTimeout(() => setShowMeasurementSuggestions(false), 200)}
          />
          {/* Measurement Search Suggestions Dropdown */}
          {showMeasurementSuggestions && measurementSearch && filteredMeasurements.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto">
              {filteredMeasurements.slice(0, 10).map((meas) => (
                <button
                  key={meas.id}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => handleSelectMeasurement(meas.id, meas.name)}
                >
                  {meas.name}
                </button>
              ))}
              {filteredMeasurements.length > 10 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  +{filteredMeasurements.length - 10} more...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Remove Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="mt-8"
        onClick={onRemove}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}