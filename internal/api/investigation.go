package api

import (
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/log"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services"
)

type InvestigationHandler struct {
	Service         *services.InvestigationService
	NotificationSVC *services.NotificationService
}

func NewInvestigationHandler(svc *services.InvestigationService, notifySVC *services.NotificationService) *InvestigationHandler {
	return &InvestigationHandler{
		Service:         svc,
		NotificationSVC: notifySVC,
	}
}

func (h *InvestigationHandler) GetAllByEmployeeID(c *fiber.Ctx) error {
	// Parse the employee ID from the request parameters
	employeeID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid employee ID",
		})
	}
	emp, err := h.Service.GetEmployeeByUserID(employeeID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to check user existence", "details": err.Error()})
	}

	// Call the service method to get all investigations for the employee
	investigations, err := h.Service.GetAllByEmployeeID(emp.ID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve investigations",
		})
	}

	response := schema.ConvertToInvestigationResponses(investigations)
	return c.Status(http.StatusOK).JSON(response)
}

// GetAll Investigations
func (h *InvestigationHandler) GetAll(c *fiber.Ctx) error {

	status := c.Query("status", "")
	limit, _ := strconv.Atoi(c.Query("limit", "0"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	investigations, err := h.Service.GetAll(status, limit, offset)
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	response := schema.ConvertToInvestigationResponses(investigations)
	return c.Status(http.StatusOK).JSON(response)
}

// GetByIncidentID
func (h *InvestigationHandler) GetByIncidentID(c *fiber.Ctx) error {
	incidentID, err := uuid.Parse(c.Params("incidentId"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid incident ID"})
	}

	investigation, err := h.Service.FullGetByIncidentID(c.Context(), incidentID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	// response := schema.ConvertToInvestigationResponse(investigation)
	return c.Status(http.StatusOK).JSON(investigation)
}

// GetByID
func (h *InvestigationHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid investigation ID"})
	}

	investigation, err := h.Service.FullGetByID(c.Context(), id)
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	// response := schema.ConvertToInvestigationResponse(investigation)
	return c.Status(http.StatusOK).JSON(investigation)
}

// Create
func (h *InvestigationHandler) Create(c *fiber.Ctx) error {
	var form schema.InvestigationForm
	if err := c.BodyParser(&form); err != nil {
		log.Info(err)
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err})
	}

	investigation, err := h.Service.Create(&form)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	// send Investigator Email

	err = h.NotificationSVC.NotifyInvestigationLeader(investigation)
	if err != nil {
		log.Info("DB error, failed to find User Details", err)
	}
	return c.Status(http.StatusCreated).JSON(investigation)
}

// Update
func (h *InvestigationHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid investigation ID"})
	}

	var form schema.FlexibleInvestigationForm

	if err := c.BodyParser(&form); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	investigation, err := h.Service.Update(id, &form)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	response := schema.ConvertToInvestigationResponse(investigation)
	return c.Status(http.StatusOK).JSON(response)
}

// Delete
func (h *InvestigationHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid investigation ID"})
	}

	if err := h.Service.Delete(id); err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusOK).JSON(fiber.Map{"message": "Investigation deleted successfully"})
}

func (h *InvestigationHandler) CloseInvestigation(c *fiber.Ctx) error {
	// Parse the investigation ID from the request
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid investigation ID",
		})
	}

	// Call the service method to close the investigation
	if err := h.Service.CloseInvestigation(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Return success response
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Investigation closed successfully",
	})
}
