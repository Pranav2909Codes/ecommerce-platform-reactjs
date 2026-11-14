import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProductDetailsPage from "./ProductDetailsPage";
import * as productService from "../services/productService";
import useCartStore from "../features/cart/hooks/useCartStore";
import useWishlistStore from "../features/wishlist/hooks/useWishlistStore";
import useCompareStore from "../features/compare/hooks/useCompareStore";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("../services/productService", () => ({
    getProductById: vi.fn(),
    getReviewsByProductId: vi.fn(),
}));

describe("ProductDetailsPage", () => {
    let container;
    let root;

    const mockProduct = {
        id: 1,
        title: "Wireless Noise-Canceling Headphones",
        category: "Electronics",
        price: 199.99,
        rating: 4.8,
        stock: 15,
        description: "Premium wireless headphones with active noise cancellation.",
        thumbnail: "https://example.com/headphones.jpg",
    };

    const mockReviews = [
        {
            id: 1,
            productId: 1,
            user: "Alex M.",
            rating: 5,
            comment: "Best headphones I have ever owned. The noise cancellation is incredible!",
            date: "2025-12-15",
        },
        {
            id: 2,
            productId: 1,
            user: "Sarah K.",
            rating: 4,
            comment: "Great sound quality and very comfortable. Battery lasts forever.",
            date: "2025-12-20",
        },
        {
            id: 3,
            productId: 1,
            user: "Mike R.",
            rating: 5,
            comment: "Perfect for working from home. Blocks out all distractions.",
            date: "2026-01-03",
        },
    ];

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);

        useCartStore.getState().clearCart();
        useWishlistStore.getState().clearWishlist?.() ||
            useWishlistStore.setState({ wishlistItems: [] });
        useCompareStore.getState().clearCompare();

        productService.getProductById.mockReset();
        productService.getReviewsByProductId.mockReset();
    });

    afterEach(() => {
        act(() => {
            root.unmount();
        });
        container.remove();
    });

    const renderPage = async (productId = "1") => {
        await act(async () => {
            root.render(
                <MemoryRouter initialEntries={[`/products/${productId}`]}>
                    <Routes>
                        <Route path="/products/:id" element={<ProductDetailsPage />} />
                        <Route path="/products" element={<div>Products Listing</div>} />
                    </Routes>
                </MemoryRouter>
            );
        });
    };

    it("should display 'Product Not Found' if product does not exist", async () => {
        productService.getProductById.mockResolvedValue(null);
        productService.getReviewsByProductId.mockResolvedValue([]);

        await renderPage("999");

        expect(container.textContent).toContain("Product Not Found");
        expect(container.textContent).toContain("Back to Products");
    });

    it("should fetch reviews and display reviewer name, rating, comment, and date", async () => {
        productService.getProductById.mockResolvedValue(mockProduct);
        productService.getReviewsByProductId.mockResolvedValue(mockReviews);

        await renderPage("1");

        expect(productService.getReviewsByProductId).toHaveBeenCalledWith("1");

        // Reviewer names
        expect(container.textContent).toContain("Alex M.");
        expect(container.textContent).toContain("Sarah K.");
        expect(container.textContent).toContain("Mike R.");

        // Comments
        expect(container.textContent).toContain("Best headphones I have ever owned");
        expect(container.textContent).toContain("Great sound quality and very comfortable");
        expect(container.textContent).toContain("Perfect for working from home");

        // Dates formatted nicely
        expect(container.textContent).toContain(new Date("2026-01-03").toLocaleDateString());
        expect(container.textContent).toContain(new Date("2025-12-20").toLocaleDateString());
        expect(container.textContent).toContain(new Date("2025-12-15").toLocaleDateString());

        // Review cards exist
        const reviewCards = container.querySelectorAll("[data-testid='review-card']");
        expect(reviewCards.length).toBe(3);
    });

    it("should correctly calculate average rating and show total review count", async () => {
        productService.getProductById.mockResolvedValue(mockProduct);
        productService.getReviewsByProductId.mockResolvedValue(mockReviews);

        await renderPage("1");

        // Average: (5 + 4 + 5) / 3 = 14 / 3 = 4.6666... -> 4.7
        const avgRatingElem = container.querySelector("[data-testid='average-rating']");
        expect(avgRatingElem).not.toBeNull();
        expect(avgRatingElem.textContent.trim()).toBe("4.7");

        // Total review count
        expect(container.textContent).toContain("3 reviews");
    });

    it("should sort reviews by date newest first", async () => {
        // mockReviews has dates: 2025-12-15, 2025-12-20, 2026-01-03
        // Newest first order should be: Mike R. (2026-01-03), then Sarah K. (2025-12-20), then Alex M. (2025-12-15)
        productService.getProductById.mockResolvedValue(mockProduct);
        productService.getReviewsByProductId.mockResolvedValue(mockReviews);

        await renderPage("1");

        const reviewCards = container.querySelectorAll("[data-testid='review-card']");
        expect(reviewCards.length).toBe(3);

        const firstCardText = reviewCards[0].textContent;
        const secondCardText = reviewCards[1].textContent;
        const thirdCardText = reviewCards[2].textContent;

        expect(firstCardText).toContain("Mike R.");
        expect(secondCardText).toContain("Sarah K.");
        expect(thirdCardText).toContain("Alex M.");
    });

    it("should display empty state 'No reviews yet' when product has zero reviews", async () => {
        productService.getProductById.mockResolvedValue(mockProduct);
        productService.getReviewsByProductId.mockResolvedValue([]);

        await renderPage("1");

        expect(container.textContent).toContain("No reviews yet");
        expect(container.querySelector("[data-testid='no-reviews']")).not.toBeNull();
        expect(container.querySelectorAll("[data-testid='review-card']").length).toBe(0);
    });

    it("should render correct star highlighting for rating edges (1 and 5)", async () => {
        const edgeReviews = [
            {
                id: 10,
                productId: 1,
                user: "Unhappy User",
                rating: 1,
                comment: "Terrible experience.",
                date: "2026-01-01",
            },
            {
                id: 11,
                productId: 1,
                user: "Super Happy User",
                rating: 5,
                comment: "Absolutely perfect!",
                date: "2026-01-02",
            },
        ];

        productService.getProductById.mockResolvedValue(mockProduct);
        productService.getReviewsByProductId.mockResolvedValue(edgeReviews);

        await renderPage("1");

        const cards = container.querySelectorAll("[data-testid='review-card']");
        expect(cards.length).toBe(2);

        // First card in newest-first is Super Happy User (rating 5)
        const fiveStarCard = cards[0];
        expect(fiveStarCard.textContent).toContain("Super Happy User");
        const fiveStarSvgs = fiveStarCard.querySelectorAll("svg");
        expect(fiveStarSvgs.length).toBe(5);
        fiveStarSvgs.forEach((svg) => {
            expect(svg.getAttribute("class")).toContain("text-amber-400");
        });

        // Second card is Unhappy User (rating 1)
        const oneStarCard = cards[1];
        expect(oneStarCard.textContent).toContain("Unhappy User");
        const oneStarSvgs = oneStarCard.querySelectorAll("svg");
        expect(oneStarSvgs.length).toBe(5);
        expect(oneStarSvgs[0].getAttribute("class")).toContain("text-amber-400");
        for (let i = 1; i < 5; i++) {
            expect(oneStarSvgs[i].getAttribute("class")).toContain("text-gray-300");
        }
    });

    it("should show top 5 reviews and allow expanding via 'Show all' button", async () => {
        const manyReviews = Array.from({ length: 8 }, (_, i) => ({
            id: i + 1,
            productId: 1,
            user: `User ${i + 1}`,
            rating: (i % 5) + 1,
            comment: `Comment number ${i + 1}`,
            date: `2026-01-0${i + 1}`,
        }));

        productService.getProductById.mockResolvedValue(mockProduct);
        productService.getReviewsByProductId.mockResolvedValue(manyReviews);

        await renderPage("1");

        // Initially only 5 visible
        let cards = container.querySelectorAll("[data-testid='review-card']");
        expect(cards.length).toBe(5);

        // Show all button should be visible
        const showAllButton = Array.from(container.querySelectorAll("button")).find((btn) =>
            btn.textContent.includes("Show all")
        );
        expect(showAllButton).toBeDefined();
        expect(showAllButton.textContent).toContain("8");

        // Click to expand
        await act(async () => {
            showAllButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        cards = container.querySelectorAll("[data-testid='review-card']");
        expect(cards.length).toBe(8);
        expect(showAllButton.textContent).toContain("Show less");

        // Click again to collapse
        await act(async () => {
            showAllButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        cards = container.querySelectorAll("[data-testid='review-card']");
        expect(cards.length).toBe(5);
    });

    it("should allow adding product to cart, wishlist, and compare", async () => {
        productService.getProductById.mockResolvedValue(mockProduct);
        productService.getReviewsByProductId.mockResolvedValue(mockReviews);

        await renderPage("1");

        // Add to cart
        const addToCartBtn = Array.from(container.querySelectorAll("button")).find(
            (b) => b.textContent.trim() === "Add to Cart"
        );
        await act(async () => {
            addToCartBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });
        expect(useCartStore.getState().items.length).toBe(1);
        expect(useCartStore.getState().items[0].id).toBe(1);

        // Toggle wishlist
        const wishlistBtn = container.querySelector("button[aria-label='Add to wishlist']");
        await act(async () => {
            wishlistBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });
        expect(useWishlistStore.getState().isInWishlist(1)).toBe(true);

        // Toggle compare
        const compareBtn = container.querySelector("button[aria-label='Add to compare']");
        await act(async () => {
            compareBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });
        expect(useCompareStore.getState().isInCompare(1)).toBe(true);
    });
});
