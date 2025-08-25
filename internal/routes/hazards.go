package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/hopkali04/health-sys/internal/api"
	"github.com/hopkali04/health-sys/internal/middleware"
)

func SetupHazardRoutes(app *fiber.App, h *api.HazardHandler) {
	hazardGroup := app.Group("/api/v1/hazards")
	hazardGroup.Post("/", middleware.AuthMiddleware(), h.CreateHazard)
	hazardGroup.Get("/", middleware.AuthMiddleware(), h.ListHazards)
	hazardGroup.Get("/:id", middleware.AuthMiddleware(), h.GetHazard)
	hazardGroup.Put("/:id", middleware.AuthMiddleware(), h.UpdateHazard)
	hazardGroup.Delete("/:id", middleware.AuthMiddleware(), h.DeleteHazard)
	hazardGroup.Post("/:id/assign", middleware.AuthMiddleware(), h.AssignHazard)
}
