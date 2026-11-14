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

const useWishlistStore = create(
    persist(
        (set, get) => ({
            items: [],
            totalItems: 0,

            addToWishlist: (product) => {
                const items = get().items;
                const exists = items.some((item) => item.id === product.id);
                if (exists) return;
                const nextItems = [...items, product];
                set({ items: nextItems, totalItems: nextItems.length });
            },

            removeFromWishlist: (productId) => {
                const numericId = Number(productId);
                const nextItems = get().items.filter(
                    (item) => item.id !== numericId
                );
                set({ items: nextItems, totalItems: nextItems.length });
            },

            toggleWishlist: (product) => {
                const isIn = get().isInWishlist(product.id);
                if (isIn) {
                    get().removeFromWishlist(product.id);
                } else {
                    get().addToWishlist(product);
                }
            },

            isInWishlist: (productId) => {
                const numericId = Number(productId);
                return get().items.some((item) => item.id === numericId);
            },

            clearWishlist: () => set({ items: [], totalItems: 0 }),

            getTotalItems: () => get().items.length,
        }),
        {
            name: "wishlist-storage",
            storage: createJSONStorage(() => safeStorage),
        }
    )
);

export default useWishlistStore;
