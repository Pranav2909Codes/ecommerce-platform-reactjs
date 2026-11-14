import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import ProductsPage from "./ProductsPage";
import * as productService from "../services/productService";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("../services/productService", () => ({
    getCategories: vi.fn(),
    filterProducts: vi.fn(),
}));

describe("ProductsPage", () => {
    let container;
    let root;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);

        productService.getCategories.mockResolvedValue(["Electronics", "Fashion"]);
        productService.filterProducts.mockResolvedValue({
            data: [
                {
                    id: 1,
                    title: "Test Headphones",
                    category: "Electronics",
                    price: 199.99,
                    rating: 4.5,
                    stock: 5,
                    thumbnail: "https://example.com/item.jpg",
                },
            ],
            total: 1,
            page: 1,
            totalPages: 1,
            limit: 8,
        });
    });

    afterEach(() => {
        act(() => {
            root.unmount();
        });
        container.remove();
        vi.clearAllMocks();
    });

    it("should call filterProducts with default parameters and render products", async () => {
        await act(async () => {
            root.render(
                <MemoryRouter>
                    <ProductsPage />
                </MemoryRouter>
            );
        });

        // Wait for promises in useEffect
        await act(async () => {
            await Promise.resolve();
        });

        expect(productService.getCategories).toHaveBeenCalled();
        expect(productService.filterProducts).toHaveBeenCalledWith(
            expect.objectContaining({
                search: "",
                selectedCategory: "",
                sortBy: "title",
                sortOrder: "asc",
                currentPage: 1,
                productsPerPage: 8,
            })
        );

        expect(container.textContent).toContain("Test Headphones");
        expect(container.textContent).toContain("Browse our collection of 1 premium products");
    });

    it("should filter by search term and reset page to 1", async () => {
        await act(async () => {
            root.render(
                <MemoryRouter>
                    <ProductsPage />
                </MemoryRouter>
            );
        });

        const searchInput = container.querySelector('input[placeholder*="Search products"]');
        expect(searchInput).toBeTruthy();

        await act(async () => {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value"
            ).set;
            nativeInputValueSetter.call(searchInput, "Headphones");
            searchInput.dispatchEvent(new Event("input", { bubbles: true }));
            searchInput.dispatchEvent(new Event("change", { bubbles: true }));
        });

        expect(productService.filterProducts).toHaveBeenLastCalledWith(
            expect.objectContaining({
                search: "Headphones",
                currentPage: 1,
            })
        );
    });

    it("should filter by category and reset page to 1", async () => {
        await act(async () => {
            root.render(
                <MemoryRouter>
                    <ProductsPage />
                </MemoryRouter>
            );
        });

        const categorySelect = container.querySelectorAll("select")[0];
        expect(categorySelect).toBeTruthy();

        await act(async () => {
            categorySelect.value = "Fashion";
            categorySelect.dispatchEvent(new Event("change", { bubbles: true }));
        });

        expect(productService.filterProducts).toHaveBeenLastCalledWith(
            expect.objectContaining({
                selectedCategory: "Fashion",
                currentPage: 1,
            })
        );
    });

    it("should reorder when sort changes", async () => {
        await act(async () => {
            root.render(
                <MemoryRouter>
                    <ProductsPage />
                </MemoryRouter>
            );
        });

        const sortSelect = container.querySelectorAll("select")[1];
        expect(sortSelect).toBeTruthy();

        await act(async () => {
            sortSelect.value = "price-desc";
            sortSelect.dispatchEvent(new Event("change", { bubbles: true }));
        });

        expect(productService.filterProducts).toHaveBeenLastCalledWith(
            expect.objectContaining({
                sortBy: "price",
                sortOrder: "desc",
                currentPage: 1,
            })
        );
    });

    it("should show empty state when zero products match and hide pagination", async () => {
        productService.filterProducts.mockResolvedValueOnce({
            data: [],
            total: 0,
            page: 1,
            totalPages: 0,
            limit: 8,
        });

        await act(async () => {
            root.render(
                <MemoryRouter>
                    <ProductsPage />
                </MemoryRouter>
            );
        });

        await act(async () => {
            await Promise.resolve();
        });

        expect(container.textContent).toContain("No products found");
        expect(container.querySelector("button:has-text('Previous')")).toBeNull();
    });

    it("should show pagination when totalPages > 1 and change page on button click", async () => {
        productService.filterProducts.mockResolvedValue({
            data: [
                {
                    id: 1,
                    title: "Item 1",
                    category: "Electronics",
                    price: 10,
                    rating: 5,
                    stock: 5,
                    thumbnail: "",
                },
            ],
            total: 16,
            page: 1,
            totalPages: 2,
            limit: 8,
        });

        await act(async () => {
            root.render(
                <MemoryRouter>
                    <ProductsPage />
                </MemoryRouter>
            );
        });

        await act(async () => {
            await Promise.resolve();
        });

        const buttons = Array.from(container.querySelectorAll("button"));
        const page2Button = buttons.find((b) => b.textContent.trim() === "2");
        expect(page2Button).toBeTruthy();

        await act(async () => {
            page2Button.click();
        });

        expect(productService.filterProducts).toHaveBeenLastCalledWith(
            expect.objectContaining({
                currentPage: 2,
            })
        );
    });

    it("should filter by price range and reset on reset button click", async () => {
        await act(async () => {
            root.render(
                <MemoryRouter>
                    <ProductsPage />
                </MemoryRouter>
            );
        });

        const minInput = container.querySelector('input[placeholder="Min"]');
        const maxInput = container.querySelector('input[placeholder="Max"]');
        expect(minInput).toBeTruthy();
        expect(maxInput).toBeTruthy();

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
        ).set;

        await act(async () => {
            nativeInputValueSetter.call(minInput, "50");
            minInput.dispatchEvent(new Event("input", { bubbles: true }));
            minInput.dispatchEvent(new Event("change", { bubbles: true }));

            nativeInputValueSetter.call(maxInput, "200");
            maxInput.dispatchEvent(new Event("input", { bubbles: true }));
            maxInput.dispatchEvent(new Event("change", { bubbles: true }));
        });

        expect(productService.filterProducts).toHaveBeenLastCalledWith(
            expect.objectContaining({
                minPrice: 50,
                maxPrice: 200,
                currentPage: 1,
            })
        );

        // Reset button should now be visible
        const resetButton = Array.from(container.querySelectorAll("button")).find(
            (b) => b.textContent.trim() === "Reset"
        );
        expect(resetButton).toBeTruthy();

        await act(async () => {
            resetButton.click();
        });

        expect(productService.filterProducts).toHaveBeenLastCalledWith(
            expect.objectContaining({
                search: "",
                selectedCategory: "",
                minPrice: 0,
                maxPrice: Infinity,
                sortBy: "title",
                sortOrder: "asc",
                currentPage: 1,
            })
        );
    });
});
