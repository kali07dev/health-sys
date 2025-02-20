package schema

import (
	"fmt"

	"github.com/hopkali04/health-sys/internal/models"
)

// EmergencyContact represents the emergency contact information
type EmergencyContact struct {
	Name         string `json:"name"`
	Relationship string `json:"relationship"`
	Phone        string `json:"phone"`
}

// EmployeeResponse represents the employee data for the UI
type NewEmployeeResponse struct {
	FirstName        string            `json:"firstName"`
	LastName         string            `json:"lastName"`
	Department       string            `json:"department"`
	Position         string            `json:"position"`
	ContactNumber    string            `json:"contactNumber"`
	OfficeLocation   string            `json:"officeLocation"`
	EmergencyContact map[string]string `json:"emergencyContact"`
}

// UserResponse represents the user data for the UI
type NewUserResponse struct {
	ID       string            `json:"id"`
	Email    string            `json:"email"`
	Role     string            `json:"role"`
	Employee *EmployeeResponse `json:"employee,omitempty"`
}

// ToResponse converts a User model to a UserResponse
func ToEmployeeWithUserResponse(u *models.Employee) NewUserResponse {
	response := NewUserResponse{
		ID:    u.UserID.String(),
		Email: u.User.Email,
		Role:  u.Role, // Default role if no employee record exists
	}

	// If there's an associated employee record
	var emergencyContact map[string]string
	if u.EmergencyContact != nil {
		// Create a new map and convert all values to strings
		emergencyContact = make(map[string]string)
		jsonMap := *u.EmergencyContact
		for k, v := range jsonMap {
			emergencyContact[k] = fmt.Sprintf("%v", v)
		}
	}

	response.Employee = &EmployeeResponse{
		FirstName:        u.FirstName,
		LastName:         u.LastName,
		Department:       u.Department,
		Position:         u.Position,
		ContactNumber:    u.ContactNumber,
		OfficeLocation:   u.OfficeLocation,
		EmergencyContact: emergencyContact,
	}

	response.Role = u.Role // Use the employee's role if it exists

	return response
}

// ToResponseArray converts an array of User models to UserResponse array
func ToEmployeeWithUserResponseArray(details []models.Employee) []NewUserResponse {
	response := make([]NewUserResponse, len(details))
	for i, user := range details {
		response[i] = ToEmployeeWithUserResponse(&user)
	}
	return response
}

// Helper function to safely convert interface{} to string
func safeString(v interface{}) string {
	if v == nil {
		return ""
	}
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}
