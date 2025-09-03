package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/hopkali04/health-sys/internal/api"
	"github.com/hopkali04/health-sys/internal/middleware"
)

func SetupCorrectiveActionRoutes(app *fiber.App, correctiveActionHandler *api.CorrectiveActionHandler) {

	apiGroup := app.Group("/api/v1")

	apiGroup.Post("/actions/:id/evidence", middleware.AuthMiddleware(), correctiveActionHandler.CreateActionEvidenceWithAttachments)

	apiGroup.Get("/incidents/:incidentID/actions", correctiveActionHandler.GetCorrectiveActionsByIncidentID)
	apiGroup.Get("/incidents/:id/user", correctiveActionHandler.GetCorrectiveActionsByEmployeeID)
	apiGroup.Post("/actions", correctiveActionHandler.CreateCorrectiveAction)

	apiGroup.Get("/actions/:id", correctiveActionHandler.GetCorrectiveActionByID)
	apiGroup.Put("/actions/:id", middleware.AuthMiddleware(), correctiveActionHandler.UpdateCorrectiveAction)
	apiGroup.Post("/actions/:id/admin", middleware.AuthMiddleware(), correctiveActionHandler.AdminCompleteActionAndVerify)
	apiGroup.Delete("/actions/:id", correctiveActionHandler.DeleteCorrectiveAction)

	apiGroup.Post("/actions/:id/complete", middleware.AuthMiddleware(), correctiveActionHandler.LabelAsCompleted)
	apiGroup.Post("/actions/:id/verify", middleware.AuthMiddleware(), correctiveActionHandler.VerifyCompletion)

	apiGroup.Post("/actions/:id/extension", middleware.AuthMiddleware(), correctiveActionHandler.RequestExtension)

}
