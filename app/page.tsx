"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useWidgetProps,
  useWidgetState,
  useMaxHeight,
  useDisplayMode,
  useRequestDisplayMode,
  useIsChatGptApp,
  useOpenAIGlobal,
} from "./hooks";
import { getVariantImageUrl } from "@/lib/utils/image-utils";

// ============================================================================
// Catalog Item Interface - matches API response structure
// ============================================================================
interface CatalogItem {
  id: number;
  service_name: string;
  variant_name: string;
  description: string;
  price: number;
  market_price: number;
  currency: string;
  rating: string;
  customers: number;
  delivery_time: number;
  category: string;
  page_url: string;
  about: string;
  unit: string;
}

// ============================================================================
// Tool Output Structure - matches what MCP server returns in structuredContent
// Following official OpenAI pattern: window.openai.toolOutput contains this
// ============================================================================
interface ToolOutput extends Record<string, unknown> {
  serviceName?: string | null;
  catalog?: CatalogItem[];
  error?: string;
  count?: number;
  message?: string;
}

export default function Home() {
  // ========================================================================
  // window.openai API Usage - Following Official OpenAI Pattern
  // Reference: https://developers.openai.com/apps-sdk/reference
  // ========================================================================
  
  // State & Data APIs
  const toolOutput = useWidgetProps<ToolOutput>(); // window.openai.toolOutput
  const toolInput = useOpenAIGlobal("toolInput"); // window.openai.toolInput (arguments supplied when tool was invoked)
  const toolResponseMetadata = useOpenAIGlobal("toolResponseMetadata"); // window.openai.toolResponseMetadata (_meta payload)
  
  // Widget State - Persists across widget lifecycles (minimize/restore)
  const [widgetState, setWidgetState] = useWidgetState<{ selectedCardId: number | null }>(() => ({
    selectedCardId: null,
  }));
  
  // Context Signals - Environment information
  const maxHeight = useMaxHeight() ?? undefined; // window.openai.maxHeight
  const displayMode = useDisplayMode(); // window.openai.displayMode
  const theme = useOpenAIGlobal("theme"); // window.openai.theme
  const locale = useOpenAIGlobal("locale"); // window.openai.locale
  const userAgent = useOpenAIGlobal("userAgent"); // window.openai.userAgent
  
  // Widget Runtime APIs
  const requestDisplayMode = useRequestDisplayMode(); // window.openai.requestDisplayMode
  const isChatGptApp = useIsChatGptApp();

  // Local component state (not persisted)
  const [localCatalog, setLocalCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Ref for tracking height changes
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract data from toolOutput (official pattern: window.openai.toolOutput)
  const catalogFromTool = toolOutput?.catalog || [];
  const serviceNameFromTool = toolOutput?.serviceName;
  const errorFromTool = toolOutput?.error;

  // Use tool data if available, otherwise use local
  const catalog = catalogFromTool.length > 0 ? catalogFromTool : localCatalog;
  const serviceName = serviceNameFromTool;
  const error = errorFromTool || localError;
  
  // Find selected card from widgetState (persisted across renders)
  const selectedCard = widgetState?.selectedCardId
    ? catalog.find((item) => item.id === widgetState.selectedCardId) || null
    : null;

  // Debug logging (development only) - Shows all window.openai APIs
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[Widget Debug] window.openai.toolOutput:', toolOutput);
      console.log('[Widget Debug] window.openai.toolInput:', toolInput);
      console.log('[Widget Debug] window.openai.toolResponseMetadata:', toolResponseMetadata);
      console.log('[Widget Debug] window.openai.widgetState:', widgetState);
      console.log('[Widget Debug] window.openai.theme:', theme);
      console.log('[Widget Debug] window.openai.locale:', locale);
      console.log('[Widget Debug] window.openai.displayMode:', displayMode);
      console.log('[Widget Debug] catalog from tool:', catalogFromTool);
      console.log('[Widget Debug] catalog length:', catalog?.length);
      console.log('[Widget Debug] serviceName:', serviceName);
      console.log('[Widget Debug] isChatGptApp:', isChatGptApp);
    }
  }, [toolOutput, toolInput, toolResponseMetadata, widgetState, theme, locale, displayMode, catalogFromTool, catalog, serviceName, isChatGptApp]);

  // Notify ChatGPT of dynamic height changes (official pattern)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.openai?.notifyIntrinsicHeight && containerRef.current) {
      const height = containerRef.current.scrollHeight;
      window.openai.notifyIntrinsicHeight({ height });
    }
  }, [catalog.length, selectedCard, displayMode]);

  // Fallback: Fetch catalog data locally if not in ChatGPT or toolOutput is empty
  const fetchCatalogData = useCallback(async () => {
    setLoading(true);
    setLocalError(null);

    try {
      const response = await fetch("/api/catalog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch: ${response.status}`);
      }

      const data = await response.json();
      setLocalCatalog(data.catalog || []);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to fetch catalog data");
      console.error("Error fetching catalog:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch locally only if:
  // 1. Not in ChatGPT app (standalone mode) OR
  // 2. In ChatGPT app but no toolOutput after delay
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (!isChatGptApp) {
      // Standalone mode: always fetch locally
      if (!catalogFromTool.length && !loading && localCatalog.length === 0 && !localError) {
        fetchCatalogData();
      }
    } else {
      // ChatGPT mode: wait a bit to see if toolOutput arrives
      timeoutId = setTimeout(() => {
        if (!catalogFromTool.length && !loading && localCatalog.length === 0 && !localError) {
          console.log("[Widget Debug] No toolOutput received after delay in ChatGPT app, fetching locally as fallback.");
          fetchCatalogData();
        }
      }, 2000); // 2 second delay
    }

    return () => clearTimeout(timeoutId);
  }, [isChatGptApp, catalogFromTool.length, loading, localCatalog.length, localError, fetchCatalogData]);

  // Handle card click - Persist selection in widgetState (official pattern)
  const handleCardClick = (item: CatalogItem) => {
    setWidgetState({ selectedCardId: item.id });
    // Notify height change after modal opens
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.openai?.notifyIntrinsicHeight && containerRef.current) {
        const height = containerRef.current.scrollHeight;
        window.openai.notifyIntrinsicHeight({ height });
      }
    }, 100);
  };

  // Handle close - Clear selection from widgetState (official pattern)
  const handleCloseDetails = () => {
    setWidgetState({ selectedCardId: null });
    // Notify height change after modal closes
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.openai?.notifyIntrinsicHeight && containerRef.current) {
        const height = containerRef.current.scrollHeight;
        window.openai.notifyIntrinsicHeight({ height });
      }
    }, 100);
  };

  return (
    <div
      ref={containerRef}
      className="font-sans p-4 sm:p-8 bg-slate-950 min-h-screen text-white"
      style={{
        maxHeight,
        height: displayMode === "fullscreen" ? maxHeight : undefined,
        overflow: "auto",
      }}
    >
      {displayMode !== "fullscreen" && (
        <button
          aria-label="Enter fullscreen"
          className="fixed top-4 right-4 z-50 rounded-full bg-slate-900 text-slate-300 shadow-lg ring-1 ring-slate-800 p-2.5 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800"
          onClick={() => requestDisplayMode("fullscreen")}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            />
          </svg>
        </button>
      )}

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-5 text-white">
          Service Catalog
        </h1>
        {serviceName && (
          <p className="text-sm text-slate-400 mb-6">
            Showing results for: <span className="font-semibold text-white">{serviceName}</span>
          </p>
        )}

        {error && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
            <p className="text-slate-300">
              Loading catalog data...
            </p>
          </div>
        )}

        {catalog.length === 0 && !error && !loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
            <p className="text-slate-300">
              No services found{serviceName ? ` for "${serviceName}"` : ""}.
            </p>
            <button
              onClick={fetchCatalogData}
              className="mt-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-4 rounded-lg border border-slate-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {catalog.map((item: CatalogItem) => (
            <div
              key={item.id}
              className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
              onClick={() => handleCardClick(item)}
            >
              {/* Image with Rating Badge */}
              <div className="relative h-48 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
                <img
                  src={getVariantImageUrl(item.variant_name, item.service_name)}
                  alt={item.variant_name || item.service_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = 'absolute inset-0 bg-gradient-to-br from-slate-600/50 to-slate-800/50';
                      parent.appendChild(fallback);
                    }
                  }}
                />

                {/* Rating Badge */}
                {item.rating && (
                  <div className="absolute top-3 right-3 bg-yellow-500/90 backdrop-blur-sm text-slate-900 text-xs font-semibold px-2 py-1 rounded flex items-center gap-1 z-10">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {parseFloat(item.rating).toFixed(1)}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Variant Name (Prominent) */}
                {item.variant_name && (
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {item.variant_name}
                  </h3>
                )}

                {/* Location/Category */}
                <div className="flex items-center gap-1.5 text-slate-400 text-sm mb-3">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{item.category || item.service_name}</span>
                </div>

                {/* Features/Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.unit && (
                    <span className="text-xs text-slate-300 bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-700">
                      {item.unit}
                    </span>
                  )}
                  {item.delivery_time > 0 && (
                    <span className="text-xs text-slate-300 bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-700">
                      {item.delivery_time} days
                    </span>
                  )}
                  {item.customers > 0 && (
                    <span className="text-xs text-slate-300 bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-700">
                      {item.customers} customers
                    </span>
                  )}
                </div>

                {/* Price and Button */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Starting from</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-semibold text-white">
                        {item.currency} {item.price}
                      </span>
                      {item.market_price > item.price && (
                        <span className="text-sm text-slate-500 line-through">
                          {item.currency} {item.market_price}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg border border-slate-700 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for card details */}
      {selectedCard && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={handleCloseDetails}
        >
          <div
            className="bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">
                    {selectedCard.service_name}
                  </h2>
                  {selectedCard.variant_name && (
                    <p className="text-lg text-slate-300 mt-1">
                      {selectedCard.variant_name}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleCloseDetails}
                  className="text-slate-400 hover:text-white"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-white">
                    {selectedCard.currency} {selectedCard.price}
                  </span>
                  {selectedCard.market_price > selectedCard.price && (
                    <span className="text-lg text-slate-500 line-through">
                      {selectedCard.currency} {selectedCard.market_price}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400">{selectedCard.unit}</p>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-white mb-2">Description</h3>
                <p className="text-slate-300">
                  {selectedCard.description}
                </p>
              </div>

              {selectedCard.about && (
                <div className="mb-4">
                  <h3 className="font-semibold text-white mb-2">What's Included</h3>
                  <div className="text-slate-300 whitespace-pre-line">
                    {selectedCard.about}
                  </div>
                </div>
              )}

              <div className="flex gap-4 mb-4 text-sm">
                {selectedCard.rating && (
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>Rating: {parseFloat(selectedCard.rating).toFixed(1)}</span>
                  </div>
                )}
                {selectedCard.customers > 0 && (
                  <span>Customers: {selectedCard.customers}</span>
                )}
                {selectedCard.delivery_time > 0 && (
                  <span>Delivery: {selectedCard.delivery_time} days</span>
                )}
              </div>

              {selectedCard.page_url && (
                <a
                  href={selectedCard.page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg border border-slate-700 transition-colors text-center"
                >
                  View Full Details
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
