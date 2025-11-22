import { useState } from 'react';
import { InventoryItem, Ingredient, Measurement } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Plus, Search, Edit, Trash2, Save, X, Package, Info } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';
// NOTE: These utilities handle complex conversions between compatible measurement units.
import { getTotalInventoryInUnit, convertMeasurement } from '../lib/conversions';

/**
 * @interface InventoryManagerProps
 * @description Defines the props required for the InventoryManager component.
 */
interface InventoryManagerProps {
  /** The user's current inventory items. */
  inventory: InventoryItem[];
  /** The list of all defined ingredient types (for lookup and selection). */
  ingredients: Ingredient[];
  /** The list of all defined measurement units (for lookup, selection, and conversion). */
  measurements: Measurement[];
  /** * Callback to add a new inventory item. Note: userId is excluded as it's added by the parent/service. 
   */
  onAdd: (item: Omit<InventoryItem, 'userId'>) => void;
  /** * Callback to edit an existing inventory item. The signature is complex because an item is keyed by 
   * its ingredientId AND original measurementId, but the measurementId itself can change during the edit.
   */
  onEdit: (ingredientId: string, oldMeasurementId: string, newMeasurementId: string, quantity: number) => void;
  /** * Callback to delete an inventory item. Requires both IDs to uniquely identify the inventory record. 
   */
  onDelete: (ingredientId: string, measurementId: string) => void;
}

/**
 * @component
 * @name InventoryManager
 * @description Manages the user's inventory, supporting searching, adding, inline editing, and deletion.
 * Key functionality involves managing units and displaying converted quantities based on defined unit conversions.
 * @param {InventoryManagerProps} props - The component properties.
 * @returns {JSX.Element} The inventory management UI.
 */
export function InventoryManager({
  inventory,
  ingredients,
  measurements,
  onAdd,
  onEdit,
  onDelete,
}: InventoryManagerProps) {
  // State for filtering the main inventory list display
  const [searchQuery, setSearchQuery] = useState('');
  // State for controlling the visibility of the Add Item modal
  const [showAddForm, setShowAddForm] = useState(false);
  
  // --- New Item State (used in Add Item dialog) ---
  const [newIngredientId, setNewIngredientId] = useState('');
  const [newMeasurementId, setNewMeasurementId] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  
  // States to drive the ingredient and measurement search/selection in the Add Item dialog
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [measurementSearch, setMeasurementSearch] = useState('');
  const [showIngredientSuggestions, setShowIngredientSuggestions] = useState(false);
  const [showMeasurementSuggestions, setShowMeasurementSuggestions] = useState(false);
  
  // --- Edit Item State (used for inline editing) ---
  // Key format: `${ingredientId}-${measurementId}` to uniquely identify the item being edited
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editMeasurementId, setEditMeasurementId] = useState('');
  
  // State for tracking the item pending deletion (opens AlertDialog)
  const [deleteItem, setDeleteItem] = useState<{ ingredientId: string; measurementId: string } | null>(null);

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
   * @function getConvertibleUnits
   * @description Retrieves all Measurement objects that can be converted from the given measurementId.
   * Used to show the user which units the system supports for cross-conversion.
   * @param {string} measurementId - The source measurement ID.
   * @returns {Measurement[]} List of convertible units.
   */
  const getConvertibleUnits = (measurementId: string): Measurement[] => {
    const measurement = measurements.find((m) => m.id === measurementId);
    if (!measurement) return [];
    
    const convertibleIds = measurement.conversions.map((c) => c.toMeasurementId);
    return measurements.filter((m) => convertibleIds.includes(m.id));
  };

  /**
   * @function getAggregatedInventory
   * @description Groups inventory items by ingredient ID. (Currently unused in display, but helpful utility).
   * @returns {Map<string, Array<{ measurementId: string; quantity: number }>>} Grouped inventory.
   */
  const getAggregatedInventory = () => {
    // Group inventory by ingredient and show total in multiple units
    const grouped: Map<string, Array<{ measurementId: string; quantity: number }>> = new Map();
    
    inventory.forEach((item) => {
      if (!grouped.has(item.ingredientId)) {
        grouped.set(item.ingredientId, []);
      }
      grouped.get(item.ingredientId)!.push({
        measurementId: item.measurementId,
        quantity: item.quantity,
      });
    });
    
    return grouped;
  };

  // Filtered lists for display and search suggestions
  const filteredInventory = inventory.filter((item) =>
    getIngredientName(item.ingredientId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

  const filteredMeasurements = measurements.filter((meas) =>
    meas.name.toLowerCase().includes(measurementSearch.toLowerCase())
  );

  /**
   * @function handleSelectIngredient
   * @description Handles selecting an ingredient from the search suggestions in the Add Item dialog.
   * @param {string} ingredientId - ID of the selected ingredient.
   * @param {string} ingredientName - Name of the selected ingredient.
   * @returns {void}
   */
  const handleSelectIngredient = (ingredientId: string, ingredientName: string) => {
    setNewIngredientId(ingredientId);
    setIngredientSearch(ingredientName);
    setShowIngredientSuggestions(false);
  };

  /**
   * @function handleSelectMeasurement
   * @description Handles selecting a measurement from the search suggestions in the Add Item dialog.
   * @param {string} measurementId - ID of the selected measurement.
   * @param {string} measurementName - Name of the selected measurement.
   * @returns {void}
   */
  const handleSelectMeasurement = (measurementId: string, measurementName: string) => {
    setNewMeasurementId(measurementId);
    setMeasurementSearch(measurementName);
    setShowMeasurementSuggestions(false);
  };

  /**
   * @function handleAdd
   * @description Submits the new inventory item to the parent component.
   * Performs validation checks for required fields and valid quantity.
   * Resets form state and closes the dialog upon success.
   * @returns {void}
   */
  const handleAdd = () => {
    if (!newIngredientId) {
      toast.error('Please select an ingredient');
      return;
    }
    if (!newMeasurementId) {
      toast.error('Please select a measurement');
      return;
    }
    const quantity = parseFloat(newQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    onAdd({
      ingredientId: newIngredientId,
      measurementId: newMeasurementId,
      quantity,
    });

    // Reset all form states
    setNewIngredientId('');
    setShowIngredientSuggestions(false);
    setShowMeasurementSuggestions(false);
    setNewMeasurementId('');
    setNewQuantity('');
    setIngredientSearch('');
    setMeasurementSearch('');
    setShowAddForm(false);
    toast.success('Item added to inventory');
  };

  /**
   * @function handleEdit
   * @description Submits the updated inventory item to the parent component for persistence.
   * Validates input quantity and measurement ID. The logic is complex as it requires passing
   * the *original* measurementId along with the potentially *new* one to the parent for update logic.
   * @param {InventoryItem} item - The original inventory item object.
   * @returns {void}
   */
  const handleEdit = (item: InventoryItem) => {
    const quantity = parseFloat(editQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    if (!editMeasurementId) {
      toast.error('Please select a measurement');
      return;
    }
    // Call parent edit function, passing the original measurementId (item.measurementId)
    // and the potentially new one (editMeasurementId)
    onEdit(item.ingredientId, item.measurementId, editMeasurementId, quantity);
    
    // Reset edit state
    setEditingKey(null);
    setEditQuantity('');
    setEditMeasurementId('');
    toast.success('Inventory updated');
  };

  /**
   * @function startEdit
   * @description Initializes the inline edit state for a specific inventory item.
   * @param {InventoryItem} item - The item to edit.
   * @returns {void}
   */
  const startEdit = (item: InventoryItem) => {
    // Set the unique key to activate inline editing for this row
    setEditingKey(`${item.ingredientId}-${item.measurementId}`);
    setEditQuantity(item.quantity.toString());
    setEditMeasurementId(item.measurementId);
  };

  /**
   * @function cancelEdit
   * @description Clears the inline edit state.
   * @returns {void}
   */
  const cancelEdit = () => {
    setEditingKey(null);
    setEditQuantity('');
    setEditMeasurementId('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Inventory Manager</h2>
          <p className="text-muted-foreground">Track your ingredient supplies</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Inventory ({inventory.length} items)</CardTitle>
          <CardDescription>Search and manage your ingredient stock</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredInventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No items found' : 'No items in inventory'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Item
                </Button>
              )}
            </div>
          ) : (
            <>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  💡 Units convert automatically! Add ingredients in any unit - the system will recognize compatible measurements.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredInventory.map((item) => {
                  const key = `${item.ingredientId}-${item.measurementId}`;
                  const isEditing = editingKey === key;
                  const convertibleUnits = getConvertibleUnits(item.measurementId);
                  
                  // Calculate some common conversions to display for better context
                  const commonConversions = convertibleUnits.slice(0, 2).map((unit) => {
                    const converted = convertMeasurement(
                      item.measurementId,
                      unit.id,
                      item.quantity,
                      measurements
                    );
                    return converted !== null ? { unit: unit.name, amount: converted } : null;
                  }).filter(Boolean);

                  return (
                    <div
                      key={key}
                      className="border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 p-3">
                        <span className="flex-1">
                          {getIngredientName(item.ingredientId)}
                        </span>
                        {isEditing ? (
                          <>
                            <Input
                              type="number"
                              value={editQuantity}
                              onChange={(e) => setEditQuantity(e.target.value)}
                              className="w-24"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEdit(item);
                                if (e.key === 'Escape') cancelEdit();
                              }}
                            />
                            {/* NOTE: Selecting a new unit here updates `editMeasurementId` */}
                            <Select
                              value={editMeasurementId}
                              onValueChange={setEditMeasurementId}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Unit..." />
                              </SelectTrigger>
                              <SelectContent>
                                {measurements.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" onClick={() => handleEdit(item)}>
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit}>
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="text-right">
                              {item.quantity} {getMeasurementName(item.measurementId)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setDeleteItem({
                                  ingredientId: item.ingredientId,
                                  measurementId: item.measurementId,
                                })
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                      
                      {/* Displaying converted units for enhanced usability */}
                      {!isEditing && commonConversions.length > 0 && (
                        <div className="px-3 pb-3 pt-0 flex flex-wrap gap-2">
                          {commonConversions.map((conv, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              ≈ {conv!.amount.toFixed(2)} {conv!.unit}
                            </Badge>
                          ))}
                          {convertibleUnits.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{convertibleUnits.length - 2} more units
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>
              Add ingredients in any unit - conversions work automatically
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Ingredient Search/Selection Field */}
            <div className="space-y-2">
              <Label>Ingredient</Label>
              <div className="relative">
                <Input
                  placeholder="Search ingredients..."
                  value={ingredientSearch}
                  onChange={(e) => {
                    setIngredientSearch(e.target.value);
                    setShowIngredientSuggestions(true);
                    setNewIngredientId('');
                  }}
                  onFocus={() => setShowIngredientSuggestions(true)}
                  // NOTE: Delaying blur prevents closing suggestions before click handler runs
                  onBlur={() => setTimeout(() => setShowIngredientSuggestions(false), 200)}
                />
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
                {newIngredientId && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Selected: {getIngredientName(newIngredientId)}
                  </div>
                )}
              </div>
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                placeholder="0"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>

            {/* Measurement Search/Selection Field */}
            <div className="space-y-2">
              <Label>Measurement</Label>
              <div className="relative">
                <Input
                  placeholder="Search measurements..."
                  value={measurementSearch}
                  onChange={(e) => {
                    setMeasurementSearch(e.target.value);
                    setShowMeasurementSuggestions(true);
                    setNewMeasurementId('');
                  }}
                  onFocus={() => setShowMeasurementSuggestions(true)}
                  // NOTE: Delaying blur prevents closing suggestions before click handler runs
                  onBlur={() => setTimeout(() => setShowMeasurementSuggestions(false), 200)}
                />
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
                {newMeasurementId && (
                  <div className="mt-2 space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Selected: {getMeasurementName(newMeasurementId)}
                    </div>
                    {/* Display units this selection can convert to, for user reassurance */}
                    {getConvertibleUnits(newMeasurementId).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-muted-foreground">Auto-converts to:</span>
                        {getConvertibleUnits(newMeasurementId).slice(0, 4).map((unit) => (
                          <Badge key={unit.id} variant="secondary" className="text-xs">
                            {unit.name}
                          </Badge>
                        ))}
                        {getConvertibleUnits(newMeasurementId).length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{getConvertibleUnits(newMeasurementId).length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAdd} className="flex-1">
                Add Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Deletion */}
      <AlertDialog open={deleteItem !== null} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this item from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteItem) {
                  // Final deletion logic requires both IDs to identify the unique item record
                  onDelete(deleteItem.ingredientId, deleteItem.measurementId);
                  setDeleteItem(null);
                  toast.success('Item removed from inventory');
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