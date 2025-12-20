import { NextResponse } from "next/server";
import { CatalogService } from "@/lib/services/catalog-service";

export async function POST(request: Request) {
  try {
    const catalogService = new CatalogService();
    const { catalog, error } = await catalogService.fetchCatalog();

    if (error) {
      return NextResponse.json(
        { error: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ catalog });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch catalog data" },
      { status: 500 }
    );
  }
}

