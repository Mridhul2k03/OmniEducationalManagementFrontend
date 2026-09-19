import { BaseApiClient, unwrapList } from "./client"

export class AcademicsService {
  constructor(private client: BaseApiClient) {}

  public async getYears(): Promise<any[]> {
    const res = await this.client.request<any>("/academics/years/")
    return unwrapList(res)
  }

  public async createYear(payload: any): Promise<any> {
    return this.client.request("/academics/years/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  public async updateYear(id: string, payload: any): Promise<any> {
    return this.client.request(`/academics/years/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  public async deleteYear(id: string): Promise<any> {
    return this.client.request(`/academics/years/${id}/`, {
      method: "DELETE",
    })
  }

  public async getCourses(): Promise<any[]> {
    const res = await this.client.request<any>("/academics/courses/")
    return unwrapList(res)
  }

  public async createCourse(payload: any): Promise<any> {
    return this.client.request("/academics/courses/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  public async updateCourse(id: string, payload: any): Promise<any> {
    return this.client.request(`/academics/courses/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  public async deleteCourse(id: string): Promise<any> {
    return this.client.request(`/academics/courses/${id}/`, {
      method: "DELETE",
    })
  }

  public async getClasses(): Promise<any[]> {
    const res = await this.client.request<any>("/academics/classes/")
    return unwrapList(res)
  }

  public async createClass(payload: any): Promise<any> {
    return this.client.request("/academics/classes/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  public async updateClass(id: string, payload: any): Promise<any> {
    return this.client.request(`/academics/classes/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  public async deleteClass(id: string): Promise<any> {
    return this.client.request(`/academics/classes/${id}/`, {
      method: "DELETE",
    })
  }

  public async getSections(): Promise<any[]> {
    const res = await this.client.request<any>("/academics/sections/")
    return unwrapList(res)
  }

  public async createSection(payload: any): Promise<any> {
    return this.client.request("/academics/sections/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  public async updateSection(id: string, payload: any): Promise<any> {
    return this.client.request(`/academics/sections/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  public async deleteSection(id: string): Promise<any> {
    return this.client.request(`/academics/sections/${id}/`, {
      method: "DELETE",
    })
  }

  public async getSubjects(): Promise<any[]> {
    const res = await this.client.request<any>("/academics/subjects/")
    return unwrapList(res)
  }

  public async createSubject(payload: any): Promise<any> {
    return this.client.request("/academics/subjects/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  public async updateSubject(id: string, payload: any): Promise<any> {
    return this.client.request(`/academics/subjects/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  public async deleteSubject(id: string): Promise<any> {
    return this.client.request(`/academics/subjects/${id}/`, {
      method: "DELETE",
    })
  }
}
