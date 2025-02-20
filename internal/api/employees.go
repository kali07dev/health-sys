package api

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services"
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
