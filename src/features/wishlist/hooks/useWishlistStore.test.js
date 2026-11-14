import { describe, it, expect, beforeEach } from "vitest";
import useWishlistStore from "./useWishlistStore";
import useWishlistStoreFromFeature from "../useWishlistStore";

describe("useWishlistStore", () => {
    const mockProduct1 = {
        id: 1,
        title: "Product 1",
        price: 100,
        category: "Electronics",
        thumbnail: "https://example.com/1.jpg",
    };

    const mockProduct2 = {
        id: 2,
        title: "Product 2",
        price: 50,
        category: "Fashion",
        thumbnail: "https://example.com/2.jpg",
    };

    beforeEach(() => {
        useWishlistStore.getState().clearWishlist();
    });

    it("should export the same store from both hook and feature paths", () => {
        expect(useWishlistStore).toBe(useWishlistStoreFromFeature);
    });

    it("should add a product to the wishlist", () => {
        useWishlistStore.getState().addToWishlist(mockProduct1);
        expect(useWishlistStore.getState().items).toHaveLength(1);
        expect(useWishlistStore.getState().items[0].id).toBe(1);
        expect(useWishlistStore.getState().isInWishlist(1)).toBe(true);
    });

    it("should not duplicate when adding the same product twice", () => {
        useWishlistStore.getState().addToWishlist(mockProduct1);
        useWishlistStore.getState().addToWishlist(mockProduct1);
        expect(useWishlistStore.getState().items).toHaveLength(1);
    });

    it("should remove a product from the wishlist by ID", () => {
        useWishlistStore.getState().addToWishlist(mockProduct1);
        useWishlistStore.getState().addToWishlist(mockProduct2);
        expect(useWishlistStore.getState().items).toHaveLength(2);

        useWishlistStore.getState().removeFromWishlist(1);
        expect(useWishlistStore.getState().items).toHaveLength(1);
        expect(useWishlistStore.getState().items[0].id).toBe(2);
        expect(useWishlistStore.getState().isInWishlist(1)).toBe(false);
        expect(useWishlistStore.getState().isInWishlist(2)).toBe(true);
    });

    it("should handle removing an item that does not exist without error", () => {
        useWishlistStore.getState().addToWishlist(mockProduct1);
        useWishlistStore.getState().removeFromWishlist(999);
        expect(useWishlistStore.getState().items).toHaveLength(1);
    });

    it("should toggle product wishlist status (add if absent, remove if present)", () => {
        expect(useWishlistStore.getState().isInWishlist(1)).toBe(false);

        // First toggle: adds to wishlist
        useWishlistStore.getState().toggleWishlist(mockProduct1);
        expect(useWishlistStore.getState().isInWishlist(1)).toBe(true);
        expect(useWishlistStore.getState().items).toHaveLength(1);

        // Second toggle: removes from wishlist
        useWishlistStore.getState().toggleWishlist(mockProduct1);
        expect(useWishlistStore.getState().isInWishlist(1)).toBe(false);
        expect(useWishlistStore.getState().items).toHaveLength(0);
    });

    it("should return accurate wishlist count", () => {
        expect(useWishlistStore.getState().totalItems).toBe(0);
        expect(useWishlistStore.getState().getTotalItems()).toBe(0);

        useWishlistStore.getState().addToWishlist(mockProduct1);
        useWishlistStore.getState().addToWishlist(mockProduct2);

        expect(useWishlistStore.getState().totalItems).toBe(2);
        expect(useWishlistStore.getState().getTotalItems()).toBe(2);
    });

    it("should clear the wishlist completely", () => {
        useWishlistStore.getState().addToWishlist(mockProduct1);
        useWishlistStore.getState().addToWishlist(mockProduct2);
        expect(useWishlistStore.getState().items).toHaveLength(2);

        useWishlistStore.getState().clearWishlist();
        expect(useWishlistStore.getState().items).toHaveLength(0);
        expect(useWishlistStore.getState().totalItems).toBe(0);
    });
});
