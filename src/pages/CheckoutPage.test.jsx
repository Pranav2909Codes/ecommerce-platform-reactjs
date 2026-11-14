import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import CheckoutPage from "./CheckoutPage";
import { validateField, validateForm } from "../utils/checkoutValidation";
import useCartStore from "../features/cart/hooks/useCartStore";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("checkoutValidation helper", () => {
    describe("validateField", () => {
        it("should require non-empty values and treat whitespace as empty", () => {
            expect(validateField("firstName", "")).toBe("This field is required");
            expect(validateField("firstName", "   ")).toBe("This field is required");
            expect(validateField("firstName", "John")).toBe("");
        });

        it("should validate email format using proper regex", () => {
            expect(validateField("email", "notanemail")).toBe("Please enter a valid email address");
            expect(validateField("email", "test@")).toBe("Please enter a valid email address");
            expect(validateField("email", "test@domain")).toBe("Please enter a valid email address");
            expect(validateField("email", "test@domain@domain.com")).toBe("Please enter a valid email address");
            expect(validateField("email", "test@domain.com")).toBe("");
            expect(validateField("email", "user.name+tag@sub.domain.co.uk")).toBe("");
        });

        it("should validate phone format accepting digits, spaces, dashes, parentheses, + prefix", () => {
            expect(validateField("phone", "abc")).toBe("Please enter a valid phone number");
            expect(validateField("phone", "123")).toBe("Please enter a valid phone number");
            expect(validateField("phone", "+1 (555) 000-0000")).toBe("");
            expect(validateField("phone", "+44 20 7946 0958")).toBe("");
            expect(validateField("phone", "555-123-4567")).toBe("");
            expect(validateField("phone", "(555) 123-4567")).toBe("");
            expect(validateField("phone", "1234567890")).toBe("");
        });
    });

    describe("validateForm", () => {
        it("should return errors for all empty fields", () => {
            const emptyForm = {
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                address: "",
                city: "",
                zipCode: "",
                country: "",
            };
            const errors = validateForm(emptyForm);
            expect(Object.keys(errors)).toHaveLength(8);
            expect(errors.firstName).toBe("This field is required");
            expect(errors.country).toBe("This field is required");
        });

        it("should return empty object for completely valid form", () => {
            const validForm = {
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                phone: "+1 (555) 000-0000",
                address: "123 Main St",
                city: "New York",
                zipCode: "10001",
                country: "US",
            };
            const errors = validateForm(validForm);
            expect(Object.keys(errors)).toHaveLength(0);
        });
    });
});

describe("CheckoutPage UI Integration", () => {
    let container;
    let root;

    const sampleItem = {
        id: 1,
        title: "Test Product",
        price: 50,
        quantity: 2,
        thumbnail: "https://example.com/test.jpg",
    };

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);

        useCartStore.getState().clearCart();
    });

    afterEach(() => {
        act(() => {
            root.unmount();
        });
        container.remove();
    });

    const renderCheckout = async () => {
        await act(async () => {
            root.render(
                <MemoryRouter>
                    <CheckoutPage />
                </MemoryRouter>
            );
        });
    };

    const fillInput = async (name, value) => {
        const input = container.querySelector(`[name="${name}"]`);
        await act(async () => {
            // Native input value setter so React synthetic change triggers properly
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value"
            )?.set;
            const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLSelectElement.prototype,
                "value"
            )?.set;

            if (input.tagName === "SELECT") {
                nativeSelectValueSetter?.call(input, value);
            } else {
                nativeInputValueSetter?.call(input, value);
            }

            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });
    };

    const blurInput = async (name) => {
        const input = container.querySelector(`[name="${name}"]`);
        await act(async () => {
            input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
            input.dispatchEvent(new FocusEvent("blur", { bubbles: false }));
        });
    };

    const submitForm = async () => {
        const form = container.querySelector("form");
        await act(async () => {
            form.dispatchEvent(
                new Event("submit", { bubbles: true, cancelable: true })
            );
        });
    };

    it("should show empty cart state when cart is empty", async () => {
        await renderCheckout();
        expect(container.textContent).toContain("Your cart is empty");
        expect(container.textContent).toContain("Browse Products");
    });

    it("should render checkout form when items exist in cart with no initial errors", async () => {
        useCartStore.setState({ items: [sampleItem] });
        await renderCheckout();

        expect(container.textContent).toContain("Shipping Information");
        expect(container.textContent).toContain("Your Order");
        expect(container.textContent).toContain("Test Product");
        expect(container.querySelectorAll(".text-red-500").length).toBe(0);
    });

    it("should show validation errors on all fields when submitting empty form", async () => {
        useCartStore.setState({ items: [sampleItem] });
        await renderCheckout();

        await submitForm();

        // Form submission prevented, cart not cleared
        expect(useCartStore.getState().items.length).toBe(1);
        expect(container.textContent).not.toContain("Order Placed Successfully!");

        // Inline error messages shown
        expect(container.textContent).toContain("This field is required");
        const errorElements = container.querySelectorAll("[data-testid^='error-']");
        expect(errorElements.length).toBe(8);

        // Inputs have red border
        const firstNameInput = container.querySelector("[name='firstName']");
        expect(firstNameInput.className).toContain("border-red-500");
    });

    it("should show errors on field blur", async () => {
        useCartStore.setState({ items: [sampleItem] });
        await renderCheckout();

        // Initially no error
        expect(container.querySelector("[data-testid='error-email']")).toBeNull();

        // Blur email while empty
        await blurInput("email");
        expect(container.querySelector("[data-testid='error-email']")).not.toBeNull();
        expect(container.querySelector("[data-testid='error-email']").textContent).toBe(
            "This field is required"
        );

        // Blur with invalid email
        await fillInput("email", "invalid-email");
        await blurInput("email");
        expect(container.querySelector("[data-testid='error-email']").textContent).toBe(
            "Please enter a valid email address"
        );
    });

    it("should clear error in real-time as user corrects the field", async () => {
        useCartStore.setState({ items: [sampleItem] });
        await renderCheckout();

        // Trigger error by submitting
        await submitForm();
        expect(container.querySelector("[data-testid='error-firstName']")).not.toBeNull();
        const input = container.querySelector("[name='firstName']");
        expect(input.className).toContain("border-red-500");

        // Type valid value
        await fillInput("firstName", "Alice");

        // Error message clears and red border is removed
        expect(container.querySelector("[data-testid='error-firstName']")).toBeNull();
        expect(input.className).not.toContain("border-red-500");
    });

    it("should validate phone format with international prefix and invalid characters", async () => {
        useCartStore.setState({ items: [sampleItem] });
        await renderCheckout();

        // Invalid phone with letters
        await fillInput("phone", "123-abc-4567");
        await blurInput("phone");
        expect(container.querySelector("[data-testid='error-phone']").textContent).toBe(
            "Please enter a valid phone number"
        );

        // Valid international phone
        await fillInput("phone", "+1 (555) 123-4567");
        expect(container.querySelector("[data-testid='error-phone']")).toBeNull();
    });

    it("should successfully place order when all fields are valid", async () => {
        useCartStore.setState({ items: [sampleItem] });
        await renderCheckout();

        await fillInput("firstName", "Jane");
        await fillInput("lastName", "Smith");
        await fillInput("email", "jane.smith@example.com");
        await fillInput("phone", "+1-555-123-4567");
        await fillInput("address", "456 Market St");
        await fillInput("city", "San Francisco");
        await fillInput("zipCode", "94103");
        await fillInput("country", "US");

        await submitForm();

        // Cart is cleared and order placed screen is shown
        expect(useCartStore.getState().items.length).toBe(0);
        expect(container.textContent).toContain("Order Placed Successfully!");
        expect(container.textContent).toContain("Continue Shopping");
    });

    it("should handle edge case: whitespace-only inputs are treated as empty", async () => {
        useCartStore.setState({ items: [sampleItem] });
        await renderCheckout();

        await fillInput("firstName", "    ");
        await blurInput("firstName");
        expect(container.querySelector("[data-testid='error-firstName']").textContent).toBe(
            "This field is required"
        );
    });

    it("should handle edge case: fixing one field and submitting again keeps remaining errors", async () => {
        useCartStore.setState({ items: [sampleItem] });
        await renderCheckout();

        // Submit empty form -> 8 errors
        await submitForm();
        expect(container.querySelectorAll("[data-testid^='error-']").length).toBe(8);

        // Fix firstName only
        await fillInput("firstName", "John");
        expect(container.querySelectorAll("[data-testid^='error-']").length).toBe(7);

        // Submit again -> still 7 errors, order not placed
        await submitForm();
        expect(container.querySelectorAll("[data-testid^='error-']").length).toBe(7);
        expect(container.textContent).not.toContain("Order Placed Successfully!");
    });
});
