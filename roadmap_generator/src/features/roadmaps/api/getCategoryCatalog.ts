import { apiClient } from "../../../shared/lib/axios";

export interface CategoryGroup { value: string; label: string }
export interface CategoryOption extends CategoryGroup { group: string }
export interface CategoryCatalog { groups: CategoryGroup[]; items: CategoryOption[] }

export async function getCategoryCatalog() {
  const response = await apiClient.get<CategoryCatalog>("api/v1/categories");
  return response.data;
}
