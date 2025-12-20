/**
 * Maps variant names to location-based image URLs
 * Detects location keywords and returns appropriate stock images
 */

const locationImageMap: Record<string, string> = {
  // New York
  "new york": "https://media.istockphoto.com/id/525232662/photo/new-york-empire-state-building-and-statue-of-liberty.jpg?s=1024x1024&w=is&k=20&c=9DG3g3gB1-c01RKG-Iinsigts2CtEGAQE2HoXLOYOhM=",
  "ny": "https://media.istockphoto.com/id/1406960186/photo/the-skyline-of-new-york-city-united-states.jpg?s=1024x1024&w=is&k=20&c=m5cYGPJsDS6nTsxYucy6jlCj7flGliYw6Lf4Ftg0jQs=",
  "new york city": "https://media.istockphoto.com/id/1406960186/photo/the-skyline-of-new-york-city-united-states.jpg?s=1024x1024&w=is&k=20&c=m5cYGPJsDS6nTsxYucy6jlCj7flGliYw6Lf4Ftg0jQs=",

  // California / San Francisco
  "california": "https://media.istockphoto.com/id/1136437406/photo/san-francisco-skyline-with-oakland-bay-bridge-at-sunset-california-usa.jpg?s=1024x1024&w=is&k=20&c=_UuntG09XSAMDFr7E2AVukaN6MWV5jLtnsbSorf-csA=",
  "san francisco": "https://media.istockphoto.com/id/1136437406/photo/san-francisco-skyline-with-oakland-bay-bridge-at-sunset-california-usa.jpg?s=1024x1024&w=is&k=20&c=_UuntG09XSAMDFr7E2AVukaN6MWV5jLtnsbSorf-csA=",
  "sf": "https://media.istockphoto.com/id/1136437406/photo/san-francisco-skyline-with-oakland-bay-bridge-at-sunset-california-usa.jpg?s=1024x1024&w=is&k=20&c=_UuntG09XSAMDFr7E2AVukaN6MWV5jLtnsbSorf-csA=",
  "los angeles": "https://media.istockphoto.com/id/1136437406/photo/san-francisco-skyline-with-oakland-bay-bridge-at-sunset-california-usa.jpg?s=1024x1024&w=is&k=20&c=_UuntG09XSAMDFr7E2AVukaN6MWV5jLtnsbSorf-csA=",
  "la": "https://media.istockphoto.com/id/1136437406/photo/san-francisco-skyline-with-oakland-bay-bridge-at-sunset-california-usa.jpg?s=1024x1024&w=is&k=20&c=_UuntG09XSAMDFr7E2AVukaN6MWV5jLtnsbSorf-csA=",

  // Delaware
  "delaware": "https://media.istockphoto.com/id/1449046495/photo/chicago-river-and-cityscape.jpg?s=1024x1024&w=is&k=20&c=XyBkj-fVzvo0gbbt0Obf8qIhCpGofcC6bYbP2GSjk5g=",

  // Chicago
  "chicago": "https://media.istockphoto.com/id/1449046495/photo/chicago-river-and-cityscape.jpg?s=1024x1024&w=is&k=20&c=XyBkj-fVzvo0gbbt0Obf8qIhCpGofcC6bYbP2GSjk5g=",

  // Charleston
  "charleston": "https://media.istockphoto.com/id/1924853613/photo/charleston-south-carolina-usa-historic-cityscape.jpg?s=1024x1024&w=is&k=20&c=I8bgWkG76H3S_3QYUqF556Aif78HVVuHZQ3ebyOGBqc=",
  "south carolina": "https://media.istockphoto.com/id/1924853613/photo/charleston-south-carolina-usa-historic-cityscape.jpg?s=1024x1024&w=is&k=20&c=I8bgWkG76H3S_3QYUqF556Aif78HVVuHZQ3ebyOGBqc=",

  // USA (default for USA Company Registration)
  "usa": "https://media.istockphoto.com/id/1449046495/photo/chicago-river-and-cityscape.jpg?s=1024x1024&w=is&k=20&c=XyBkj-fVzvo0gbbt0Obf8qIhCpGofcC6bYbP2GSjk5g=",
  "united states": "https://media.istockphoto.com/id/1449046495/photo/chicago-river-and-cityscape.jpg?s=1024x1024&w=is&k=20&c=XyBkj-fVzvo0gbbt0Obf8qIhCpGofcC6bYbP2GSjk5g=",

  // Default fallback
  "default": "https://media.istockphoto.com/id/1449046495/photo/chicago-river-and-cityscape.jpg?s=1024x1024&w=is&k=20&c=XyBkj-fVzvo0gbbt0Obf8qIhCpGofcC6bYbP2GSjk5g=",
};

/**
 * Gets image URL based on variant name or service name
 * Searches for location keywords and returns matching image
 */
export function getVariantImageUrl(variantName?: string, serviceName?: string): string {
  const searchText = `${variantName || ""} ${serviceName || ""}`.toLowerCase();

  // Search for location keywords in order of specificity
  for (const [location, imageUrl] of Object.entries(locationImageMap)) {
    if (location !== "default" && searchText.includes(location)) {
      return imageUrl;
    }
  }

  // Return default image if no match found
  return locationImageMap.default;
}

