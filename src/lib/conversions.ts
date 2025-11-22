import { Measurement } from '../types';
/**
 * Convert a quantity from one measurement unit to another
 * Returns the converted amount or null if no conversion path exists
 */
export function convertMeasurement(
  fromMeasurementId: string,
  toMeasurementId: string,
  quantity: number,
  measurements: Measurement[]
): number | null {
  // If same unit, no conversion needed
  if (fromMeasurementId === toMeasurementId) {
    return quantity;
  }

  const fromMeasurement = measurements.find((m) => m.id === fromMeasurementId);
  if (!fromMeasurement) return null;

  // Check for direct conversion
  const directConversion = fromMeasurement.conversions.find(
    (c) => c.toMeasurementId === toMeasurementId
  );
  
  if (directConversion) {
    return quantity * directConversion.factor;
  }

  // No conversion path found
  return null;
}

 // Find the total available quantity of an ingredient in inventory, converting all units to the target measurement unit

export function getTotalInventoryInUnit(
  ingredientId: string,
  targetMeasurementId: string,
  inventory: Array<{ ingredientId: string; measurementId: string; quantity: number }>,
  measurements: Measurement[]
): number {
  let total = 0;

  // Find all inventory items for this ingredient
  const inventoryItems = inventory.filter((item) => item.ingredientId === ingredientId);

  // Convert each to the target unit and sum
  for (const item of inventoryItems) {
    const converted = convertMeasurement(
      item.measurementId,
      targetMeasurementId,
      item.quantity,
      measurements
    );
    
    if (converted !== null) {
      total += converted;
    }
  }

  return total;
}


 // Check if there's enough inventory for a required ingredient, automatically converting between compatible units
export function hasEnoughInventory(
  ingredientId: string,
  requiredMeasurementId: string,
  requiredQuantity: number,
  inventory: Array<{ ingredientId: string; measurementId: string; quantity: number }>,
  measurements: Measurement[]
): { hasEnough: boolean; available: number; convertedFrom?: string } {
  // Get total available in the required unit
  const totalAvailable = getTotalInventoryInUnit(
    ingredientId,
    requiredMeasurementId,
    inventory,
    measurements
  );

  return {
    hasEnough: totalAvailable >= requiredQuantity,
    available: totalAvailable,
  };
}

/**
 * Deduct ingredients from inventory, automatically converting units as needed
 * Returns the updated inventory array
 */
export function deductFromInventory(
  ingredientId: string,
  requiredMeasurementId: string,
  requiredQuantity: number,
  inventory: Array<{ userId: string; ingredientId: string; measurementId: string; quantity: number }>,
  measurements: Measurement[],
  userId: string
): {
  updatedInventory: typeof inventory;
  deducted: Array<{ measurementId: string; quantity: number }>;
} {
  const deducted: Array<{ measurementId: string; quantity: number }> = [];
  let remainingToDeduct = requiredQuantity;
  let updatedInventory = [...inventory];

  // Find all inventory items for this ingredient and user
  const relevantItems = updatedInventory
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item }) => item.userId === userId && item.ingredientId === ingredientId
    );

  // Sort by preference: exact unit match first, then convertible units
  const sortedItems = relevantItems.sort((a, b) => {
    if (a.item.measurementId === requiredMeasurementId) return -1;
    if (b.item.measurementId === requiredMeasurementId) return 1;
    return 0;
  });

  for (const { item, index } of sortedItems) {
    if (remainingToDeduct <= 0) break;

    // Convert the remaining amount to this item's unit
    const amountInItemUnit = convertMeasurement(
      requiredMeasurementId,
      item.measurementId,
      remainingToDeduct,
      measurements
    );

    if (amountInItemUnit === null) continue; // Can't convert, skip this item

    // Determine how much we can deduct from this item
    const toDeduct = Math.min(item.quantity, amountInItemUnit);

    // Update the inventory item
    const newQuantity = item.quantity - toDeduct;
    
    if (newQuantity > 0.001) {
      // Keep the item with reduced quantity
      updatedInventory[index] = {
        ...item,
        quantity: newQuantity,
      };
    } else {
      // Remove the item (mark for removal)
      updatedInventory[index] = { ...item, quantity: -1 };
    }

    // Record what was deducted
    deducted.push({
      measurementId: item.measurementId,
      quantity: toDeduct,
    });

    // Convert back to required unit to track remaining
    const deductedInRequiredUnit = convertMeasurement(
      item.measurementId,
      requiredMeasurementId,
      toDeduct,
      measurements
    );

    if (deductedInRequiredUnit !== null) {
      remainingToDeduct -= deductedInRequiredUnit;
    }
  }

  // Remove items marked for deletion (quantity === -1)
  updatedInventory = updatedInventory.filter((item) => item.quantity !== -1);

  return { updatedInventory, deducted };
}
