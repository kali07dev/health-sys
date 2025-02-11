package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/hopkali04/health-sys/internal/middleware"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/hopkali04/health-sys/internal/services/dashboard"
	// "github.com/hopkali04/health-sys/internal/services/incident"
	"github.com/hopkali04/health-sys/internal/services/notification"
	"github.com/hopkali04/health-sys/internal/services/user"
)

func SetupRoutes(app *fiber.App, userService *user.UserService, incidentService *services.IncidentService, notificationService notification.Service, dashboardService dashboard.Service) {
	
	app.Get("/api/me", middleware.AuthMiddleware(), func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"user": fiber.Map{
				"id":   c.Locals("userID"),
				"role": c.Locals("role"),
			},
		})
	})
	app.Post("/auth/logout", func(c *fiber.Ctx) error {
		c.ClearCookie("auth-token")
		return c.JSON(fiber.Map{"message": "Logged out"})
	})
	
	// User routes
	app.Post("/api/auth/signup", NewUserHandler(userService).RegisterUser)
	app.Get("/api/user", middleware.AuthMiddleware(), NewUserHandler(userService).Getall)
	app.Post("/api/auth/login", middleware.LoggingMiddleware(), NewUserHandler(userService).LoginUser)
	app.Get("/api/users/:id", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), NewUserHandler(userService).GetUser)
	app.Post("/api/users/:id/modify", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"), NewUserHandler(userService).UpdateUserPassword)
	app.Delete("/api/users/:id", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"), NewUserHandler(userService).DeleteUser)

	// Incident routes
	// app.Post("/api/incidents", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.PermissionMiddleware(middleware.PermissionCreateIncidents),
	// 	NewIncidentHandler(incidentService).CreateIncident)
	// app.Get("/api/incidents/:id", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.PermissionMiddleware(middleware.PermissionReadIncidents),
	// 	NewIncidentHandler(incidentService).GetIncident)
	// app.Put("/api/incidents/:id", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.PermissionMiddleware(middleware.PermissionManageIncidents),
	// 	NewIncidentHandler(incidentService).UpdateIncident)
	// app.Delete("/api/incidents/:id", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.PermissionMiddleware(middleware.PermissionManageIncidents),
	// 	NewIncidentHandler(incidentService).DeleteIncident)

	app.Post("/api/v1/incidents/with-attachments", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.PermissionMiddleware(middleware.PermissionCreateIncidents),
		NewIncidentsHandler(incidentService).CreateIncidentWithAttachments)

	// Notification routes

	// app.Get("/api/notifications", middleware.LoggingMiddleware(), middleware.AuthMiddleware(),
		// NewNotificationHandler(notificationService).GetNotifications)

	// Dashboard routes
	app.Get("/api/dashboard", middleware.LoggingMiddleware(), middleware.AuthMiddleware(),
		NewDashboardHandler(dashboardService).GetSummary)

	/////////
	// Admin-only route
	app.Post("/api/users", middleware.AuthMiddleware(), middleware.RoleMiddleware(middleware.RoleAdmin),
		NewUserHandler(userService).RegisterUser)

	// Manager and Admin route
	//app.Get("/api/reports", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.RoleMiddleware(middleware.RoleManager, middleware.RoleAdmin), GetReportsHandler)

	// Employee, Manager, and Admin route
	//app.Get("/api/incidents", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.RoleMiddleware(middleware.RoleEmployee, middleware.RoleManager, middleware.RoleAdmin), GetIncidentsHandler)
}

func SetupEmployeeRoutes(app *fiber.App, employeeHandler *EmployeeHandler) {
	app.Post("/employees", employeeHandler.CreateEmployee)
	app.Get("/employees/:id", employeeHandler.GetEmployee)
	app.Put("/employees/:id", employeeHandler.UpdateEmployee)
	app.Delete("/employees/:id", employeeHandler.DeleteEmployee)
	app.Get("/employees", employeeHandler.ListEmployees)
}
func SetupRoleRoutes(app *fiber.App, roleHandler *RoleHandler) {
	app.Post("/employees/:id/assign-role", roleHandler.AssignRole)
}
