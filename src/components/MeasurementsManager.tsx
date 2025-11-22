import { useState } from 'react';
import { Measurement, MeasurementConversion } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Plus, Search, Edit, Trash2, Save, X } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';

/**
 * @interface MeasurementsManagerProps
 * @description Defines the props required for the MeasurementsManager component, including
 * all CRUD operations for both measurements and their nested unit conversions.
 */
interface MeasurementsManagerProps {
  /** The full list of measurement unit objects, including conversion definitions. */
  measurements: Measurement[];
  /** Callback to add a new measurement unit by name. */
  onAdd: (name: string) => void;
  /** Callback to edit an existing measurement unit's name. */
  onEdit: (id: string, name: string) => void;
  /** Callback to delete a measurement unit by ID. */
  onDelete: (id: string) => void;
  /** * @function onAddConversion 
   * @description Adds a new conversion rate between two units. 
   * @param {string} fromId - The source measurement ID.
   * @param {string} toId - The target measurement ID.
   * @param {number} factor - The multiplier (1 [from] = [factor] [to]).
   */
  onAddConversion: (fromId: string, toId: string, factor: number) => void;
  /** * @function onRemoveConversion 
   * @description Removes an existing conversion rate. 
   * @param {string} fromId - The source measurement ID.
   * @param {string} toId - The target measurement ID.
   */
  onRemoveConversion: (fromId: string, toId: string) => void;
}

/**
 * @component
 * @name MeasurementsManager
 * @description Manages measurement units and the complex, nested logic for defining
 * conversion factors between compatible units (e.g., liters to gallons).
 * @param {MeasurementsManagerProps} props - The component properties.
 * @returns {JSX.Element} The measurement unit management UI.
 */
export function MeasurementsManager({
  measurements,
  onAdd,
  onEdit,
  onDelete,
  onAddConversion,
  onRemoveConversion,
}: MeasurementsManagerProps) {
  // State for filtering the unit list
  const [searchQuery, setSearchQuery] = useState('');
  // State for the "Add New Measurement" input
  const [newMeasurementName, setNewMeasurementName] = useState('');
  // State to track which unit is currently being edited (name)
  const [editingId, setEditingId] = useState<string | null>(null);
  // State for the content of the inline edit input
  const [editName, setEditName] = useState('');
  // State to track the ID of the unit pending deletion (opens AlertDialog)
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // State to track which measurement unit's conversion panel is currently open
  const [showConversionFor, setShowConversionFor] = useState<string | null>(null);
  // State for the target unit ID when adding a new conversion
  const [conversionToId, setConversionToId] = useState('');
  // State for the numerical factor when adding a new conversion
  const [conversionFactor, setConversionFactor] = useState('');

  /**
   * @constant filteredMeasurements
   * @description Filters the main measurement list based on the search query (case-insensitive).
   */
  const filteredMeasurements = measurements.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * @function handleAdd
   * @description Handles the addition of a new measurement unit.
   * Performs input validation, calls the parent callback, resets the input, and shows a toast.
   * @returns {void}
   */
  const handleAdd = () => {
    if (!newMeasurementName.trim()) {
      toast.error('Please enter a measurement name');
      return;
    }
    onAdd(newMeasurementName.trim());
    setNewMeasurementName('');
    toast.success('Measurement added');
  };

  /**
   * @function handleEdit
   * @description Handles the submission of an inline edit for a measurement unit name.
   * Performs validation, calls the parent callback, and resets the editing state.
   * @param {string} id - The ID of the measurement being edited.
   * @returns {void}
   */
  const handleEdit = (id: string) => {
    if (!editName.trim()) {
      toast.error('Please enter a measurement name');
      return;
    }
    onEdit(id, editName.trim());
    setEditingId(null);
    setEditName('');
    toast.success('Measurement updated');
  };

  /**
   * @function startEdit
   * @description Sets the component state to enable inline editing for a specific unit.
   * @param {Measurement} measurement - The unit object to begin editing.
   * @returns {void}
   */
  const startEdit = (measurement: Measurement) => {
    setEditingId(measurement.id);
    setEditName(measurement.name);
  };

  /**
   * @function cancelEdit
   * @description Clears the editing state, cancelling the current inline edit operation.
   * @returns {void}
   */
  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  /**
   * @function handleAddConversion
   * @description Handles the submission of a new conversion factor for the currently selected unit.
   * Requires validation for target unit selection and a positive numeric factor.
   * @param {string} fromId - The ID of the source measurement unit.
   * @returns {void}
   */
  const handleAddConversion = (fromId: string) => {
    if (!conversionToId) {
      toast.error('Please select a target measurement');
      return;
    }
    const factor = parseFloat(conversionFactor);
    if (isNaN(factor) || factor <= 0) {
      toast.error('Please enter a valid conversion factor');
      return;
    }
    // Call the parent function to persist the new conversion
    onAddConversion(fromId, conversionToId, factor);
    
    // Reset conversion form states
    setConversionToId('');
    setConversionFactor('');
    toast.success('Conversion added');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Measurements Manager</h2>
        <p className="text-muted-foreground">Manage units and conversions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Measurement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Measurement name (e.g., kilogram)..."
                value={newMeasurementName}
                onChange={(e) => setNewMeasurementName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Measurements ({measurements.length})</CardTitle>
          <CardDescription>Search and manage your measurement units</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search measurements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredMeasurements.map((measurement) => (
              <div key={measurement.id} className="border rounded-lg">
                <div className="flex items-center gap-2 p-3 hover:bg-accent transition-colors">
                  {editingId === measurement.id ? (
                    // Inline edit view for unit name
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEdit(measurement.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                      <Button size="sm" onClick={() => handleEdit(measurement.id)}>
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    // Default view with action buttons
                    <>
                      <span className="flex-1">{measurement.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          // Toggle the conversion panel open/closed
                          setShowConversionFor(
                            showConversionFor === measurement.id ? null : measurement.id
                          )
                        }
                      >
                        Conversions ({measurement.conversions.length})
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(measurement)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(measurement.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Conversion Management Panel */}
                {showConversionFor === measurement.id && (
                  <div className="p-3 bg-accent/50 border-t space-y-3">
                    <div className="space-y-2">
                      <Label>Existing Conversions</Label>
                      {measurement.conversions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No conversions defined</p>
                      ) : (
                        <div className="space-y-1">
                          {measurement.conversions.map((conv) => {
                            const toMeasurement = measurements.find((m) => m.id === conv.toMeasurementId);
                            return (
                              <div
                                key={conv.toMeasurementId}
                                className="flex items-center justify-between p-2 bg-background rounded text-sm"
                              >
                                <span>
                                  {/* Displays the conversion ratio: 1 [from unit] = [factor] [to unit] */}
                                  1 {measurement.name} = {conv.factor} {toMeasurement?.name}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    onRemoveConversion(measurement.id, conv.toMeasurementId)
                                  }
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Add Conversion</Label>
                      <div className="flex gap-2">
                        {/* Target Measurement Selector */}
                        <Select value={conversionToId} onValueChange={setConversionToId}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="To measurement..." />
                          </SelectTrigger>
                          <SelectContent>
                            {measurements
                              // Prevent selecting the unit itself as a target conversion
                              .filter((m) => m.id !== measurement.id)
                              .map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {/* Conversion Factor Input */}
                        <Input
                          type="number"
                          placeholder="Factor"
                          value={conversionFactor}
                          onChange={(e) => setConversionFactor(e.target.value)}
                          className="w-24"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddConversion(measurement.id)}
                        >
                          Add
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Example: 1 {measurement.name} = [factor] [to measurement]
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filteredMeasurements.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? 'No measurements found' : 'No measurements yet'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Deletion */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Measurement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this measurement unit. Recipes using this unit may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                  toast.success('Measurement deleted');
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