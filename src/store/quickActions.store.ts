import { create } from 'zustand';

interface QuickActionsState {
  addCustomerOpen: boolean;
  addVehicleOpen: boolean;
  setAddCustomerOpen: (open: boolean) => void;
  setAddVehicleOpen: (open: boolean) => void;
}

export const useQuickActionsStore = create<QuickActionsState>((set) => ({
  addCustomerOpen: false,
  addVehicleOpen: false,
  setAddCustomerOpen: (open) => set({ addCustomerOpen: open }),
  setAddVehicleOpen: (open) => set({ addVehicleOpen: open }),
}));
