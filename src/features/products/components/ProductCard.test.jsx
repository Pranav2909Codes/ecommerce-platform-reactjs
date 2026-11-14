import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import ProductCard from "./ProductCard";
import useWishlistStore from "../../wishlist/hooks/useWishlistStore";
import useCartStore from "../../cart/hooks/useCartStore";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("ProductCard Wishlist Toggle", () => {
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
});
