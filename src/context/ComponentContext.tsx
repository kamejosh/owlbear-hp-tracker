import { create } from "zustand";

export type ComponentContextType = {
    component: string | undefined;
    setComponent: (component: string | undefined) => void;
};

export const useComponentContext = create<ComponentContextType>()((set) => ({
    component: undefined,
    setComponent: (component) => set(() => ({ component: component })),
}));
