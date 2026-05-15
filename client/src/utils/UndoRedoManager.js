// Undo/Redo Manager for attendance changes

class UndoRedoManager {
  constructor(maxHistory = 50) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = maxHistory;
  }

  // Execute action and add to history
  executeAction(action, value) {
    // Clear redo stack when new action is performed
    this.redoStack = [];

    // Add to undo stack
    this.undoStack.push({
      action,
      value,
      timestamp: new Date(),
    });

    // Limit history size
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }

    return true;
  }

  // Undo last action
  undo() {
    if (this.undoStack.length === 0) return null;

    const lastAction = this.undoStack.pop();
    this.redoStack.push(lastAction);

    return lastAction;
  }

  // Redo last undone action
  redo() {
    if (this.redoStack.length === 0) return null;

    const redoneAction = this.redoStack.pop();
    this.undoStack.push(redoneAction);

    return redoneAction;
  }

  // Check if undo is available
  canUndo() {
    return this.undoStack.length > 0;
  }

  // Check if redo is available
  canRedo() {
    return this.redoStack.length > 0;
  }

  // Clear all history
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }

  // Get undo stack
  getUndoStack() {
    return [...this.undoStack];
  }

  // Get redo stack
  getRedoStack() {
    return [...this.redoStack];
  }

  // Get history size
  getHistorySize() {
    return this.undoStack.length + this.redoStack.length;
  }
}

// Export singleton instance
export const undoRedoManager = new UndoRedoManager();

export default UndoRedoManager;
