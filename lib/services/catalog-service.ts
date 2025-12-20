// ============================================================================
// Shared Catalog Service - Single source of truth for catalog API calls
// Following OpenAI MCP Server best practices: https://developers.openai.com/apps-sdk/build/mcp-server
// ============================================================================

export interface CatalogItem {
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

export interface CatalogResponse {
  catalog: CatalogItem[];
  error?: string;
}

export class CatalogService {
  private readonly apiUrl: string;
  private readonly apiKey: string | undefined;
  private readonly defaultPayload = {
    operation: "catalog_v2",
    catalog_id: "230",
    type: "1",
  };

  constructor() {
    this.apiUrl = "https://uat.ledgersapi.com/catalog/indiafilings-catalog/api";
    this.apiKey = 'p4xI6QzOPI4EyFg38qtcJ1nImIFru7zW3LcrSIOh';
  }

  /**
   * Fetches catalog data from the API
   * Returns all items - filtering handled by ChatGPT or client-side
   * @returns Promise with catalog data or error
   */
  async fetchCatalog(): Promise<CatalogResponse> {
    if (!this.apiKey) {
      return {
        catalog: [],
        error: "API key not configured. Please set CATALOG_API_KEY environment variable.",
      };
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.defaultPayload),
      });

      if (!response.ok) {
        return {
          catalog: [],
          error: `Failed to fetch catalog: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();

      // Handle different response structures
      let catalog: CatalogItem[] = [];
      if (Array.isArray(data)) {
        catalog = data;
      } else if (data.catalog && Array.isArray(data.catalog)) {
        catalog = data.catalog;
      } else if (data.data && Array.isArray(data.data)) {
        catalog = data.data;
      }

      // Log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`[CatalogService] Fetched ${catalog.length} items from API`);
      }

      return { catalog: catalog };
    } catch (error) {
      return {
        catalog: [],
        error: error instanceof Error ? error.message : "Failed to fetch catalog data",
      };
    }
  }
}

