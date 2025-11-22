import { useState, useEffect } from 'react';
import { Recipe, Ingredient, Measurement, CookingSession, InventoryItem } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ArrowLeft, AlertCircle, CheckCircle2, Package } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
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
import { toast } from 'sonner@2.0.3';
// NOTE: hasEnoughInventory handles complex unit conversions (e.g., cups to grams) 
// to accurately compare recipe needs vs. inventory stock.
import { hasEnoughInventory } from '../lib/conversions';

/**
 * @interface CookModeProps
 * @description Defines the comprehensive set of data and callbacks required for the CookMode component.
 */
interface CookModeProps {
  /** The recipe being prepared. */
  recipe: Recipe;
  /** List of all available ingredient definitions (for name lookups). */
  ingredients: Ingredient[];
  /** List of all available measurement definitions (for name lookups and conversions). */
  measurements: Measurement[];
  /** The user's current inventory stock. */
  inventory: InventoryItem[];
  /** The current state of the cooking session, or null if starting new. Used for resuming. */
  session: CookingSession | null;
  /** Callback to persist updated session data (progress, serving size) back to Firestore. */
  onUpdateSession: (session: CookingSession) => void;
  /** Callback executed when the user confirms completion of the recipe (triggers inventory deduction). */
  onComplete: () => void;
  /** Callback executed when the user cancels the session (deletes session state). */
  onCancel: () => void;
  /** Callback to exit Cook Mode and return to the recipe view. */
  onBack: () => void;
}

/**
 * @component
 * @name CookMode
 * @description Provides an interactive, session-tracking interface for cooking a recipe.
 * Key features include: serving size scaling, ingredient/step checklist, progress tracking,
 * and pre-flight inventory checks using unit conversions.
 * @param {CookModeProps} props - The component properties.
 * @returns {JSX.Element} The Cook Mode UI.
 */
export function CookMode({
  recipe,
  ingredients,
  measurements,
  inventory,
  session,
  onUpdateSession,
  onComplete,
  onCancel,
  onBack,
}: CookModeProps) {
  // Initialize state from existing session data or recipe defaults
  const [servingSize, setServingSize] = useState(session?.servingSize || recipe.servings);
  const [ingredientsChecked, setIngredientsChecked] = useState<number[]>(
    session?.ingredientsChecked || []
  );
  const [stepsChecked, setStepsChecked] = useState<number[]>(session?.stepsChecked || []);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  // Calculated value representing the multiplier for all ingredients based on desired serving size
  const scalingFactor = servingSize / recipe.servings;

  /**
   * @function getIngredientName
   * @description Finds the display name for an ingredient ID.
   * @param {string} id - The unique ID of the ingredient.
   * @returns {string} The ingredient's name, or 'Unknown'.
   */
  const getIngredientName = (id: string) => {
    return ingredients.find((i) => i.id === id)?.name || 'Unknown';
  };

  /**
   * @function getMeasurementName
   * @description Finds the display name for a measurement ID.
   * @param {string} id - The unique ID of the measurement.
   * @returns {string} The measurement's name, or an empty string.
   */
  const getMeasurementName = (id: string) => {
    return measurements.find((m) => m.id === id)?.name || '';
  };

  /**
   * @function checkInventory
   * @description Performs a comprehensive check against the user's inventory for all required recipe ingredients.
   * Crucially handles automatic unit conversion and scaling based on the current `servingSize`.
   * @returns {string[]} An array of strings describing missing ingredients and the required shortfall.
   */
  const checkInventory = () => {
    const missing: string[] = [];
    recipe.ingredients.forEach((ing) => {
      // Calculate scaled quantity required for the current serving size
      const requiredAmount = ing.quantity * scalingFactor;
      
      // Use the utility function which encapsulates the complex conversion logic
      const { hasEnough, available } = hasEnoughInventory(
        ing.ingredientId,
        ing.measurementId,
        requiredAmount,
        inventory,
        measurements
      );
      
      // If we don't have enough (after conversions), record the missing details
      if (!hasEnough) {
        const shortfall = requiredAmount - available;
        missing.push(
          `${getIngredientName(ing.ingredientId)} (need ${requiredAmount.toFixed(1)} ${getMeasurementName(ing.measurementId)}${available > 0 ? `, have ${available.toFixed(1)}` : ''})`
        );
      }
    });
    return missing;
  };

  // Run the inventory check once on render to display the warning
  const missingIngredients = checkInventory();

  /**
   * @function toggleIngredient
   * @description Toggles the checked status of an ingredient index in the state array.
   * @param {number} index - The zero-based index of the ingredient in the recipe's list.
   * @returns {void}
   */
  const toggleIngredient = (index: number) => {
    const updated = ingredientsChecked.includes(index)
      ? ingredientsChecked.filter((i) => i !== index)
      : [...ingredientsChecked, index];
    setIngredientsChecked(updated);
  };

  /**
   * @function toggleStep
   * @description Toggles the checked status of an instruction step index in the state array.
   * @param {number} index - The zero-based index of the instruction step.
   * @returns {void}
   */
  const toggleStep = (index: number) => {
    const updated = stepsChecked.includes(index)
      ? stepsChecked.filter((i) => i !== index)
      : [...stepsChecked, index];
    setStepsChecked(updated);
  };

  // Progress calculations are derived from the current state lengths
  const ingredientProgress = (ingredientsChecked.length / recipe.ingredients.length) * 100;
  const stepProgress = (stepsChecked.length / recipe.instructions.length) * 100;
  const totalProgress = ((ingredientsChecked.length + stepsChecked.length) /
    (recipe.ingredients.length + recipe.instructions.length)) * 100;
  const isComplete = totalProgress === 100;

  /**
   * @effect Persist Session State
   * @description This effect runs whenever core session state changes (serving size, checks).
   * It calls the parent `onUpdateSession` callback to save the session to the backend (Firestore).
   * This ensures cooking progress is never lost if the user navigates away or refreshes.
   */
  useEffect(() => {
    if (session) {
      const updated: CookingSession = {
        ...session,
        servingSize,
        ingredientsChecked,
        stepsChecked,
      };
      onUpdateSession(updated);
    }
  }, [servingSize, ingredientsChecked, stepsChecked]);

  /**
   * @function handleComplete
   * @description Initiates the completion process.
   * Performs final check that all items/steps are marked complete before showing the confirmation modal.
   * @returns {void}
   */
  const handleComplete = () => {
    // Check if all ingredients are checked
    if (ingredientsChecked.length < recipe.ingredients.length) {
      toast.error('Please check off all ingredients before completing!');
      return;
    }

    // Check if all steps are checked
    if (stepsChecked.length < recipe.instructions.length) {
      toast.error('Please complete all cooking steps before finishing!');
      return;
    }

    // Show confirmation dialog which displays deductions
    setShowCompleteDialog(true);
  };

  /**
   * @function confirmComplete
   * @description Final confirmation handler.
   * Calls the parent's `onComplete` callback, which is responsible for deducting ingredients 
   * from the inventory and clearing the session.
   * @returns {void}
   */
  const confirmComplete = () => {
    setShowCompleteDialog(false);
    onComplete();
    toast.success('Cooking session completed! 🎉\nIngredients deducted from inventory');
  };

  /**
   * @function getInventoryDeductions
   * @description Calculates the detailed list of ingredients, scaled amounts, and inventory status
   * to be displayed in the confirmation dialog. This runs the same core logic as `checkInventory`
   * but formats the results for display.
   * @returns {Array<Object>} Details for each ingredient's deduction status.
   */
  const getInventoryDeductions = () => {
    const deductions: Array<{ name: string; amount: string; inInventory: boolean; available: string }> = [];
    
    recipe.ingredients.forEach((ing) => {
      const requiredAmount = ing.quantity * scalingFactor;
      
      // Re-run inventory check logic for precise deduction display
      const { hasEnough, available } = hasEnoughInventory(
        ing.ingredientId,
        ing.measurementId,
        requiredAmount,
        inventory,
        measurements
      );
      
      const ingredientName = getIngredientName(ing.ingredientId);
      const measurementName = getMeasurementName(ing.measurementId);
      
      deductions.push({
        name: ingredientName,
        amount: `${requiredAmount.toFixed(2)} ${measurementName}`,
        inInventory: hasEnough,
        available: available > 0 ? `${available.toFixed(2)} ${measurementName} available` : 'Not in inventory',
      });
    });
    
    return deductions;
  };

  /**
   * @function handleCancel
   * @description Calls the parent `onCancel` handler to terminate the session without deduction.
   * @returns {void}
   */
  const handleCancel = () => {
    onCancel();
    toast('Cooking session cancelled');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2>Cook Mode: {recipe.name}</h2>
          <p className="text-muted-foreground">Follow along and track your progress</p>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleComplete} disabled={!isComplete}>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Complete {!isComplete && `(${Math.round(totalProgress)}%)`}
        </Button>
      </div>

      <Card className="sticky top-0 z-10 shadow-md">
        <CardContent className="py-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Total Progress</span>
                <span>{Math.round(totalProgress)}%</span>
              </div>
              <Progress value={totalProgress} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Ingredients</p>
                <p>
                  {ingredientsChecked.length} / {recipe.ingredients.length}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Steps</p>
                <p>
                  {stepsChecked.length} / {recipe.instructions.length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Serving Size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="servings">Servings (original: {recipe.servings})</Label>
              <Input
                id="servings"
                type="number"
                min="0.5"
                step="0.5"
                value={servingSize}
                // Handle serving size change, resetting to original if input is invalid
                onChange={(e) => setServingSize(parseFloat(e.target.value) || recipe.servings)}
              />
            </div>
            <div className="pt-6">
              {scalingFactor !== 1 && (
                <Badge variant="secondary">
                  {scalingFactor > 1 ? '↑' : '↓'} {(scalingFactor * 100).toFixed(0)}% scale
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {missingIngredients.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p>Missing ingredients from inventory:</p>
            <ul className="list-disc list-inside mt-2">
              {missingIngredients.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Ingredients
              <span className="text-sm text-muted-foreground ml-2">
                ({ingredientsChecked.length}/{recipe.ingredients.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recipe.ingredients.map((ing, index) => {
                // Display the scaled quantity
                const scaledQuantity = (ing.quantity * scalingFactor).toFixed(2);
                const isChecked = ingredientsChecked.includes(index);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 rounded hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => toggleIngredient(index)}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleIngredient(index)}
                    />
                    <span className={isChecked ? 'line-through text-muted-foreground' : ''}>
                      {scaledQuantity} {getMeasurementName(ing.measurementId)}{' '}
                      {getIngredientName(ing.ingredientId)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <Progress value={ingredientProgress} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Instructions
              <span className="text-sm text-muted-foreground ml-2">
                ({stepsChecked.length}/{recipe.instructions.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recipe.instructions.map((instruction, index) => {
                const isChecked = stepsChecked.includes(index);
                return (
                  <div
                    key={index}
                    className="flex gap-3 p-2 rounded hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => toggleStep(index)}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleStep(index)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-sm" style={{ backgroundColor: '#e8f0e9', color: '#6b8e6f' }}>
                          {index + 1}
                        </span>
                      </div>
                      <p className={isChecked ? 'line-through text-muted-foreground' : ''}>
                        {instruction}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <Progress value={stepProgress} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog for Completion (displays inventory deductions) */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Cooking Session?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>The following ingredients will be deducted from your inventory:</p>
                <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto bg-accent/30">
                  {getInventoryDeductions().map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between gap-2 text-sm"
                    >
                      <div className="flex items-start gap-2 flex-1">
                        <Package className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: item.inInventory ? '#6b8e6f' : '#d4a574' }} />
                        <div className="flex-1">
                          <div>{item.name}</div>
                          <div className="text-muted-foreground text-xs">{item.amount}</div>
                          <div className="text-muted-foreground text-xs">{item.available}</div>
                        </div>
                      </div>
                      {item.inInventory ? (
                        <Badge variant="secondary" className="text-xs flex-shrink-0">In stock</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs flex-shrink-0">Insufficient</Badge>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Items in your inventory will be automatically deducted. Items not in inventory will be ignored.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmComplete}>
              Complete & Deduct Ingredients
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}