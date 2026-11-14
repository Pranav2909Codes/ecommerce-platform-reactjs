import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import WishlistPage from "./WishlistPage";
import useWishlistStore from "../features/wishlist/hooks/useWishlistStore";
import useCartStore from "../features/cart/hooks/useCartStore";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("WishlistPage", () => {
    let container;
    let root;

    const mockProduct1 = {
        id: 1,
        title: "Wireless Headphones",
        price: 99.99,
        category: "Electronics",
        thumbnail: "https://example.com/headphones.jpg",
    };

    const mockProduct2 = {
        id: 2,
        title: "Leather Backpack",
        price: 49.99,
        category: "Fashion",
        thumbnail: "https://example.com/backpack.jpg",
    };

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);

        useWishlistStore.getState().clearWishlist();
        useCartStore.getState().clearCart();
    });

    afterEach(() => {
        act(() => {
            root.unmount();
        });
        container.remove();
    });

    it("should display empty state when wishlist has no items", async () => {
        await act(async () => {
            root.render(
                <MemoryRouter>
                    <WishlistPage />
                </MemoryRouter>
            );
        });

        expect(container.textContent).toContain("Your wishlist is empty");
        expect(container.textContent).toContain("Browse Products");
    });

    it("should display all saved wishlist items and item count", async () => {
        useWishlistStore.getState().addToWishlist(mockProduct1);
        useWishlistStore.getState().addToWishlist(mockProduct2);

        await act(async () => {
            root.render(
                <MemoryRouter>
                    <WishlistPage />
                </MemoryRouter>
            );
        });

        expect(container.textContent).toContain("2 items saved");
        expect(container.textContent).toContain("Wireless Headphones");
        expect(container.textContent).toContain("Leather Backpack");
        expect(container.textContent).toContain("$99.99");
        expect(container.textContent).toContain("$49.99");
    });

    it("should remove an item when Remove button is clicked", async () => {
        useWishlistStore.getState().addToWishlist(mockProduct1);

        await act(async () => {
            root.render(
                <MemoryRouter>
                    <WishlistPage />
                </MemoryRouter>
            );
        });

        const removeButton = container.querySelector('button[aria-label="Remove from wishlist"]');
        expect(removeButton).toBeTruthy();

        await act(async () => {
            removeButton.click();
        });

        expect(useWishlistStore.getState().items).toHaveLength(0);
        expect(container.textContent).toContain("Your wishlist is empty");
    });

    it("should move item to cart and remove from wishlist when Move to Cart is clicked", async () => {
        useWishlistStore.getState().addToWishlist(mockProduct1);

        await act(async () => {
            root.render(
                <MemoryRouter>
                    <WishlistPage />
                </MemoryRouter>
            );
        });

        const moveButtons = Array.from(container.querySelectorAll("button"));
        const moveButton = moveButtons.find((b) => b.textContent.trim() === "Move to Cart");
        expect(moveButton).toBeTruthy();

        await act(async () => {
            moveButton.click();
        });

        // Wishlist should now be empty
        expect(useWishlistStore.getState().items).toHaveLength(0);
        expect(useWishlistStore.getState().isInWishlist(1)).toBe(false);

        // Cart should have the item
        expect(useCartStore.getState().items).toHaveLength(1);
        expect(useCartStore.getState().items[0].id).toBe(1);
        expect(useCartStore.getState().items[0].quantity).toBe(1);

        // UI updates in real time
        expect(container.textContent).toContain("Your wishlist is empty");
    });
});
