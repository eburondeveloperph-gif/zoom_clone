// Success Class - UI Store
// Manages which panels are open, bottom sheet state, device orientation

export type PanelType = 'members' | 'transcript' | 'settings' | 'language' | null;
export type BottomSheetContent = 'members' | 'settings' | 'language' | null;

export interface UIState {
  isTablet: boolean;
  isLandscape: boolean;
  activePanel: PanelType;
  bottomSheetOpen: boolean;
  bottomSheetContent: BottomSheetContent;
  toastMessage: string | null;
  toastType: 'info' | 'success' | 'error';
  teacherVideoHeight: number; // For positioning bottom sheet
}

// Default state
const defaultState: UIState = {
  isTablet: false,
  isLandscape: false,
  activePanel: null,
  bottomSheetOpen: false,
  bottomSheetContent: null,
  toastMessage: null,
  toastType: 'info',
  teacherVideoHeight: 0,
};

// Singleton store
let state: UIState = { ...defaultState };
let listeners: Set<() => void> = new Set();

// Notify all listeners
function notify(): void {
  listeners.forEach((listener) => listener());
}

// Initialize device detection
export function initUIState(): void {
  if (typeof window === 'undefined') return;
  
  const updateDeviceClass = () => {
    state.isTablet = window.matchMedia('(min-width: 768px)').matches;
    state.isLandscape = window.matchMedia('(orientation: landscape)').matches;
    notify();
  };
  
  updateDeviceClass();
  
  // Listen for changes
  window.matchMedia('(min-width: 768px)').addEventListener('change', updateDeviceClass);
  window.matchMedia('(orientation: landscape)').addEventListener('change', updateDeviceClass);
}

// Set active panel
export function setActivePanel(panel: PanelType): void {
  // On mobile, certain panels open in bottom sheet
  if (!state.isTablet && (panel === 'members' || panel === 'settings' || panel === 'language')) {
    state.bottomSheetContent = panel as BottomSheetContent;
    state.bottomSheetOpen = true;
    state.activePanel = null;
  } else {
    state.activePanel = panel;
    state.bottomSheetOpen = false;
    state.bottomSheetContent = null;
  }
  notify();
}

// Toggle panel
export function togglePanel(panel: PanelType): void {
  if (state.activePanel === panel) {
    setActivePanel(null);
  } else {
    setActivePanel(panel);
  }
}

// Close bottom sheet
export function closeBottomSheet(): void {
  state.bottomSheetOpen = false;
  state.bottomSheetContent = null;
  notify();
}

// Open bottom sheet with specific content
export function openBottomSheet(content: BottomSheetContent): void {
  state.bottomSheetContent = content;
  state.bottomSheetOpen = true;
  notify();
}

// Set teacher video height (for bottom sheet positioning)
export function setTeacherVideoHeight(height: number): void {
  state.teacherVideoHeight = height;
  notify();
}

// Show toast notification
export function showToast(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
  state.toastMessage = message;
  state.toastType = type;
  notify();
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    if (state.toastMessage === message) {
      state.toastMessage = null;
      notify();
    }
  }, 3000);
}

// Clear toast
export function clearToast(): void {
  state.toastMessage = null;
  notify();
}

// Subscribe to state changes
export function subscribeUI(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Get current state
export function getUIState(): UIState {
  return { ...state };
}
