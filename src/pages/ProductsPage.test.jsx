import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import ProductsPage from "./ProductsPage";
import * as productService from "../services/productService";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("../services/productService", () => ({
    getCategories: vi.fn(),
    filterProducts: vi.fn(),
}));

function LocationDisplay() {
    const location = useLocation();
    return <span data-testid="location">{location.pathname + location.search}</span>;
}

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

    describe("URL Query Parameters (Task 2)", () => {
        it("should read initial state from URL parameters on page load", async () => {
            await act(async () => {
                root.render(
                    <MemoryRouter
                        initialEntries={[
                            "/products?category=Electronics&sortBy=price&sortOrder=asc&page=2",
                        ]}
                    >
                        <ProductsPage />
                    </MemoryRouter>
                );
            });

            await act(async () => {
                await Promise.resolve();
            });

            expect(productService.filterProducts).toHaveBeenCalledWith(
                expect.objectContaining({
                    selectedCategory: "Electronics",
                    sortBy: "price",
                    sortOrder: "asc",
                    currentPage: 2,
                })
            );

            const categorySelect = container.querySelectorAll("select")[0];
            const sortSelect = container.querySelectorAll("select")[1];
            expect(categorySelect.value).toBe("Electronics");
            expect(sortSelect.value).toBe("price-asc");
        });

        it("should reflect filter and sort changes in the URL query parameters in real time", async () => {
            await act(async () => {
                root.render(
                    <MemoryRouter initialEntries={["/products"]}>
                        <LocationDisplay />
                        <ProductsPage />
                    </MemoryRouter>
                );
            });

            const locationEl = container.querySelector('[data-testid="location"]');
            expect(locationEl.textContent).toBe("/products");

            // Change category
            const categorySelect = container.querySelectorAll("select")[0];
            await act(async () => {
                categorySelect.value = "Fashion";
                categorySelect.dispatchEvent(new Event("change", { bubbles: true }));
            });

            expect(locationEl.textContent).toContain("category=Fashion");

            // Change sort
            const sortSelect = container.querySelectorAll("select")[1];
            await act(async () => {
                sortSelect.value = "price-asc";
                sortSelect.dispatchEvent(new Event("change", { bubbles: true }));
            });

            expect(locationEl.textContent).toContain("category=Fashion");
            expect(locationEl.textContent).toContain("sortBy=price");
            expect(locationEl.textContent).toContain("sortOrder=asc");
        });

        it("should omit empty and default values from URL (clean URLs)", async () => {
            await act(async () => {
                root.render(
                    <MemoryRouter initialEntries={["/products?category=Fashion"]}>
                        <LocationDisplay />
                        <ProductsPage />
                    </MemoryRouter>
                );
            });

            const locationEl = container.querySelector('[data-testid="location"]');
            expect(locationEl.textContent).toContain("category=Fashion");

            // Reset filters
            const resetButton = Array.from(container.querySelectorAll("button")).find(
                (b) => b.textContent.trim() === "Reset"
            );
            expect(resetButton).toBeTruthy();

            await act(async () => {
                resetButton.click();
            });

            // URL should be clean with no query parameters
            expect(locationEl.textContent).toBe("/products");
        });

        it("should handle invalid parameters in URL gracefully", async () => {
            productService.filterProducts.mockResolvedValueOnce({
                data: [],
                total: 8,
                page: 999,
                totalPages: 1,
                limit: 8,
            });

            await act(async () => {
                root.render(
                    <MemoryRouter
                        initialEntries={[
                            "/products?category=NonExistent&sortBy=invalidSort&sortOrder=invalidOrder&page=999",
                        ]}
                    >
                        <LocationDisplay />
                        <ProductsPage />
                    </MemoryRouter>
                );
            });

            await act(async () => {
                await Promise.resolve();
            });

            // Fallback sort applied
            expect(productService.filterProducts).toHaveBeenCalledWith(
                expect.objectContaining({
                    selectedCategory: "NonExistent",
                    sortBy: "title",
                    sortOrder: "asc",
                })
            );

            // Category select has NonExistent option
            const categorySelect = container.querySelectorAll("select")[0];
            expect(categorySelect.value).toBe("NonExistent");
        });

        it("should restore previous filter state when navigating back and forward", async () => {
            function NavigationButtons() {
                const navigate = useNavigate();
                return (
                    <div>
                        <button
                            data-testid="nav-back"
                            onClick={() => navigate(-1)}
                        >
                            Back
                        </button>
                        <button
                            data-testid="nav-forward"
                            onClick={() => navigate(1)}
                        >
                            Forward
                        </button>
                    </div>
                );
            }

            await act(async () => {
                root.render(
                    <MemoryRouter initialEntries={["/products"]}>
                        <NavigationButtons />
                        <LocationDisplay />
                        <ProductsPage />
                    </MemoryRouter>
                );
            });

            const categorySelect = container.querySelectorAll("select")[0];

            // Change to Fashion
            await act(async () => {
                categorySelect.value = "Fashion";
                categorySelect.dispatchEvent(new Event("change", { bubbles: true }));
            });

            expect(categorySelect.value).toBe("Fashion");

            // Navigate back
            const backButton = container.querySelector('[data-testid="nav-back"]');
            await act(async () => {
                backButton.click();
            });

            // State should restore to initial (empty category)
            expect(categorySelect.value).toBe("");

            // Navigate forward
            const forwardButton = container.querySelector('[data-testid="nav-forward"]');
            await act(async () => {
                forwardButton.click();
            });

            // State should restore to Fashion
            expect(categorySelect.value).toBe("Fashion");
        });
    });
});
