import { request } from "./client"
import type { InstanceGroupTemplate } from "./types"

export const instanceGroupTemplatesApi = {
  async list(): Promise<InstanceGroupTemplate[]> {
    const response = await request<{ data: InstanceGroupTemplate[] }>("/instance-group-templates")
    return response.data || []
  },

  async getById(id: string): Promise<InstanceGroupTemplate> {
    const response = await request<{ data: InstanceGroupTemplate }>(`/instance-group-templates/${id}`)
    return response.data
  },

  async getBySlug(slug: string): Promise<InstanceGroupTemplate> {
    const response = await request<{ data: InstanceGroupTemplate }>(`/instance-group-templates/by-slug/${slug}`)
    return response.data
  },
}
