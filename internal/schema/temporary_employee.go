package schema


type CreateTemporaryEmployeeRequest struct {
	FirstName      string `json:"firstName" validate:"required"`
	LastName       string `json:"lastName" validate:"required"`
	Department     string `json:"department"`
	Position       string `json:"position"`
	ContactNumber  string `json:"contactNumber"`
	OfficeLocation string `json:"officeLocation"`
	IsActive       bool   `json:"isActive"`
}

type UpdateTemporaryEmployeeRequest struct {
	FirstName      string `json:"firstName"`
	LastName       string `json:"lastName"`
	Department     string `json:"department"`
	Position       string `json:"position"`
	ContactNumber  string `json:"contactNumber"`
	OfficeLocation string `json:"officeLocation"`
	IsActive       *bool  `json:"isActive"`
}

type SearchCriteria struct {
	FirstName      string `query:"firstName"`
	LastName       string `query:"lastName"`
	Department     string `query:"department"`
	Position       string `query:"position"`
	OfficeLocation string `query:"officeLocation"`
	IsActive       *bool  `query:"isActive"`
}