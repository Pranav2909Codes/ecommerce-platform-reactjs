import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import ProductCard from "./ProductCard";
import useWishlistStore from "../../wishlist/hooks/useWishlistStore";
import useCartStore from "../../cart/hooks/useCartStore";
import useCompareStore from "../../compare/hooks/useCompareStore";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("ProductCard Wishlist and Compare Toggles", () => {
    let container;
    let root;

    const mockProduct = {
        id: 10,
        title: "Test Watch",
        price: 199.99,
        category: "Electronics",
        rating: 4.8,
        stock: 5,
        thumbnail: "https://example.com/watch.jpg",
    };

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);

        useWishlistStore.getState().clearWishlist();
        useCartStore.getState().clearCart();
        useCompareStore.getState().clearCompare();
    });

    afterEach(() => {
        act(() => {
            root.unmount();
        });
        container.remove();
    });

    it("should toggle wishlist state on heart icon click", async () => {
        await act(async () => {
            root.render(
                <MemoryRouter>
                    <ProductCard product={mockProduct} />
                </MemoryRouter>
            );
        });

        const heartButton = container.querySelector('button[aria-label*="wishlist"]');
        expect(heartButton).toBeTruthy();
        expect(heartButton.getAttribute("aria-label")).toBe("Add to wishlist");
        expect(useWishlistStore.getState().isInWishlist(10)).toBe(false);

        // Click to add
        await act(async () => {
            heartButton.click();
        });

        expect(useWishlistStore.getState().isInWishlist(10)).toBe(true);
        expect(heartButton.getAttribute("aria-label")).toBe("Remove from wishlist");

        // Click again to remove
        await act(async () => {
            heartButton.click();
        });

        expect(useWishlistStore.getState().isInWishlist(10)).toBe(false);
        expect(heartButton.getAttribute("aria-label")).toBe("Add to wishlist");
    });

    it("should toggle compare state when Add to Compare button is clicked", async () => {
        await act(async () => {
            root.render(
                <MemoryRouter>
                    <ProductCard product={mockProduct} />
                </MemoryRouter>
            );
        });

        const compareButton = container.querySelector('button[aria-label*="compare"]');
        expect(compareButton).toBeTruthy();
        expect(compareButton.getAttribute("aria-label")).toBe("Add to compare");
        expect(useCompareStore.getState().isInCompare(10)).toBe(false);

        // Click to add to compare
        await act(async () => {
            compareButton.click();
        });

        expect(useCompareStore.getState().isInCompare(10)).toBe(true);
        expect(compareButton.getAttribute("aria-label")).toBe("Remove from comparison");
        expect(container.textContent).toContain("Comparing");

        // Click again to remove from compare
        await act(async () => {
            compareButton.click();
        });

        expect(useCompareStore.getState().isInCompare(10)).toBe(false);
        expect(compareButton.getAttribute("aria-label")).toBe("Add to compare");
    });
});
