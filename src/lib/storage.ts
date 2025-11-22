import { AppData, User, Recipe, Ingredient, Measurement, InventoryItem, CookingSession } from '../types';

const STORAGE_KEY = 'cucina-app-data';
const DATA_VERSION = 3; // Increment this when adding new default items

const defaultMeasurements: Measurement[] = [
  // ==================== VOLUME - US CUSTOMARY ====================
  { 
    id: '1', 
    name: 'cup', 
    conversions: [
      // To other US volume
      { toMeasurementId: '2', factor: 16 },           // 1 cup = 16 tablespoons
      { toMeasurementId: '3', factor: 48 },           // 1 cup = 48 teaspoons
      { toMeasurementId: '4', factor: 8 },            // 1 cup = 8 fluid ounces
      { toMeasurementId: '5', factor: 0.5 },          // 1 cup = 0.5 pints
      { toMeasurementId: '6', factor: 0.25 },         // 1 cup = 0.25 quarts
      { toMeasurementId: '7', factor: 0.0625 },       // 1 cup = 0.0625 gallons
      // To metric volume
      { toMeasurementId: '8', factor: 0.236588 },     // 1 cup = 0.236588 liters
      { toMeasurementId: '9', factor: 236.588 },      // 1 cup = 236.588 milliliters
    ] 
  },
  { 
    id: '2', 
    name: 'tablespoon', 
    conversions: [
      // To other US volume
      { toMeasurementId: '1', factor: 0.0625 },       // 1 tbsp = 0.0625 cups
      { toMeasurementId: '3', factor: 3 },            // 1 tbsp = 3 teaspoons
      { toMeasurementId: '4', factor: 0.5 },          // 1 tbsp = 0.5 fluid ounces
      { toMeasurementId: '5', factor: 0.03125 },      // 1 tbsp = 0.03125 pints
      { toMeasurementId: '6', factor: 0.015625 },     // 1 tbsp = 0.015625 quarts
      { toMeasurementId: '7', factor: 0.00390625 },   // 1 tbsp = 0.00390625 gallons
      // To metric volume
      { toMeasurementId: '8', factor: 0.0147868 },    // 1 tbsp = 0.0147868 liters
      { toMeasurementId: '9', factor: 14.7868 },      // 1 tbsp = 14.7868 milliliters
    ] 
  },
  { 
    id: '3', 
    name: 'teaspoon', 
    conversions: [
      // To other US volume
      { toMeasurementId: '1', factor: 0.0208333 },    // 1 tsp = 0.0208333 cups
      { toMeasurementId: '2', factor: 0.333333 },     // 1 tsp = 0.333333 tablespoons
      { toMeasurementId: '4', factor: 0.166667 },     // 1 tsp = 0.166667 fluid ounces
      { toMeasurementId: '5', factor: 0.0104167 },    // 1 tsp = 0.0104167 pints
      { toMeasurementId: '6', factor: 0.00520833 },   // 1 tsp = 0.00520833 quarts
      { toMeasurementId: '7', factor: 0.00130208 },   // 1 tsp = 0.00130208 gallons
      // To metric volume
      { toMeasurementId: '8', factor: 0.00492892 },   // 1 tsp = 0.00492892 liters
      { toMeasurementId: '9', factor: 4.92892 },      // 1 tsp = 4.92892 milliliters
    ] 
  },
  { 
    id: '4', 
    name: 'fluid ounce', 
    conversions: [
      // To other US volume
      { toMeasurementId: '1', factor: 0.125 },        // 1 fl oz = 0.125 cups
      { toMeasurementId: '2', factor: 2 },            // 1 fl oz = 2 tablespoons
      { toMeasurementId: '3', factor: 6 },            // 1 fl oz = 6 teaspoons
      { toMeasurementId: '5', factor: 0.0625 },       // 1 fl oz = 0.0625 pints
      { toMeasurementId: '6', factor: 0.03125 },      // 1 fl oz = 0.03125 quarts
      { toMeasurementId: '7', factor: 0.0078125 },    // 1 fl oz = 0.0078125 gallons
      // To metric volume
      { toMeasurementId: '8', factor: 0.0295735 },    // 1 fl oz = 0.0295735 liters
      { toMeasurementId: '9', factor: 29.5735 },      // 1 fl oz = 29.5735 milliliters
    ] 
  },
  { 
    id: '5', 
    name: 'pint', 
    conversions: [
      // To other US volume
      { toMeasurementId: '1', factor: 2 },            // 1 pint = 2 cups
      { toMeasurementId: '2', factor: 32 },           // 1 pint = 32 tablespoons
      { toMeasurementId: '3', factor: 96 },           // 1 pint = 96 teaspoons
      { toMeasurementId: '4', factor: 16 },           // 1 pint = 16 fluid ounces
      { toMeasurementId: '6', factor: 0.5 },          // 1 pint = 0.5 quarts
      { toMeasurementId: '7', factor: 0.125 },        // 1 pint = 0.125 gallons
      // To metric volume
      { toMeasurementId: '8', factor: 0.473176 },     // 1 pint = 0.473176 liters
      { toMeasurementId: '9', factor: 473.176 },      // 1 pint = 473.176 milliliters
    ] 
  },
  { 
    id: '6', 
    name: 'quart', 
    conversions: [
      // To other US volume
      { toMeasurementId: '1', factor: 4 },            // 1 quart = 4 cups
      { toMeasurementId: '2', factor: 64 },           // 1 quart = 64 tablespoons
      { toMeasurementId: '3', factor: 192 },          // 1 quart = 192 teaspoons
      { toMeasurementId: '4', factor: 32 },           // 1 quart = 32 fluid ounces
      { toMeasurementId: '5', factor: 2 },            // 1 quart = 2 pints
      { toMeasurementId: '7', factor: 0.25 },         // 1 quart = 0.25 gallons
      // To metric volume
      { toMeasurementId: '8', factor: 0.946353 },     // 1 quart = 0.946353 liters
      { toMeasurementId: '9', factor: 946.353 },      // 1 quart = 946.353 milliliters
    ] 
  },
  { 
    id: '7', 
    name: 'gallon', 
    conversions: [
      // To other US volume
      { toMeasurementId: '1', factor: 16 },           // 1 gallon = 16 cups
      { toMeasurementId: '2', factor: 256 },          // 1 gallon = 256 tablespoons
      { toMeasurementId: '3', factor: 768 },          // 1 gallon = 768 teaspoons
      { toMeasurementId: '4', factor: 128 },          // 1 gallon = 128 fluid ounces
      { toMeasurementId: '5', factor: 8 },            // 1 gallon = 8 pints
      { toMeasurementId: '6', factor: 4 },            // 1 gallon = 4 quarts
      // To metric volume
      { toMeasurementId: '8', factor: 3.78541 },      // 1 gallon = 3.78541 liters
      { toMeasurementId: '9', factor: 3785.41 },      // 1 gallon = 3785.41 milliliters
    ] 
  },
  
  // ==================== VOLUME - METRIC ====================
  { 
    id: '8', 
    name: 'liter', 
    conversions: [
      // To metric volume
      { toMeasurementId: '9', factor: 1000 },         // 1 liter = 1000 milliliters
      // To US volume
      { toMeasurementId: '1', factor: 4.22675 },      // 1 liter = 4.22675 cups
      { toMeasurementId: '2', factor: 67.628 },       // 1 liter = 67.628 tablespoons
      { toMeasurementId: '3', factor: 202.884 },      // 1 liter = 202.884 teaspoons
      { toMeasurementId: '4', factor: 33.814 },       // 1 liter = 33.814 fluid ounces
      { toMeasurementId: '5', factor: 2.11338 },      // 1 liter = 2.11338 pints
      { toMeasurementId: '6', factor: 1.05669 },      // 1 liter = 1.05669 quarts
      { toMeasurementId: '7', factor: 0.264172 },     // 1 liter = 0.264172 gallons
    ] 
  },
  { 
    id: '9', 
    name: 'milliliter', 
    conversions: [
      // To metric volume
      { toMeasurementId: '8', factor: 0.001 },        // 1 ml = 0.001 liters
      // To US volume
      { toMeasurementId: '1', factor: 0.00422675 },   // 1 ml = 0.00422675 cups
      { toMeasurementId: '2', factor: 0.067628 },     // 1 ml = 0.067628 tablespoons
      { toMeasurementId: '3', factor: 0.202884 },     // 1 ml = 0.202884 teaspoons
      { toMeasurementId: '4', factor: 0.033814 },     // 1 ml = 0.033814 fluid ounces
      { toMeasurementId: '5', factor: 0.00211338 },   // 1 ml = 0.00211338 pints
      { toMeasurementId: '6', factor: 0.00105669 },   // 1 ml = 0.00105669 quarts
      { toMeasurementId: '7', factor: 0.000264172 },  // 1 ml = 0.000264172 gallons
    ] 
  },
  
  // ==================== WEIGHT - US CUSTOMARY ====================
  { 
    id: '10', 
    name: 'ounce', 
    conversions: [
      // To other US weight
      { toMeasurementId: '12', factor: 0.0625 },      // 1 oz = 0.0625 pounds
      // To metric weight
      { toMeasurementId: '11', factor: 28.3495 },     // 1 oz = 28.3495 grams
      { toMeasurementId: '13', factor: 0.0283495 },   // 1 oz = 0.0283495 kilograms
      { toMeasurementId: '14', factor: 28349.5 },     // 1 oz = 28349.5 milligrams
    ] 
  },
  { 
    id: '12', 
    name: 'pound', 
    conversions: [
      // To other US weight
      { toMeasurementId: '10', factor: 16 },          // 1 lb = 16 ounces
      // To metric weight
      { toMeasurementId: '11', factor: 453.592 },     // 1 lb = 453.592 grams
      { toMeasurementId: '13', factor: 0.453592 },    // 1 lb = 0.453592 kilograms
      { toMeasurementId: '14', factor: 453592 },      // 1 lb = 453592 milligrams
    ] 
  },
  
  // ==================== WEIGHT - METRIC ====================
  { 
    id: '14', 
    name: 'milligram', 
    conversions: [
      // To metric weight
      { toMeasurementId: '11', factor: 0.001 },       // 1 mg = 0.001 grams
      { toMeasurementId: '13', factor: 0.000001 },    // 1 mg = 0.000001 kilograms
      // To US weight
      { toMeasurementId: '10', factor: 0.000035274 }, // 1 mg = 0.000035274 ounces
      { toMeasurementId: '12', factor: 0.0000022046 }, // 1 mg = 0.0000022046 pounds
    ] 
  },
  { 
    id: '11', 
    name: 'gram', 
    conversions: [
      // To metric weight
      { toMeasurementId: '14', factor: 1000 },        // 1 g = 1000 milligrams
      { toMeasurementId: '13', factor: 0.001 },       // 1 g = 0.001 kilograms
      // To US weight
      { toMeasurementId: '10', factor: 0.035274 },    // 1 g = 0.035274 ounces
      { toMeasurementId: '12', factor: 0.00220462 },  // 1 g = 0.00220462 pounds
    ] 
  },
  { 
    id: '13', 
    name: 'kilogram', 
    conversions: [
      // To metric weight
      { toMeasurementId: '14', factor: 1000000 },     // 1 kg = 1,000,000 milligrams
      { toMeasurementId: '11', factor: 1000 },        // 1 kg = 1000 grams
      // To US weight
      { toMeasurementId: '10', factor: 35.274 },      // 1 kg = 35.274 ounces
      { toMeasurementId: '12', factor: 2.20462 },     // 1 kg = 2.20462 pounds
    ] 
  },
  
  // ==================== COUNTABLE UNITS (NO CONVERSIONS) ====================
  { id: '15', name: 'piece', conversions: [] },
  { id: '16', name: 'slice', conversions: [] },
  { id: '17', name: 'clove', conversions: [] },
  { id: '18', name: 'bunch', conversions: [] },
  { id: '19', name: 'can', conversions: [] },
  { id: '20', name: 'package', conversions: [] },
  { id: '21', name: 'handful', conversions: [] },
  { id: '22', name: 'pinch', conversions: [] },
  { id: '23', name: 'dash', conversions: [] },
  { id: '24', name: 'sprig', conversions: [] },
  { id: '25', name: 'leaf', conversions: [] },
];

const defaultIngredients: Ingredient[] = [
  // Seasonings & Spices
  { id: '1', name: 'Salt' },
  { id: '2', name: 'Black Pepper' },
  { id: '3', name: 'White Pepper' },
  { id: '4', name: 'Red Pepper Flakes' },
  { id: '5', name: 'Paprika' },
  { id: '6', name: 'Cayenne Pepper' },
  { id: '7', name: 'Cumin' },
  { id: '8', name: 'Coriander' },
  { id: '9', name: 'Turmeric' },
  { id: '10', name: 'Cinnamon' },
  { id: '11', name: 'Nutmeg' },
  { id: '12', name: 'Ginger' },
  { id: '13', name: 'Garlic Powder' },
  { id: '14', name: 'Onion Powder' },
  { id: '15', name: 'Chili Powder' },
  
  // Fresh Herbs
  { id: '16', name: 'Basil' },
  { id: '17', name: 'Oregano' },
  { id: '18', name: 'Thyme' },
  { id: '19', name: 'Rosemary' },
  { id: '20', name: 'Parsley' },
  { id: '21', name: 'Cilantro' },
  { id: '22', name: 'Mint' },
  { id: '23', name: 'Dill' },
  { id: '24', name: 'Sage' },
  { id: '25', name: 'Bay Leaf' },
  
  // Oils & Fats
  { id: '26', name: 'Olive Oil' },
  { id: '27', name: 'Vegetable Oil' },
  { id: '28', name: 'Coconut Oil' },
  { id: '29', name: 'Sesame Oil' },
  { id: '30', name: 'Butter' },
  { id: '31', name: 'Margarine' },
  
  // Fresh Vegetables
  { id: '32', name: 'Onion' },
  { id: '33', name: 'Garlic' },
  { id: '34', name: 'Tomato' },
  { id: '35', name: 'Bell Pepper' },
  { id: '36', name: 'Carrot' },
  { id: '37', name: 'Celery' },
  { id: '38', name: 'Potato' },
  { id: '39', name: 'Sweet Potato' },
  { id: '40', name: 'Broccoli' },
  { id: '41', name: 'Cauliflower' },
  { id: '42', name: 'Spinach' },
  { id: '43', name: 'Kale' },
  { id: '44', name: 'Lettuce' },
  { id: '45', name: 'Cucumber' },
  { id: '46', name: 'Zucchini' },
  { id: '47', name: 'Eggplant' },
  { id: '48', name: 'Mushroom' },
  { id: '49', name: 'Corn' },
  { id: '50', name: 'Green Beans' },
  
  // Proteins
  { id: '51', name: 'Chicken Breast' },
  { id: '52', name: 'Chicken Thigh' },
  { id: '53', name: 'Ground Beef' },
  { id: '54', name: 'Beef Steak' },
  { id: '55', name: 'Pork Chop' },
  { id: '56', name: 'Ground Pork' },
  { id: '57', name: 'Bacon' },
  { id: '58', name: 'Sausage' },
  { id: '59', name: 'Salmon' },
  { id: '60', name: 'Tuna' },
  { id: '61', name: 'Shrimp' },
  { id: '62', name: 'Tofu' },
  { id: '63', name: 'Egg' },
  
  // Dairy
  { id: '64', name: 'Milk' },
  { id: '65', name: 'Heavy Cream' },
  { id: '66', name: 'Sour Cream' },
  { id: '67', name: 'Yogurt' },
  { id: '68', name: 'Cheese' },
  { id: '69', name: 'Parmesan Cheese' },
  { id: '70', name: 'Mozzarella Cheese' },
  { id: '71', name: 'Cheddar Cheese' },
  { id: '72', name: 'Cream Cheese' },
  
  // Grains & Pasta
  { id: '73', name: 'Rice' },
  { id: '74', name: 'Brown Rice' },
  { id: '75', name: 'Pasta' },
  { id: '76', name: 'Spaghetti' },
  { id: '77', name: 'Bread' },
  { id: '78', name: 'Flour' },
  { id: '79', name: 'All-Purpose Flour' },
  { id: '80', name: 'Bread Flour' },
  { id: '81', name: 'Whole Wheat Flour' },
  { id: '82', name: 'Cornstarch' },
  { id: '83', name: 'Breadcrumbs' },
  { id: '84', name: 'Oats' },
  { id: '85', name: 'Quinoa' },
  
  // Legumes & Beans
  { id: '86', name: 'Black Beans' },
  { id: '87', name: 'Kidney Beans' },
  { id: '88', name: 'Chickpeas' },
  { id: '89', name: 'Lentils' },
  { id: '90', name: 'Peanuts' },
  
  // Sweeteners
  { id: '91', name: 'Sugar' },
  { id: '92', name: 'Brown Sugar' },
  { id: '93', name: 'Honey' },
  { id: '94', name: 'Maple Syrup' },
  { id: '95', name: 'Vanilla Extract' },
  
  // Condiments & Sauces
  { id: '96', name: 'Soy Sauce' },
  { id: '97', name: 'Worcestershire Sauce' },
  { id: '98', name: 'Hot Sauce' },
  { id: '99', name: 'Ketchup' },
  { id: '100', name: 'Mustard' },
  { id: '101', name: 'Mayonnaise' },
  { id: '102', name: 'Vinegar' },
  { id: '103', name: 'Balsamic Vinegar' },
  { id: '104', name: 'Apple Cider Vinegar' },
  { id: '105', name: 'Lemon Juice' },
  { id: '106', name: 'Lime Juice' },
  
  // Canned & Preserved
  { id: '107', name: 'Tomato Paste' },
  { id: '108', name: 'Tomato Sauce' },
  { id: '109', name: 'Canned Tomatoes' },
  { id: '110', name: 'Chicken Broth' },
  { id: '111', name: 'Beef Broth' },
  { id: '112', name: 'Vegetable Broth' },
  { id: '113', name: 'Coconut Milk' },
  
  // Baking
  { id: '114', name: 'Baking Powder' },
  { id: '115', name: 'Baking Soda' },
  { id: '116', name: 'Yeast' },
  { id: '117', name: 'Chocolate Chips' },
  { id: '118', name: 'Cocoa Powder' },
  
  // Nuts & Seeds
  { id: '119', name: 'Almonds' },
  { id: '120', name: 'Walnuts' },
  { id: '121', name: 'Cashews' },
  { id: '122', name: 'Pine Nuts' },
  { id: '123', name: 'Sesame Seeds' },
  { id: '124', name: 'Sunflower Seeds' },
  
  // Fruits
  { id: '125', name: 'Lemon' },
  { id: '126', name: 'Lime' },
  { id: '127', name: 'Apple' },
  { id: '128', name: 'Banana' },
  { id: '129', name: 'Orange' },
  { id: '130', name: 'Strawberry' },
  { id: '131', name: 'Blueberry' },
  { id: '132', name: 'Avocado' },
];

const defaultRecipes: Recipe[] = [
  {
    id: '1',
    userId: 'demo',
    name: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta dish with eggs, cheese, and pancetta',
    servings: 4,
    ingredients: [
      { ingredientId: '75', quantity: 400, measurementId: '11' },
      { ingredientId: '63', quantity: 4, measurementId: '15' },
      { ingredientId: '68', quantity: 100, measurementId: '11' },
      { ingredientId: '2', quantity: 1, measurementId: '3' },
      { ingredientId: '1', quantity: 1, measurementId: '22' },
    ],
    instructions: [
      'Bring a large pot of salted water to boil and cook pasta according to package directions',
      'While pasta cooks, whisk eggs and grated cheese together in a bowl',
      'Cook pancetta in a large skillet until crispy',
      'Drain pasta, reserving 1 cup of pasta water',
      'Add hot pasta to the skillet with pancetta',
      'Remove from heat and quickly mix in egg mixture, adding pasta water to create a creamy sauce',
      'Season with black pepper and serve immediately',
    ],
    viewCount: 24,
    cookCount: 8,
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: '2',
    userId: 'demo',
    name: 'Garlic Butter Chicken',
    description: 'Juicy chicken breasts in a rich garlic butter sauce',
    servings: 2,
    ingredients: [
      { ingredientId: '51', quantity: 2, measurementId: '15' },
      { ingredientId: '30', quantity: 3, measurementId: '2' },
      { ingredientId: '33', quantity: 4, measurementId: '17' },
      { ingredientId: '1', quantity: 1, measurementId: '3' },
      { ingredientId: '2', quantity: 0.5, measurementId: '3' },
      { ingredientId: '5', quantity: 1, measurementId: '3' },
    ],
    instructions: [
      'Season chicken breasts with salt, pepper, and paprika',
      'Heat 1 tablespoon butter in a skillet over medium-high heat',
      'Cook chicken for 6-7 minutes per side until golden and cooked through',
      'Remove chicken and set aside',
      'Add remaining butter and minced garlic to the pan',
      'Cook garlic for 1 minute until fragrant',
      'Return chicken to pan and coat with garlic butter',
      'Serve hot with your favorite sides',
    ],
    viewCount: 18,
    cookCount: 12,
    createdAt: Date.now() - 86400000 * 15,
  },
];

function getDefaultData(): AppData {
  return {
    users: [{ id: 'demo', username: 'demo', password: 'demo' }],
    recipes: defaultRecipes,
    ingredients: defaultIngredients,
    measurements: defaultMeasurements,
    inventory: [],
    cookingSessions: [],
    currentUserId: null,
    version: DATA_VERSION,
  };
}

function mergeDefaultItems<T extends { id: string; name: string }>(
  existingItems: T[],
  defaultItems: T[]
): T[] {
  const existingIds = new Set(existingItems.map(item => item.id));
  const existingNames = new Set(existingItems.map(item => item.name.toLowerCase()));
  
  // Add default items that don't exist (by ID or name)
  const itemsToAdd = defaultItems.filter(
    item => !existingIds.has(item.id) && !existingNames.has(item.name.toLowerCase())
  );
  
  return [...existingItems, ...itemsToAdd];
}

export function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      
      // Migrate data if version is outdated
      if (!data.version || data.version < DATA_VERSION) {
        console.log('Migrating data to version', DATA_VERSION);
        
        // Merge new default ingredients and measurements with existing data
        data.ingredients = mergeDefaultItems(data.ingredients || [], defaultIngredients);
        data.measurements = mergeDefaultItems(data.measurements || [], defaultMeasurements);
        data.version = DATA_VERSION;
        
        // Save the migrated data
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
      
      return data;
    }
  } catch (e) {
    console.error('Failed to load data:', e);
  }
  return getDefaultData();
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
