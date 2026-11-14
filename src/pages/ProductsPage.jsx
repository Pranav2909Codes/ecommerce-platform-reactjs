import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { filterProducts, getCategories } from "../services/productService";
import ProductCard from "../features/products/components/ProductCard";

export default function ProductsPage() {
    const [searchParams] = useSearchParams();

    // State for the returned product listing object { data, total, page, totalPages, limit }
    const productsPerPage = 8;
    const [productsResponse, setProductsResponse] = useState({
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
        limit: productsPerPage,
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter, sort, and pagination state
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [selectedCategory, setSelectedCategory] = useState(
        searchParams.get("category") || ""
    );
    const [sortBy, setSortBy] = useState("title");
    const [sortOrder, setSortOrder] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    // Load available categories once on mount
    useEffect(() => {
        async function loadCategories() {
            try {
                const cats = await getCategories();
                setCategories(cats);
            } catch (error) {
                console.error("Failed to load categories:", error);
            }
        }
        loadCategories();
    }, []);

    // Sync category if URL search parameters change externally
    useEffect(() => {
        const cat = searchParams.get("category");
        if (cat !== null && cat !== selectedCategory) {
            setSelectedCategory(cat);
            setCurrentPage(1);
        }
    }, [searchParams, selectedCategory]);

    // Fetch filtered products whenever any filter, sort, or pagination parameter changes
    useEffect(() => {
        let ignore = false;

        async function fetchFilteredProducts() {
            setLoading(true);
            try {
                const result = await filterProducts({
                    search,
                    selectedCategory,
                    category: selectedCategory,
                    sortBy,
                    sortOrder,
                    currentPage,
                    page: currentPage,
                    productsPerPage,
                    limit: productsPerPage,
                    minPrice: minPrice !== "" ? Number(minPrice) : 0,
                    maxPrice: maxPrice !== "" ? Number(maxPrice) : Infinity,
                });

                if (!ignore) {
                    setProductsResponse(result);
                }
            } catch (error) {
                if (!ignore) {
                    console.error("Failed to fetch products:", error);
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        fetchFilteredProducts();

        return () => {
            ignore = true;
        };
    }, [
        search,
        selectedCategory,
        sortBy,
        sortOrder,
        currentPage,
        productsPerPage,
        minPrice,
        maxPrice,
    ]);

    const { data: products, total, totalPages } = productsResponse;
    const isFiltered = Boolean(
        search ||
        selectedCategory ||
        minPrice ||
        maxPrice ||
        sortBy !== "title" ||
        sortOrder !== "asc"
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">All Products</h1>
                <p className="text-gray-500">
                    Browse our collection of {total} premium products
                </p>
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
                <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    {/* Category Filter */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>

                    {/* Sort */}
                    <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                            const [by, order] = e.target.value.split("-");
                            setSortBy(by);
                            setSortOrder(order);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                        <option value="title-asc">Name: A → Z</option>
                        <option value="title-desc">Name: Z → A</option>
                        <option value="price-asc">Price: Low → High</option>
                        <option value="price-desc">Price: High → Low</option>
                        <option value="rating-desc">Rating: Best First</option>
                    </select>

                    {/* Price Range Filter (Bonus UI) */}
                    <div className="flex items-center gap-2">
                        <div className="relative w-24">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                            <input
                                type="number"
                                min="0"
                                placeholder="Min"
                                value={minPrice}
                                onChange={(e) => {
                                    setMinPrice(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-6 pr-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                            />
                        </div>
                        <span className="text-gray-400 text-sm">-</span>
                        <div className="relative w-24">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                            <input
                                type="number"
                                min="0"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={(e) => {
                                    setMaxPrice(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-6 pr-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                            />
                        </div>
                    </div>

                    {/* Reset Filters Button */}
                    {isFiltered && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                setSelectedCategory("");
                                setSortBy("title");
                                setSortOrder("asc");
                                setMinPrice("");
                                setMaxPrice("");
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors whitespace-nowrap cursor-pointer"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Loading Spinner */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
                    <p className="text-gray-500 text-sm">Loading products...</p>
                </div>
            ) : (
                <>
                    {/* Product Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {/* Empty State */}
                    {products.length === 0 && (
                        <div className="text-center py-16">
                            <svg
                                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                />
                            </svg>
                            <p className="text-gray-500 text-lg">No products found</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                                (pageNum) => (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                            currentPage === pageNum
                                                ? "bg-primary-600 text-white"
                                                : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                )
                            )}
                            <button
                                onClick={() =>
                                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                                }
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
