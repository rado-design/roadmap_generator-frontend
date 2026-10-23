import { apiClient } from "../../../shared/lib/axios";

export async function setResourceFavorite(resourceId: number, favorite: boolean) {
  if (favorite) {
    await apiClient.put(`api/v1/resources/${resourceId}/favorite`);
  } else {
    await apiClient.delete(`api/v1/resources/${resourceId}/favorite`);
  }
}
