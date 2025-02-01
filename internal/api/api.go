package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/hopkali04/health-sys/internal/middleware"
	"github.com/hopkali04/health-sys/internal/services/dashboard"
	"github.com/hopkali04/health-sys/internal/services/incident"
	"github.com/hopkali04/health-sys/internal/services/notification"
	"github.com/hopkali04/health-sys/internal/services/user"
)

func SetupRoutes(app *fiber.App, userService user.Service, incidentService incident.Service, notificationService notification.Service, dashboardService dashboard.Service) {
	// User routes
	app.Post("/api/users", middleware.LoggingMiddleware(), NewUserHandler(userService).RegisterUser)
	app.Post("/api/login", middleware.LoggingMiddleware(), NewUserHandler(userService).LoginUser)
	app.Get("/api/users/:id", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), NewUserHandler(userService).GetUser)
	app.Put("/api/users/:id", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"), NewUserHandler(userService).UpdateUser)
	app.Delete("/api/users/:id", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"), NewUserHandler(userService).DeleteUser)

	// Incident routes
	app.Post("/api/incidents", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.PermissionMiddleware(middleware.PermissionCreateIncidents),
		NewIncidentHandler(incidentService).CreateIncident)
	app.Get("/api/incidents/:id", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.PermissionMiddleware(middleware.PermissionReadIncidents),
		NewIncidentHandler(incidentService).GetIncident)
	app.Put("/api/incidents/:id", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.PermissionMiddleware(middleware.PermissionManageIncidents),
		NewIncidentHandler(incidentService).UpdateIncident)
	app.Delete("/api/incidents/:id", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.PermissionMiddleware(middleware.PermissionManageIncidents),
		NewIncidentHandler(incidentService).DeleteIncident)

	// Notification routes
	app.Get("/api/notifications", middleware.LoggingMiddleware(), middleware.AuthMiddleware(),
		NewNotificationHandler(notificationService).GetNotifications)

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
