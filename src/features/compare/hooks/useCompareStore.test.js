import { describe, it, expect, beforeEach } from "vitest";
import useCompareStore from "./useCompareStore";
import useCompareStoreFromFeature from "../useCompareStore";

describe("useCompareStore", () => {
    const mockProduct1 = {
        id: 1,
        title: "Product 1",
        price: 100,
        category: "Electronics",
        rating: 4.5,
        stock: 10,
    };

    const mockProduct2 = {
        id: 2,
        title: "Product 2",
        price: 50,
        category: "Fashion",
        rating: 4.8,
        stock: 5,
    };

    const mockProduct3 = {
        id: 3,
        title: "Product 3",
        price: 75,
        category: "Electronics",
        rating: 4.0,
        stock: 20,
    };

    beforeEach(() => {
        useCompareStore.getState().clearCompare();
    });

    it("should export the same store from both hook and feature paths", () => {
        expect(useCompareStore).toBe(useCompareStoreFromFeature);
    });

    it("should add products up to a maximum of 2", () => {
        useCompareStore.getState().addToCompare(mockProduct1);
        expect(useCompareStore.getState().items).toHaveLength(1);
        expect(useCompareStore.getState().isInCompare(1)).toBe(true);

        useCompareStore.getState().addToCompare(mockProduct2);
        expect(useCompareStore.getState().items).toHaveLength(2);
        expect(useCompareStore.getState().isInCompare(2)).toBe(true);

        // Adding a 3rd replaces the second product to maintain 2 products
        useCompareStore.getState().addToCompare(mockProduct3);
        expect(useCompareStore.getState().items).toHaveLength(2);
        expect(useCompareStore.getState().items[0].id).toBe(1);
        expect(useCompareStore.getState().items[1].id).toBe(3);
    });

    it("should not allow duplicate products (cannot compare a product with itself)", () => {
        useCompareStore.getState().addToCompare(mockProduct1);
        useCompareStore.getState().addToCompare(mockProduct1);
        expect(useCompareStore.getState().items).toHaveLength(1);

        useCompareStore.getState().setCompareProducts(mockProduct1, mockProduct1);
        expect(useCompareStore.getState().items).toHaveLength(1);
    });

    it("should remove a product from comparison by ID", () => {
        useCompareStore.getState().addToCompare(mockProduct1);
        useCompareStore.getState().addToCompare(mockProduct2);

        useCompareStore.getState().removeFromCompare(1);
        expect(useCompareStore.getState().items).toHaveLength(1);
        expect(useCompareStore.getState().isInCompare(1)).toBe(false);
        expect(useCompareStore.getState().isInCompare(2)).toBe(true);
    });

    it("should toggle compare status", () => {
        expect(useCompareStore.getState().isInCompare(1)).toBe(false);

        useCompareStore.getState().toggleCompare(mockProduct1);
        expect(useCompareStore.getState().isInCompare(1)).toBe(true);

        useCompareStore.getState().toggleCompare(mockProduct1);
        expect(useCompareStore.getState().isInCompare(1)).toBe(false);
    });

    it("should swap Product A and Product B", () => {
        useCompareStore.getState().addToCompare(mockProduct1);
        useCompareStore.getState().addToCompare(mockProduct2);

        expect(useCompareStore.getState().items[0].id).toBe(1);
        expect(useCompareStore.getState().items[1].id).toBe(2);

        useCompareStore.getState().swapProducts();

        expect(useCompareStore.getState().items[0].id).toBe(2);
        expect(useCompareStore.getState().items[1].id).toBe(1);
    });

    it("should clear comparison items", () => {
        useCompareStore.getState().addToCompare(mockProduct1);
        useCompareStore.getState().addToCompare(mockProduct2);
        expect(useCompareStore.getState().items).toHaveLength(2);

        useCompareStore.getState().clearCompare();
        expect(useCompareStore.getState().items).toHaveLength(0);
        expect(useCompareStore.getState().totalItems).toBe(0);
    });
});
