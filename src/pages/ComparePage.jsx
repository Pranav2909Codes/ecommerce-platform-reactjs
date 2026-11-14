import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../features/products/services/productService";
import useCompareStore from "../features/compare/hooks/useCompareStore";
import useCartStore from "../features/cart/hooks/useCartStore";

export default function ComparePage() {
    const [products, setProducts] = useState([]);
    const compareItems = useCompareStore((s) => s.items);
    const setProductA = useCompareStore((s) => s.setProductA);
    const setProductB = useCompareStore((s) => s.setProductB);
    const swapProducts = useCompareStore((s) => s.swapProducts);
    const clearCompare = useCompareStore((s) => s.clearCompare);
    const addToCart = useCartStore((s) => s.addToCart);

    useEffect(() => {
        async function load() {
            try {
                const allProducts = await getProducts();
                setProducts(allProducts);
            } catch (error) {
                console.error("Failed to load products for comparison:", error);
            }
        }
        load();
    }, []);

    const productA = compareItems[0] || null;
    const productB = compareItems[1] || null;
    const selectedProductA = productA ? String(productA.id) : "";
    const selectedProductB = productB ? String(productB.id) : "";

    const handleSelectA = (id) => {
        const prod = products.find((p) => p.id === Number(id)) || null;
        setProductA(prod);
    };

    const handleSelectB = (id) => {
        const prod = products.find((p) => p.id === Number(id)) || null;
        setProductB(prod);
    };

    const handleSwap = () => {
        swapProducts();
    };

    const handleClear = () => {
        clearCompare();
    };

    const comparisonFields = [
        {
            label: "Price",
            key: "price",
            format: (v) => (v != null ? `$${v.toFixed(2)}` : "—"),
            getWinner: (a, b) => {
                if (!a || !b || a.price === b.price) return null;
                return a.price < b.price ? "A" : "B";
            },
            badge: "Lower Price",
        },
        {
            label: "Rating",
            key: "rating",
            format: (v) => (v != null ? `${v} / 5` : "—"),
            getWinner: (a, b) => {
                if (!a || !b || a.rating === b.rating) return null;
                return a.rating > b.rating ? "A" : "B";
            },
            badge: "Higher Rating",
        },
        {
            label: "Stock",
            key: "stock",
            format: (v) => (v != null ? `${v} units` : "—"),
            getWinner: (a, b) => {
                if (!a || !b || a.stock === b.stock) return null;
                return a.stock > b.stock ? "A" : "B";
            },
            badge: "More Stock",
        },
        {
            label: "Category",
            key: "category",
            format: (v) => v || "—",
            getWinner: () => null,
        },
        {
            label: "Availability",
            key: "availability",
            format: (_, p) => (p?.stock > 0 ? "In Stock" : "Out of Stock"),
            getWinner: (a, b) => {
                if (!a || !b) return null;
                const aIn = a.stock > 0;
                const bIn = b.stock > 0;
                if (aIn === bIn) return null;
                return aIn ? "A" : "B";
            },
            badge: "In Stock",
        },
    ];

    const isCrossCategory =
        Boolean(productA && productB && productA.category !== productB.category);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Compare Products</h1>
                    <p className="text-gray-500 mt-1">
                        Select two products to compare them side by side
                    </p>
                </div>
                {(productA || productB) && (
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleSwap}
                            disabled={!productA || !productB}
                            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Swap
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="px-4 py-2 border border-red-200 rounded-xl text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors cursor-pointer"
                        >
                            Clear All
                        </button>
                    </div>
                )}
            </div>

            {/* Product Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product A
                    </label>
                    <select
                        value={selectedProductA}
                        onChange={(e) => handleSelectA(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                        <option value="">Select a product...</option>
                        {products.map((p) => (
                            <option
                                key={p.id}
                                value={p.id}
                                disabled={p.id === Number(selectedProductB)}
                            >
                                {p.title} {p.id === Number(selectedProductB) ? "(Already selected as B)" : ""}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product B
                    </label>
                    <select
                        value={selectedProductB}
                        onChange={(e) => handleSelectB(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                        <option value="">Select a product...</option>
                        {products.map((p) => (
                            <option
                                key={p.id}
                                value={p.id}
                                disabled={p.id === Number(selectedProductA)}
                            >
                                {p.title} {p.id === Number(selectedProductA) ? "(Already selected as A)" : ""}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Cross-category alert badge */}
            {isCrossCategory && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                    <span className="text-xl">ℹ️</span>
                    <p className="text-sm text-amber-800">
                        <strong>Cross-category comparison:</strong> You are comparing products from different categories ({productA.category} vs {productB.category}).
                    </p>
                </div>
            )}

            {/* Comparison Table */}
            {productA || productB ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Product Headers */}
                    <div className="grid grid-cols-3 border-b border-gray-100">
                        <div className="p-4 bg-gray-50 font-medium text-sm text-gray-500 flex items-center">
                            Product
                        </div>
                        <div className="p-4 text-center border-l border-gray-100 relative">
                            {productA ? (
                                <div className="flex flex-col items-center">
                                    <button
                                        type="button"
                                        onClick={() => handleSelectA("")}
                                        aria-label="Remove Product A"
                                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-400 flex items-center justify-center text-xs transition-colors cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                    <Link to={`/products/${productA.id}`}>
                                        <img
                                            src={productA.thumbnail}
                                            alt={productA.title}
                                            className="w-20 h-20 object-cover rounded-xl mx-auto mb-2 hover:opacity-90 transition-opacity"
                                        />
                                    </Link>
                                    <Link
                                        to={`/products/${productA.id}`}
                                        className="text-sm font-semibold text-gray-800 hover:text-primary-600 transition-colors line-clamp-2 mb-3"
                                    >
                                        {productA.title}
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => addToCart(productA)}
                                        disabled={productA.stock === 0}
                                        className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 py-8">
                                    Select Product A
                                </p>
                            )}
                        </div>
                        <div className="p-4 text-center border-l border-gray-100 relative">
                            {productB ? (
                                <div className="flex flex-col items-center">
                                    <button
                                        type="button"
                                        onClick={() => handleSelectB("")}
                                        aria-label="Remove Product B"
                                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-400 flex items-center justify-center text-xs transition-colors cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                    <Link to={`/products/${productB.id}`}>
                                        <img
                                            src={productB.thumbnail}
                                            alt={productB.title}
                                            className="w-20 h-20 object-cover rounded-xl mx-auto mb-2 hover:opacity-90 transition-opacity"
                                        />
                                    </Link>
                                    <Link
                                        to={`/products/${productB.id}`}
                                        className="text-sm font-semibold text-gray-800 hover:text-primary-600 transition-colors line-clamp-2 mb-3"
                                    >
                                        {productB.title}
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => addToCart(productB)}
                                        disabled={productB.stock === 0}
                                        className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 py-8">
                                    Select Product B
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Comparison Rows */}
                    {comparisonFields.map((field) => {
                        const winner = field.getWinner(productA, productB);
                        const isAWinner = winner === "A";
                        const isBWinner = winner === "B";
                        const isIdentical =
                            productA &&
                            productB &&
                            field.key !== "availability" &&
                            field.key !== "category" &&
                            productA[field.key] === productB[field.key];

                        return (
                            <div
                                key={field.key}
                                className="grid grid-cols-3 border-b border-gray-50 last:border-0 items-center"
                            >
                                <div className="p-4 bg-gray-50 text-sm font-medium text-gray-600">
                                    {field.label}
                                </div>
                                <div
                                    className={`p-4 text-center text-sm border-l border-gray-100 transition-colors ${
                                        isAWinner
                                            ? "bg-emerald-50/70 text-emerald-800 font-semibold"
                                            : "text-gray-800"
                                    }`}
                                >
                                    <div>{productA ? field.format(productA[field.key], productA) : "—"}</div>
                                    {isAWinner && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">
                                            ✓ {field.badge}
                                        </span>
                                    )}
                                    {isIdentical && (
                                        <span className="inline-flex items-center text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded-md mt-1">
                                            Equal
                                        </span>
                                    )}
                                </div>
                                <div
                                    className={`p-4 text-center text-sm border-l border-gray-100 transition-colors ${
                                        isBWinner
                                            ? "bg-emerald-50/70 text-emerald-800 font-semibold"
                                            : "text-gray-800"
                                    }`}
                                >
                                    <div>{productB ? field.format(productB[field.key], productB) : "—"}</div>
                                    {isBWinner && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">
                                            ✓ {field.badge}
                                        </span>
                                    )}
                                    {isIdentical && (
                                        <span className="inline-flex items-center text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded-md mt-1">
                                            Equal
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Description Row */}
                    <div className="grid grid-cols-3 border-t border-gray-100">
                        <div className="p-4 bg-gray-50 text-sm font-medium text-gray-600">
                            Description
                        </div>
                        <div className="p-4 text-sm text-gray-600 border-l border-gray-100 leading-relaxed">
                            {productA?.description || "—"}
                        </div>
                        <div className="p-4 text-sm text-gray-600 border-l border-gray-100 leading-relaxed">
                            {productB?.description || "—"}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                    <svg
                        className="w-20 h-20 text-gray-200 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        Select Products to Compare
                    </h3>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
                        Choose two products from the dropdowns above or browse products to
                        add them to comparison.
                    </p>
                    <Link
                        to="/products"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                    >
                        Browse Products
                    </Link>
                </div>
            )}
        </div>
    );
}
