export interface User {
  id: string;
  username: string;
  password: string;
}

export interface Ingredient {
  id: string;
  name: string;
  isCustom?: boolean;
}

export interface Measurement {
  id: string;
  name: string;
  conversions: MeasurementConversion[];
}

export interface MeasurementConversion {
  toMeasurementId: string;
  factor: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
  measurementId: string;
}

export interface Recipe {
  id: string;
  userId: string;
  name: string;
  description: string;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  viewCount: number;
  cookCount: number;
  createdAt: number;
}

export interface InventoryItem {
  userId: string;
  ingredientId: string;
  quantity: number;
  measurementId: string;
}

export interface CookingSession {
  id: string;
  recipeId: string;
  userId: string;
  ingredientsChecked: number[];
  stepsChecked: number[];
  servingSize: number;
  status: 'active' | 'completed' | 'cancelled';
}

export interface AppData {
  users: User[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  measurements: Measurement[];
  inventory: InventoryItem[];
  cookingSessions: CookingSession[];
  currentUserId: string | null;
  version?: number;
}
