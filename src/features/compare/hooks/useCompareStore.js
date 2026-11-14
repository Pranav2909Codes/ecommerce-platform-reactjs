import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const safeStorage = {
    getItem: (name) => {
        try {
            if (typeof window !== "undefined" && window.localStorage) {
                return window.localStorage.getItem(name);
            }
        } catch {
            // Ignore in environments where localStorage is unavailable
        }
        return null;
    },
    setItem: (name, value) => {
        try {
            if (typeof window !== "undefined" && window.localStorage) {
                window.localStorage.setItem(name, value);
            }
        } catch {
            // Ignore in environments where localStorage is unavailable
        }
    },
    removeItem: (name) => {
        try {
            if (typeof window !== "undefined" && window.localStorage) {
                window.localStorage.removeItem(name);
            }
        } catch {
            // Ignore in environments where localStorage is unavailable
        }
    },
};

const useCompareStore = create(
    persist(
        (set, get) => ({
            items: [],
            totalItems: 0,

            addToCompare: (product) => {
                const items = get().items;
                // Cannot compare product with itself / duplicate check
                if (items.some((item) => item.id === product.id)) return;

                let nextItems;
                if (items.length >= 2) {
                    // Limit compare to 2 products: replace the second product
                    nextItems = [items[0], product];
                } else {
                    nextItems = [...items, product];
                }
                set({ items: nextItems, totalItems: nextItems.length });
            },

            removeFromCompare: (productId) => {
                const numericId = Number(productId);
                const nextItems = get().items.filter(
                    (item) => item.id !== numericId
                );
                set({ items: nextItems, totalItems: nextItems.length });
            },

            toggleCompare: (product) => {
                const isIn = get().isInCompare(product.id);
                if (isIn) {
                    get().removeFromCompare(product.id);
                } else {
                    get().addToCompare(product);
                }
            },

            setCompareProducts: (productA, productB) => {
                const list = [productA, productB].filter(Boolean);
                if (list.length === 2 && list[0].id === list[1].id) {
                    set({ items: [list[0]], totalItems: 1 });
                    return;
                }
                set({ items: list, totalItems: list.length });
            },

            setProductA: (product) => {
                const items = get().items;
                if (!product) {
                    const nextItems = items.length > 1 ? [items[1]] : [];
                    set({ items: nextItems, totalItems: nextItems.length });
                    return;
                }
                const productB =
                    items[1] && items[1].id !== product.id
                        ? items[1]
                        : items[0] && items[0].id !== product.id
                            ? items[0]
                            : null;
                const nextItems = productB ? [product, productB] : [product];
                set({ items: nextItems, totalItems: nextItems.length });
            },

            setProductB: (product) => {
                const items = get().items;
                const productA = items[0] || null;
                if (!product) {
                    const nextItems = productA ? [productA] : [];
                    set({ items: nextItems, totalItems: nextItems.length });
                    return;
                }
                if (productA && productA.id === product.id) return;
                const nextItems = productA ? [productA, product] : [product];
                set({ items: nextItems, totalItems: nextItems.length });
            },

            swapProducts: () => {
                const items = get().items;
                if (items.length === 2) {
                    set({ items: [items[1], items[0]] });
                }
            },

            isInCompare: (productId) => {
                const numericId = Number(productId);
                return get().items.some((item) => item.id === numericId);
            },

            clearCompare: () => set({ items: [], totalItems: 0 }),

            getTotalItems: () => get().items.length,
        }),
        {
            name: "compare-storage",
            storage: createJSONStorage(() => safeStorage),
        }
    )
);

export default useCompareStore;
