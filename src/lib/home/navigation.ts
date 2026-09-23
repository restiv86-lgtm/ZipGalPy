export const homeFeatureRoutes = {
  items: "items",
  repairs: "repairs",
  schedule: "schedules",
  schedules: "schedules",
  expenses: "expenses",
  contracts: "contracts",
  documents: "documents",
} as const;

export type HomeFeature = keyof typeof homeFeatureRoutes;

export function selectOwnedHomeId(homes: { id: string }[], requestedHomeId?: string) {
  if (requestedHomeId && homes.some((home) => home.id === requestedHomeId)) {
    return requestedHomeId;
  }

  return homes.length === 1 ? homes[0].id : null;
}

export function homeFeatureHref(feature: HomeFeature, homeId: string | null) {
  return homeId ? `/homes/${homeId}/${homeFeatureRoutes[feature]}` : `/dashboard/${feature}`;
}
