package api

import (
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services"

	"github.com/gofiber/fiber/v2"
)

type TemporaryEmployeeHandler struct {
	services *services.TemporaryEmployeeService
}

func NewTemporaryEmployeeHandler(services *services.TemporaryEmployeeService) *TemporaryEmployeeHandler {
	return &TemporaryEmployeeHandler{services: services}
}

func (h *TemporaryEmployeeHandler) CreateEmployee(c *fiber.Ctx) error {
	var request schema.CreateTemporaryEmployeeRequest
	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	employee := models.TemporaryEmployee{
		FirstName:      request.FirstName,
		LastName:       request.LastName,
		Department:     request.Department,
		Position:       request.Position,
		ContactNumber:  request.ContactNumber,
		OfficeLocation: request.OfficeLocation,
		IsActive:       request.IsActive,
	}

	if err := h.services.Create(&employee); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create employee",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(employee)
}

func (h *TemporaryEmployeeHandler) GetEmployee(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid employee ID",
		})
	}

	employee, err := h.services.GetByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Employee not found",
		})
	}

	return c.JSON(employee)
}

func (h *TemporaryEmployeeHandler) UpdateEmployee(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid employee ID",
		})
	}

	var request schema.UpdateTemporaryEmployeeRequest
	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	employee, err := h.services.Update(id, &request)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update employee",
		})
	}

	return c.JSON(employee)
}

func (h *TemporaryEmployeeHandler) DeleteEmployee(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid employee ID",
		})
	}

	if err := h.services.Delete(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete employee",
		})
	}

	return c.SendStatus(fiber.StatusOK)
}
func (h *TemporaryEmployeeHandler) DeActivateEmployee(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid employee ID",
		})
	}
	action := "deactivate"

	if err := h.services.StatusChange(id, action); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to deactivate employee",
		})
	}

	 return c.JSON(fiber.Map{
        "message": "Employee De-activated successfully",
    })
}
func (h *TemporaryEmployeeHandler) ActivateEmployee(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid employee ID",
		})
	}
	action := "activate"

	if err := h.services.StatusChange(id, action); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to deactivate employee",
		})
	}

	 return c.JSON(fiber.Map{
        "message": "Employee activated successfully",
    })
}


func (h *TemporaryEmployeeHandler) SearchEmployees(c *fiber.Ctx) error {
	var criteria schema.SearchCriteria
	if err := c.QueryParser(&criteria); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid search criteria",
		})
	}

	employees, err := h.services.Search(criteria)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to search employees",
		})
	}

	return c.JSON(employees)
}
func (h *TemporaryEmployeeHandler) SearchAllEmployees(c *fiber.Ctx) error {
	query := c.Query("query") // Get the search query from the URL query parameter
	if query == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "search query is required",
		})
	}

	employees, err := h.services.SearchAllEmployees(c.Context(), query)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to search employees",
		})
	}
	
	return c.JSON(employees)
}
func (h *TemporaryEmployeeHandler) ListEmployees(c *fiber.Ctx) error {
	employees, err := h.services.GetAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve employees",
		})
	}

	return c.JSON(employees)
}