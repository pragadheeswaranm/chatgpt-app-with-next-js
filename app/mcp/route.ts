// ============================================================================
// MCP Server following official OpenAI Apps SDK pattern
// Reference: https://developers.openai.com/apps-sdk/build/mcp-server
// ============================================================================

import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { CatalogService } from "@/lib/services/catalog-service";

const getAppsSdkCompatibleHtml = async (baseUrl: string, path: string) => {
  const result = await fetch(`${baseUrl}${path}`);
  return await result.text();
};

type ContentWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  description: string;
  widgetDomain: string;
};

function widgetMeta(widget: ContentWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": false,
    "openai/resultCanProduceWidget": true,
  } as const;
}

const handler = createMcpHandler(async (server) => {
  const catalogService = new CatalogService();

  // ========================================================================
  // Pricing Catalog Widget - Following official OpenAI MCP pattern
  // ========================================================================
  const pricingHtml = await getAppsSdkCompatibleHtml(baseURL, "/");
  const pricingWidget: ContentWidget = {
    id: "show_pricing",
    title: "Show Pricing Catalog",
    templateUri: "ui://widget/pricing-template.html",
    invoking: "Loading pricing catalog...",
    invoked: "Pricing catalog loaded",
    html: pricingHtml,
    description: "Displays service pricing catalog with interactive cards",
    widgetDomain: "https://nextjs.org/docs",
  };

  // Register resource (HTML template) - Official pattern
  server.registerResource(
    "pricing-widget",
    pricingWidget.templateUri,
    {
      title: pricingWidget.title,
      description: pricingWidget.description,
      mimeType: "text/html+skybridge", // Required: must be text/html+skybridge
      _meta: {
        "openai/widgetDescription": pricingWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge", // Required: must be text/html+skybridge
          text: `<html>${pricingWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": pricingWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": pricingWidget.widgetDomain,
          },
        },
      ],
    })
  );

  // Register tool - Official pattern
  // The tool returns structuredContent which becomes available in window.openai.toolOutput
  server.registerTool(
    pricingWidget.id,
    {
      title: pricingWidget.title,
      description:
        "Use this tool when users want to register a company, incorporate a business, or view company registration services and pricing. This tool displays an interactive pricing catalog with service cards showing different company registration options (e.g., USA Company Registration, state-specific incorporations). Extract the service name from the user's query (e.g., 'USA Company Registration', 'Company Incorporation', or specific state names like 'Delaware', 'California', 'New York'). If the user mentions a location or state, include it in the serviceName parameter.",
      inputSchema: {
        serviceName: z
          .string()
          .optional()
          .describe(
            "The service name to search for in the catalog. Examples: 'USA Company Registration', 'Company Incorporation', 'Delaware', 'California', 'New York', etc. Extract from user query. If user says 'register a company in USA', use 'USA Company Registration'. If user mentions a specific state, include it (e.g., 'Company Incorporation - Delaware'). If not provided, shows all company registration services."
          ),
      },
      _meta: widgetMeta(pricingWidget), // Links tool to resource via openai/outputTemplate
    },
    async ({ serviceName }) => {
      // Fetch catalog data
      const { catalog, error } = await catalogService.fetchCatalog();

      if (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching catalog: ${error}. Please check the API configuration.`,
            },
          ],
          structuredContent: {
            serviceName: serviceName || null,
            catalog: [],
            error: error,
          },
          _meta: widgetMeta(pricingWidget),
        };
      }

      // Filter by service name if provided (client-side filtering in widget)
      const filteredCatalog = serviceName
        ? catalog.filter((item) => {
            const searchTerm = serviceName.toLowerCase().trim();
            const serviceNameLower = item.service_name?.toLowerCase() || '';
            const variantNameLower = item.variant_name?.toLowerCase() || '';
            const categoryLower = item.category?.toLowerCase() || '';

            return (
              serviceNameLower.includes(searchTerm) ||
              variantNameLower.includes(searchTerm) ||
              categoryLower.includes(searchTerm)
            );
          })
        : catalog;

      // If no results found, provide helpful message
      if (filteredCatalog.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: serviceName
                ? `No services found matching "${serviceName}". Showing all available services.`
                : "No services available in the catalog.",
            },
          ],
          structuredContent: {
            serviceName: serviceName || null,
            catalog: catalog, // Return all items if filter yields no results
            count: catalog.length,
            message: serviceName ? "No matching services found, showing all" : "No services available",
          },
          _meta: widgetMeta(pricingWidget),
        };
      }

      // Return structuredContent - this becomes window.openai.toolOutput in the widget
      return {
        content: [
          {
            type: "text",
            text: `Found ${filteredCatalog.length} service(s)${serviceName ? ` matching "${serviceName}"` : ""}.`,
          },
        ],
        structuredContent: {
          serviceName: serviceName || null,
          catalog: filteredCatalog,
          count: filteredCatalog.length,
        },
        _meta: widgetMeta(pricingWidget),
      };
    }
  );
});

export const GET = handler;
export const POST = handler;
