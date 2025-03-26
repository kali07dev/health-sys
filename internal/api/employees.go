package api

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/hopkali04/health-sys/internal/utils"
)

type EmployeeHandler struct {
	employeeService *services.EmployeeService
}

func NewEmployeeHandler(employeeService *services.EmployeeService) *EmployeeHandler {
	return &EmployeeHandler{employeeService: employeeService}
}

// SearchEmployees handles the search request for employees
func (h *EmployeeHandler) SearchEmployees(c *fiber.Ctx) error {
	query := c.Query("query") // Get the search query from the URL query parameter
	if query == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "search query is required",
		})
	}

	// Call the service to search for employees
	employees, err := h.employeeService.SearchEmployees(c.Context(), query)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Return the list of employees
	return c.Status(fiber.StatusOK).JSON(schema.EmployeeToResponseArray(employees))
}

// CreateEmployee handles the creation of a new employee
func (h *EmployeeHandler) CreateEmployee(c *fiber.Ctx) error {
	var employee models.Employee
	if err := c.BodyParser(&employee); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request payload"})
	}

	if err := h.employeeService.CreateEmployee(c.Context(), &employee); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusCreated).JSON(employee)
}

// GetEmployee handles fetching an employee by ID
func (h *EmployeeHandler) GetEmployee(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID"})
	}

	employee, err := h.employeeService.GetEmployeeByID(c.Context(), id)
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Employee not found"})
	}

	return c.Status(http.StatusOK).JSON(employee)
}

// get employee details for profile editing without Id Parma
func (h *EmployeeHandler) GetEmployeeProfile(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		utils.LogError("Unauthorized access attempt", map[string]interface{}{
			"Get Employee Profile Details": "Get Employee Profile Details",
		})
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	userIDStr, ok := userID.(string)
	if !ok {
		utils.LogError("Invalid user ID format in context", map[string]interface{}{
			"userID": userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Invalid user ID format",
		})
	}

	employeeID, err := uuid.Parse(userIDStr)
	if err != nil {
		utils.LogError("Invalid employee ID format", map[string]interface{}{
			"employeeID": userIDStr,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid employee ID"})
	}
	emp, err := h.employeeService.GetEmployeeByUserID(employeeID)
	if err != nil {
		utils.LogError("Failed to fetch employee details", map[string]interface{}{
			"employeeID": employeeID,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to check user existence", "details": err.Error()})
	}

	employee, err := h.employeeService.GetEmployeeByID(c.Context(), emp.ID)
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Employee not found"})
	}

	return c.Status(http.StatusOK).JSON(schema.EmployeeProfileToResponse(employee))
}
func (h *EmployeeHandler) UpdateUserProfile(c *fiber.Ctx) error {
	// Get user ID from path parameters
	userID := c.Locals("userID")
	if userID == nil {
		utils.LogError("Unauthorized access attempt", map[string]interface{}{
			"Get Employee Profile Details": "Get Employee Profile Details",
		})
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	userIDStr, ok := userID.(string)
	if !ok {
		utils.LogError("Invalid user ID format in context", map[string]interface{}{
			"userID": userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Invalid user ID format",
		})
	}

	// Parse request body
	var req schema.ProfileUpateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"details": err.Error(),
		})
	}

	// Set the UserID from path parameter
	req.UserID = userIDStr

	// Validate request
	if req.FirstName == "" || req.LastName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "First name and last name are required",
		})
	}


	// Call the service
	err := h.employeeService.UpdateUserProfile(c.Context(), req)
	if err != nil {
		// Handle specific error types
		switch {
		case err.Error() == "user not found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
			})
		case err.Error() == "employee not found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Employee profile not found",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to update profile",
				"details": err.Error(),
			})
		}
	}

	return c.JSON(fiber.Map{
		"message": "Profile updated successfully",
	})
}
// UpdateEmployee handles updating an existing employee
func (h *EmployeeHandler) UpdateEmployee(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID"})
	}

	var employee models.Employee
	if err := c.BodyParser(&employee); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request payload"})
	}

	employee.ID = id
	if err := h.employeeService.UpdateEmployee(c.Context(), &employee); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusOK).JSON(employee)
}

// DeleteEmployee handles deleting an employee by ID
func (h *EmployeeHandler) DeleteEmployee(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID"})
	}

	if err := h.employeeService.DeleteEmployee(c.Context(), id); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusNoContent).Send(nil)
}

// ListEmployees handles listing all employees
func (h *EmployeeHandler) ListEmployees(c *fiber.Ctx) error {
	employees, err := h.employeeService.ListEmployees(c.Context())
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusOK).JSON(schema.ToEmployeeWithUserResponseArray(employees))
}
