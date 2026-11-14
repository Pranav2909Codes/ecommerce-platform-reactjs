import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import ComparePage from "./ComparePage";
import useCompareStore from "../features/compare/hooks/useCompareStore";
import useCartStore from "../features/cart/hooks/useCartStore";
import * as productService from "../features/products/services/productService";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("../features/products/services/productService", () => ({
    getProducts: vi.fn(),
}));

describe("ComparePage", () => {
    let container;
    let root;

    const mockProducts = [
        {
            id: 1,
            title: "Noise Cancelling Headphones",
            price: 199.99,
            category: "Electronics",
            rating: 4.8,
            stock: 20,
            description: "High quality audio headphones with active noise cancellation.",
            thumbnail: "https://example.com/headphones.jpg",
        },
        {
            id: 2,
            title: "Basic Headphones",
            price: 49.99, // Lower price than 1
            category: "Electronics",
            rating: 4.2, // Lower rating than 1
            stock: 10, // Lower stock than 1
            description: "Affordable over-ear audio headphones.",
            thumbnail: "https://example.com/basic.jpg",
        },
        {
            id: 3,
            title: "Leather Jacket",
            price: 199.99, // Equal price to 1
            category: "Fashion", // Different category
            rating: 4.8, // Equal rating to 1
            stock: 5,
            description: "Classic black leather jacket.",
            thumbnail: "https://example.com/jacket.jpg",
        },
    ];

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);

        useCompareStore.getState().clearCompare();
        useCartStore.getState().clearCart();
        productService.getProducts.mockResolvedValue(mockProducts);
    });

    afterEach(() => {
        act(() => {
            root.unmount();
        });
        container.remove();
        vi.clearAllMocks();
    });

    it("should show empty placeholder when no products are selected", async () => {
        await act(async () => {
            root.render(
                <MemoryRouter>
                    <ComparePage />
                </MemoryRouter>
            );
        });

        await act(async () => {
            await Promise.resolve();
        });

        expect(container.textContent).toContain("Select Products to Compare");
    });

    it("should select two products from dropdowns and disable selecting the same product in both", async () => {
        await act(async () => {
            root.render(
                <MemoryRouter>
                    <ComparePage />
                </MemoryRouter>
            );
        });

        await act(async () => {
            await Promise.resolve();
        });

        const selectA = container.querySelectorAll("select")[0];
        const selectB = container.querySelectorAll("select")[1];

        // Select Product 1 in Dropdown A
        await act(async () => {
            selectA.value = "1";
            selectA.dispatchEvent(new Event("change", { bubbles: true }));
        });

        expect(useCompareStore.getState().items[0].id).toBe(1);

        // In select B, Product 1 should be disabled
        const option1InB = Array.from(selectB.options).find((opt) => opt.value === "1");
        expect(option1InB.disabled).toBe(true);

        // Select Product 2 in Dropdown B
        await act(async () => {
            selectB.value = "2";
            selectB.dispatchEvent(new Event("change", { bubbles: true }));
        });

        expect(useCompareStore.getState().items[1].id).toBe(2);

        // In select A, Product 2 should be disabled
        const option2InA = Array.from(selectA.options).find((opt) => opt.value === "2");
        expect(option2InA.disabled).toBe(true);

        expect(container.textContent).toContain("Noise Cancelling Headphones");
        expect(container.textContent).toContain("Basic Headphones");
    });

    it("should highlight the better value in green for price, rating, and stock", async () => {
        useCompareStore.getState().setCompareProducts(mockProducts[0], mockProducts[1]);

        await act(async () => {
            root.render(
                <MemoryRouter>
                    <ComparePage />
                </MemoryRouter>
            );
        });

        await act(async () => {
            await Promise.resolve();
        });

        // Product 2 has lower price ($49.99 vs $199.99) -> Product 2 should get Lower Price badge
        expect(container.textContent).toContain("Lower Price");

        // Product 1 has higher rating (4.8 vs 4.2) -> Product 1 should get Higher Rating badge
        expect(container.textContent).toContain("Higher Rating");

        // Product 1 has more stock (20 vs 10) -> Product 1 should get More Stock badge
        expect(container.textContent).toContain("More Stock");
    });

    it("should display Equal indicator without false positive highlight for identical values", async () => {
        // Product 1 and Product 3 have identical price ($199.99) and identical rating (4.8)
        useCompareStore.getState().setCompareProducts(mockProducts[0], mockProducts[2]);

        await act(async () => {
            root.render(
                <MemoryRouter>
                    <ComparePage />
                </MemoryRouter>
            );
        });

        await act(async () => {
            await Promise.resolve();
        });

        expect(container.textContent).toContain("Equal");
    });

    it("should notify about cross-category comparison", async () => {
        // Product 1 (Electronics) and Product 3 (Fashion)
        useCompareStore.getState().setCompareProducts(mockProducts[0], mockProducts[2]);

        await act(async () => {
            root.render(
                <MemoryRouter>
                    <ComparePage />
                </MemoryRouter>
            );
        });

        await act(async () => {
            await Promise.resolve();
        });

        expect(container.textContent).toContain("Cross-category comparison");
    });

    it("should swap products when Swap button is clicked", async () => {
        useCompareStore.getState().setCompareProducts(mockProducts[0], mockProducts[1]);

        await act(async () => {
            root.render(
                <MemoryRouter>
                    <ComparePage />
                </MemoryRouter>
            );
        });

        await act(async () => {
            await Promise.resolve();
        });

        const swapButton = Array.from(container.querySelectorAll("button")).find(
            (b) => b.textContent.includes("Swap")
        );
        expect(swapButton).toBeTruthy();

        await act(async () => {
            swapButton.click();
        });

        expect(useCompareStore.getState().items[0].id).toBe(2);
        expect(useCompareStore.getState().items[1].id).toBe(1);
    });

    it("should clear comparison when Clear All button is clicked", async () => {
        useCompareStore.getState().setCompareProducts(mockProducts[0], mockProducts[1]);

        await act(async () => {
            root.render(
                <MemoryRouter>
                    <ComparePage />
                </MemoryRouter>
            );
        });

        await act(async () => {
            await Promise.resolve();
        });

        const clearButton = Array.from(container.querySelectorAll("button")).find(
            (b) => b.textContent.includes("Clear All")
        );
        expect(clearButton).toBeTruthy();

        await act(async () => {
            clearButton.click();
        });

        expect(useCompareStore.getState().items).toHaveLength(0);
        expect(container.textContent).toContain("Select Products to Compare");
    });
});
