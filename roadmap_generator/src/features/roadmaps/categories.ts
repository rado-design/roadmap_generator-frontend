import type { RoadmapCategory } from "./api/generateRoadmap";
import type { RoadmapCategoryGroup } from "./api/listRoadmaps";

export const ROADMAP_CATEGORY_OPTIONS: { value: RoadmapCategory; label: string }[] = [
  { value: "programming", label: "Développement" },
  { value: "marketing_sales", label: "Marketing" },
  { value: "project_management", label: "Produit" },
  { value: "ux_ui_design", label: "Design" },
  { value: "other", label: "Autre domaine" },
];

/** Adaptation temporaire aux filtres de ressources qui attendent encore un groupe. */
export const ROADMAP_CATEGORY_GROUPS: Record<RoadmapCategory, RoadmapCategoryGroup> = {
  programming: "tech",
  mobile_dev: "tech",
  marketing_sales: "business",
  project_management: "business",
  ux_ui_design: "tech",
  other: "other",
};
