import { fetchWithAuth } from './userAPI'
import { TemporaryEmployee, CreateTemporaryEmployeeRequest, UpdateTemporaryEmployeeRequest, SearchCriteria } from '@/types/temporaryEmployee'


export const temporaryEmployeeService = {
  async getEmployees(){
    return fetchWithAuth('/temporary-employees/get/all')
  },

  async createEmployee(employee: CreateTemporaryEmployeeRequest): Promise<TemporaryEmployee> {
    return fetchWithAuth('/temporary-employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employee),
      })
    //   if (!response.ok) {
    //     throw new Error('Failed to create employee')
    //   }
    //   return await response.json()
    // } catch (error) {
    //   console.error('Error creating employee:', error)
    //   throw error
    // }
  },

  async updateEmployee(employee: UpdateTemporaryEmployeeRequest & { ID: number }): Promise<TemporaryEmployee> {
    return fetchWithAuth(`/temporary-employees/${employee.ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employee),
      })
    //   if (!response.ok) {
    //     throw new Error('Failed to update employee')
    //   }
    //   return await response.json()
    // } catch (error) {
    //   console.error('Error updating employee:', error)
    //   throw error
    // }
  },

  async deactivateEmployee(id: number){
    return fetchWithAuth(`/temporary-employees/${id}/deactivate`, {
        method: 'POST',
      })
    //   if (!response.ok) {
    //     throw new Error('Failed to deactivate employee')
    //   }
    // } catch (error) {
    //   console.error('Error deactivating employee:', error)
    //   throw error
    // }
  },

  async reactivateEmployee(id: number){
    return fetchWithAuth(`/temporary-employees/${id}/activate`, {
        method: 'POST',
      })
    //   if (!response.ok) {
    //     throw new Error('Failed to reactivate employee')
    //   }
    // } catch (error) {
    //   console.error('Error reactivating employee:', error)
    //   throw error
    // }
  },

  async searchEmployees(criteria: SearchCriteria): Promise<TemporaryEmployee[]> {
    try {
      const params = new URLSearchParams()
      if (criteria.FirstName) params.append('firstName', criteria.FirstName)
      if (criteria.LastName) params.append('lastName', criteria.LastName)
      if (criteria.Department) params.append('department', criteria.Department)
      if (criteria.Position) params.append('position', criteria.Position)
      if (criteria.OfficeLocation) params.append('officeLocation', criteria.OfficeLocation)
      if (criteria.IsActive !== undefined) params.append('isActive', criteria.IsActive.toString())

      const response = await fetchWithAuth(`/temporary-employees/search?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to search employees')
      }
      return await response.json()
    } catch (error) {
      console.error('Error searching employees:', error)
      throw error
    }
  }
}