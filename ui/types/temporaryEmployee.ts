export interface TemporaryEmployee {
  ID: number
  FirstName: string
  LastName: string
  Department: string
  Position: string
  ContactNumber: string
  OfficeLocation: string
  IsActive: boolean
  CreatedAt: string
  UpdatedAt: string
  DeletedAt: string | null
}

export interface CreateTemporaryEmployeeRequest {
  FirstName: string
  LastName: string
  Department?: string
  Position?: string
  ContactNumber?: string
  OfficeLocation?: string
  IsActive?: boolean
}

export interface UpdateTemporaryEmployeeRequest {
  FirstName?: string
  LastName?: string
  Department?: string
  Position?: string
  ContactNumber?: string
  OfficeLocation?: string
  IsActive?: boolean
}

export interface SearchCriteria {
  FirstName?: string
  LastName?: string
  Department?: string
  Position?: string
  OfficeLocation?: string
  IsActive?: boolean
}