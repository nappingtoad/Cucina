import { useState, useEffect } from 'react';
import { AppData, Recipe, CookingSession } from './types';
import { loadData, saveData, generateId } from './lib/storage';
import { deductFromInventory } from './lib/conversions';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { RecipesList } from './components/RecipesList';
import { RecipeDetail } from './components/RecipeDetail';
import { RecipeForm } from './components/RecipeForm';
import { CookMode } from './components/CookMode';
import { IngredientsManager } from './components/IngredientsManager';
import { MeasurementsManager } from './components/MeasurementsManager';
import { InventoryManager } from './components/InventoryManager';
import { Button } from './components/ui/button';
import { ChefHat, Home, BookOpen, ShoppingBasket, Layers, Ruler, LogOut, Menu, X } from 'lucide-react';
import { Toaster } from './components/ui/sonner';

// Defines all possible application views
type View =
  | 'dashboard'
  | 'recipes'
  | 'recipe-detail'
  | 'recipe-form'
  | 'cook-mode'
  | 'ingredients'
  | 'measurements'
  | 'inventory';

export default function App() {
  // Main application state, loaded from storage on startup
  const [data, setData] = useState<AppData>(loadData());
  // Controls the main content display area
  const [currentView, setCurrentView] = useState<View>('dashboard');
  // Stores the ID of the recipe currently being viewed in detail/cook mode
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  // Stores the ID of the recipe currently being edited
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  // Controls the visibility and size of the navigation sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Effect to persist data whenever the 'data' state changes
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Derived state: current user and their scoped data
  const currentUser = data.users.find((u) => u.id === data.currentUserId);
  const userRecipes = data.recipes.filter((r) => r.userId === data.currentUserId);
  // Inventory is filtered to show only items owned by the current user
  const userInventory = data.inventory.filter((i) => i.userId === data.currentUserId);


   // Handles user login attempt. Sets `currentUserId` on success.
  const handleLogin = (username: string, password: string): boolean => {
    const user = data.users.find((u) => u.username === username && u.password === password);
    if (user) {
      setData({ ...data, currentUserId: user.id });
      return true;
    }
    return false;
  };


   // Handles new user registration. Adds user if username is unique.
  const handleSignup = (username: string, password: string): boolean => {
    const exists = data.users.find((u) => u.username === username);
    if (exists) return false;

    const newUser = { id: generateId(), username, password };
    setData({ ...data, users: [...data.users, newUser] });
    return true;
  };


   // Clears the current user session.
  const handleLogout = () => {
    setData({ ...data, currentUserId: null });
    setCurrentView('dashboard');
  };


   // Navigates to the recipe creation form.
  const handleAddRecipe = () => {
    setEditingRecipeId(null);
    setCurrentView('recipe-form');
  };


   // Sets recipe ID for editing and navigates to the form.
  const handleEditRecipe = (recipeId: string) => {
    setEditingRecipeId(recipeId);
    setCurrentView('recipe-form');
  };

   // Increments recipe view count and navigates to the detail view.
  const handleViewRecipe = (recipeId: string) => {
    const recipe = data.recipes.find((r) => r.id === recipeId);
    if (recipe) {
      // Increment view counter before navigating
      const updatedRecipes = data.recipes.map((r) =>
        r.id === recipeId ? { ...r, viewCount: r.viewCount + 1 } : r
      );
      setData({ ...data, recipes: updatedRecipes });
      setSelectedRecipeId(recipeId);
      setCurrentView('recipe-detail');
    }
  };


   // Saves or updates a recipe based on whether `editingRecipeId` is set.
  const handleSaveRecipe = (recipeData: Omit<Recipe, 'id' | 'userId' | 'viewCount' | 'cookCount' | 'createdAt'>) => {
    if (editingRecipeId) {
      // Update existing recipe
      const updatedRecipes = data.recipes.map((r) =>
        r.id === editingRecipeId ? { ...r, ...recipeData } : r
      );
      setData({ ...data, recipes: updatedRecipes });
    } else {
      // Create new recipe
      const newRecipe: Recipe = {
        ...recipeData,
        id: generateId(),
        userId: data.currentUserId!,
        viewCount: 0,
        cookCount: 0,
        createdAt: Date.now(),
      };
      setData({ ...data, recipes: [...data.recipes, newRecipe] });
    }
    setCurrentView('recipes');
  };

   // Deletes a recipe and any associated active cooking sessions.
  const handleDeleteRecipe = (recipeId: string) => {
    const updatedRecipes = data.recipes.filter((r) => r.id !== recipeId);
    const updatedSessions = data.cookingSessions.filter((s) => s.recipeId !== recipeId);
    setData({ ...data, recipes: updatedRecipes, cookingSessions: updatedSessions });
  };


   // Starts a cooking session or resumes an active one for the given recipe.
  const handleStartCooking = (recipeId: string) => {
    const recipe = data.recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    // Check for existing active session to resume it
    const existingSession = data.cookingSessions.find(
      (s) => s.recipeId === recipeId && s.userId === data.currentUserId && s.status === 'active'
    );

    if (!existingSession) {
      // Create a new session if none exists
      const newSession: CookingSession = {
        id: generateId(),
        recipeId,
        userId: data.currentUserId!,
        ingredientsChecked: [],
        stepsChecked: [],
        servingSize: recipe.servings,
        status: 'active',
      };
      setData({ ...data, cookingSessions: [...data.cookingSessions, newSession] });
    }

    setSelectedRecipeId(recipeId);
    setCurrentView('cook-mode');
  };


   // Persists the current session state (progress, serving size) from the CookMode component.
  const handleUpdateCookingSession = (session: CookingSession) => {
    const updatedSessions = data.cookingSessions.map((s) =>
      s.id === session.id ? session : s
    );
    setData({ ...data, cookingSessions: updatedSessions });
  };

  /**
   * Handles final completion:
   * 1. Calculates scaled ingredient requirements.
   * 2. Deducts required ingredients from the user's inventory using unit conversion utility.
   * 3. Increments the recipe's cook counter.
   * 4. Marks the session as 'completed'.
   */
  const handleCompleteCooking = () => {
    const session = data.cookingSessions.find(
      (s) => s.recipeId === selectedRecipeId && s.userId === data.currentUserId && s.status === 'active'
    );
    
    if (session) {
      const recipe = data.recipes.find((r) => r.id === selectedRecipeId);
      
      if (recipe && data.currentUserId) {
        // Calculate scaling factor based on session serving size
        const scalingFactor = session.servingSize / recipe.servings;
        
        let updatedInventory = [...data.inventory];
        
        // Loop through recipe ingredients to deduct from inventory
        recipe.ingredients.forEach((ing) => {
          const requiredAmount = ing.quantity * scalingFactor;
          
          // Use the conversion utility to deduct from inventory
          const result = deductFromInventory(
            ing.ingredientId,
            ing.measurementId,
            requiredAmount,
            updatedInventory,
            data.measurements,
            data.currentUserId!
          );
          
          updatedInventory = result.updatedInventory;
        });
        
        // Mark session as completed
        const updatedSessions = data.cookingSessions.map((s) =>
          s.id === session.id ? { ...s, status: 'completed' as const } : s
        );
        // Increment cook count
        const updatedRecipes = data.recipes.map((r) =>
          r.id === selectedRecipeId ? { ...r, cookCount: r.cookCount + 1 } : r
        );
        
        setData({ 
          ...data, 
          cookingSessions: updatedSessions, 
          recipes: updatedRecipes,
          inventory: updatedInventory 
        });
      }
    }
    
    setCurrentView('recipes');
  };


   // Marks the current active session as 'cancelled'. No inventory deduction occurs.
  const handleCancelCooking = () => {
    const session = data.cookingSessions.find(
      (s) => s.recipeId === selectedRecipeId && s.userId === data.currentUserId && s.status === 'active'
    );
    
    if (session) {
      const updatedSessions = data.cookingSessions.map((s) =>
        s.id === session.id ? { ...s, status: 'cancelled' as const } : s
      );
      setData({ ...data, cookingSessions: updatedSessions });
    }
    
    setCurrentView('recipes');
  };

  // --- Ingredient Management Handlers ---

  const handleAddIngredient = (name: string) => {
    const newIngredient = { id: generateId(), name, isCustom: true };
    setData({ ...data, ingredients: [...data.ingredients, newIngredient] });
  };

  const handleEditIngredient = (id: string, name: string) => {
    const updatedIngredients = data.ingredients.map((i) =>
      i.id === id ? { ...i, name } : i
    );
    setData({ ...data, ingredients: updatedIngredients });
  };

  const handleDeleteIngredient = (id: string) => {
    // Note: Does not currently cascade delete/cleanup recipe or inventory linkages
    const updatedIngredients = data.ingredients.filter((i) => i.id !== id);
    setData({ ...data, ingredients: updatedIngredients });
  };

  // --- Measurement Management Handlers ---

  const handleAddMeasurement = (name: string) => {
    const newMeasurement = { id: generateId(), name, conversions: [] };
    setData({ ...data, measurements: [...data.measurements, newMeasurement] });
  };

  const handleEditMeasurement = (id: string, name: string) => {
    const updatedMeasurements = data.measurements.map((m) =>
      m.id === id ? { ...m, name } : m
    );
    setData({ ...data, measurements: updatedMeasurements });
  };

  const handleDeleteMeasurement = (id: string) => {
    // Note: Does not currently cascade delete/cleanup recipe or inventory linkages
    const updatedMeasurements = data.measurements.filter((m) => m.id !== id);
    setData({ ...data, measurements: updatedMeasurements });
  };

   // Adds or updates a conversion factor between two measurements.
  const handleAddConversion = (fromId: string, toId: string, factor: number) => {
    const updatedMeasurements = data.measurements.map((m) => {
      if (m.id === fromId) {
        const existingConversion = m.conversions.find((c) => c.toMeasurementId === toId);
        
        // Logic to either update existing conversion or add a new one
        if (existingConversion) {
          return {
            ...m,
            conversions: m.conversions.map((c) =>
              c.toMeasurementId === toId ? { ...c, factor } : c
            ),
          };
        } else {
          return {
            ...m,
            conversions: [...m.conversions, { toMeasurementId: toId, factor }],
          };
        }
      }
      return m;
    });
    setData({ ...data, measurements: updatedMeasurements });
  };

   // Removes a specific conversion entry from a source measurement.
  const handleRemoveConversion = (fromId: string, toId: string) => {
    const updatedMeasurements = data.measurements.map((m) => {
      if (m.id === fromId) {
        return {
          ...m,
          conversions: m.conversions.filter((c) => c.toMeasurementId !== toId),
        };
      }
      return m;
    });
    setData({ ...data, measurements: updatedMeasurements });
  };

  // --- Inventory Management Handlers ---

   // Adds a new inventory item or increments quantity if an item with the same ID and unit already exists.
  const handleAddInventoryItem = (item: Omit<typeof data.inventory[0], 'userId'>) => {
    const existingIndex = data.inventory.findIndex(
      (i) =>
        i.userId === data.currentUserId &&
        i.ingredientId === item.ingredientId &&
        i.measurementId === item.measurementId
    );

    if (existingIndex >= 0) {
      // If item exists in the same unit, increment quantity
      const updatedInventory = [...data.inventory];
      updatedInventory[existingIndex] = {
        ...updatedInventory[existingIndex],
        quantity: updatedInventory[existingIndex].quantity + item.quantity,
      };
      setData({ ...data, inventory: updatedInventory });
    } else {
      // Add as a new item
      const newItem = { ...item, userId: data.currentUserId! };
      setData({ ...data, inventory: [...data.inventory, newItem] });
    }
  };

  /**
   * Edits an inventory item's quantity or measurement unit.
   * Complex logic handles unit changes by removing the old entry and merging/adding a new entry.
   */
  const handleEditInventoryItem = (
    ingredientId: string, 
    oldMeasurementId: string, 
    newMeasurementId: string, 
    quantity: number
  ) => {
    // Check if the measurement unit was changed during the edit
    if (oldMeasurementId !== newMeasurementId) {
      // 1. Remove the old entry (which is keyed by oldMeasurementId)
      const withoutOld = data.inventory.filter(
        (i) =>
          !(
            i.userId === data.currentUserId &&
            i.ingredientId === ingredientId &&
            i.measurementId === oldMeasurementId
          )
      );
      
      // 2. Check if an inventory item with the *new* unit already exists
      const existingIndex = withoutOld.findIndex(
        (i) =>
          i.userId === data.currentUserId &&
          i.ingredientId === ingredientId &&
          i.measurementId === newMeasurementId
      );
      
      if (existingIndex >= 0) {
        // 3a. If the new item exists, merge/add the quantity to the existing entry
        withoutOld[existingIndex] = {
          ...withoutOld[existingIndex],
          quantity: withoutOld[existingIndex].quantity + quantity,
        };
        setData({ ...data, inventory: withoutOld });
      } else {
        // 3b. If the new item doesn't exist, create a completely new entry with the new unit
        const newItem = {
          userId: data.currentUserId!,
          ingredientId,
          measurementId: newMeasurementId,
          quantity,
        };
        setData({ ...data, inventory: [...withoutOld, newItem] });
      }
    } else {
      // Simply update the quantity of the existing item
      const updatedInventory = data.inventory.map((i) =>
        i.userId === data.currentUserId &&
        i.ingredientId === ingredientId &&
        i.measurementId === oldMeasurementId
          ? { ...i, quantity }
          : i
      );
      setData({ ...data, inventory: updatedInventory });
    }
  };

   // Deletes a specific inventory item (identified by both ingredient and measurement ID).
  const handleDeleteInventoryItem = (ingredientId: string, measurementId: string) => {
    const updatedInventory = data.inventory.filter(
      (i) =>
        !(
          i.userId === data.currentUserId &&
          i.ingredientId === ingredientId &&
          i.measurementId === measurementId
        )
    );
    setData({ ...data, inventory: updatedInventory });
  };

  // --- Rendering Logic ---

  if (!currentUser) {
    return (
      <>
        {/* Shows AuthPage if no user is logged in */}
        <AuthPage onLogin={handleLogin} onSignup={handleSignup} />
        <Toaster />
      </>
    );
  }

  // Derived state used in rendering components
  const selectedRecipe = data.recipes.find((r) => r.id === selectedRecipeId);
  const editingRecipe = data.recipes.find((r) => r.id === editingRecipeId);
  // Finds the active session for the selected recipe/user combination
  const cookingSession = data.cookingSessions.find(
    (s) => s.recipeId === selectedRecipeId && s.userId === data.currentUserId && s.status === 'active'
  );

  return (
    <div className="min-h-screen relative" style={{
      // Custom background styling for aesthetic purposes
      background: `linear-gradient(135deg, rgba(250, 248, 245, 0.97) 0%, rgba(245, 241, 237, 0.97) 100%), url('https://images.unsplash.com/photo-1686806374120-e7ae3f19801d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxsaW5lbiUyMGZhYnJpYyUyMHRleHR1cmUlMjBiZWlnZXxlbnwxfHx8fDE3NjIzMzQ0Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080')`,
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed'
    }}>
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside 
          className={`${
            sidebarCollapsed ? 'w-20' : 'w-64'
          } min-h-screen bg-white border-r shadow-sm transition-all duration-300`}
        >
          <div className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <ChefHat className="w-8 h-8 flex-shrink-0" style={{ color: '#6b8e6f' }} />
              {!sidebarCollapsed && (
                <div>
                  <h1 style={{ color: '#6b8e6f' }}>Cucina</h1>
                  <p className="text-sm text-muted-foreground">Recipe Organizer</p>
                </div>
              )}
            </div>

            <div className="mb-6">
              {/* Sidebar Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                className="w-full"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? (
                  <Menu className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </Button>
            </div>

            <nav className="space-y-2">
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                onClick={() => setCurrentView('dashboard')}
                title="Dashboard"
              >
                <Home className="w-4 h-4" />
                {!sidebarCollapsed && <span className="ml-2">Dashboard</span>}
              </Button>
              <Button
                variant={currentView === 'recipes' ? 'default' : 'ghost'}
                className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                onClick={() => setCurrentView('recipes')}
                title="Recipes"
              >
                <BookOpen className="w-4 h-4" />
                {!sidebarCollapsed && <span className="ml-2">Recipes</span>}
              </Button>
              <Button
                variant={currentView === 'inventory' ? 'default' : 'ghost'}
                className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                onClick={() => setCurrentView('inventory')}
                title="Inventory"
              >
                <ShoppingBasket className="w-4 h-4" />
                {!sidebarCollapsed && <span className="ml-2">Inventory</span>}
              </Button>
              <Button
                variant={currentView === 'ingredients' ? 'default' : 'ghost'}
                className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                onClick={() => setCurrentView('ingredients')}
                title="Ingredients"
              >
                <Layers className="w-4 h-4" />
                {!sidebarCollapsed && <span className="ml-2">Ingredients</span>}
              </Button>
              <Button
                variant={currentView === 'measurements' ? 'default' : 'ghost'}
                className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                onClick={() => setCurrentView('measurements')}
                title="Measurements"
              >
                <Ruler className="w-4 h-4" />
                {!sidebarCollapsed && <span className="ml-2">Measurements</span>}
              </Button>
            </nav>

            <div className="mt-8 pt-8 border-t">
              {!sidebarCollapsed && (
                <div className="mb-4">
                  <p className="text-sm">Logged in as</p>
                  <p className="text-sm text-muted-foreground truncate">{currentUser.username}</p>
                </div>
              )}
              {/* Logout Button */}
              <Button 
                variant="outline" 
                className={`w-full ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start'}`}
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                {!sidebarCollapsed && <span className="ml-2">Logout</span>}
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content Area (Router) */}
        <main className="flex-1 p-8">
          {currentView === 'dashboard' && (
            <Dashboard
              recipes={userRecipes}
              ingredients={data.ingredients}
              measurements={data.measurements}
              onViewRecipe={handleViewRecipe}
              onCookRecipe={handleStartCooking}
              onAddRecipe={handleAddRecipe}
            />
          )}

          {currentView === 'recipes' && (
            <RecipesList
              recipes={userRecipes}
              ingredients={data.ingredients}
              measurements={data.measurements}
              onViewRecipe={handleViewRecipe}
              onEditRecipe={handleEditRecipe}
              onDeleteRecipe={handleDeleteRecipe}
              onAddRecipe={handleAddRecipe}
              onCookRecipe={handleStartCooking}
            />
          )}

          {currentView === 'recipe-detail' && selectedRecipe && (
            <RecipeDetail
              recipe={selectedRecipe}
              ingredients={data.ingredients}
              measurements={data.measurements}
              onBack={() => setCurrentView('recipes')}
              onEdit={() => handleEditRecipe(selectedRecipe.id)}
              onCook={() => handleStartCooking(selectedRecipe.id)}
            />
          )}

          {currentView === 'recipe-form' && (
            <RecipeForm
              recipe={editingRecipe}
              ingredients={data.ingredients}
              measurements={data.measurements}
              onSave={handleSaveRecipe}
              onCancel={() => setCurrentView('recipes')}
            />
          )}

          {currentView === 'cook-mode' && selectedRecipe && (
            <CookMode
              recipe={selectedRecipe}
              ingredients={data.ingredients}
              measurements={data.measurements}
              inventory={userInventory}
              session={cookingSession || null}
              onUpdateSession={handleUpdateCookingSession}
              onComplete={handleCompleteCooking}
              onCancel={handleCancelCooking}
              onBack={() => setCurrentView('recipes')}
            />
          )}

          {currentView === 'ingredients' && (
            <IngredientsManager
              ingredients={data.ingredients}
              onAdd={handleAddIngredient}
              onEdit={handleEditIngredient}
              onDelete={handleDeleteIngredient}
            />
          )}

          {currentView === 'measurements' && (
            <MeasurementsManager
              measurements={data.measurements}
              onAdd={handleAddMeasurement}
              onEdit={handleEditMeasurement}
              onDelete={handleDeleteMeasurement}
              onAddConversion={handleAddConversion}
              onRemoveConversion={handleRemoveConversion}
            />
          )}

          {currentView === 'inventory' && (
            <InventoryManager
              inventory={userInventory}
              ingredients={data.ingredients}
              measurements={data.measurements}
              onAdd={handleAddInventoryItem}
              onEdit={handleEditInventoryItem}
              onDelete={handleDeleteInventoryItem}
            />
          )}
        </main>
      </div>
      <Toaster />
    </div>
  );
}