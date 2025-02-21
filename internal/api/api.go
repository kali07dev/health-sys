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

type SvcImpl struct {
	userService         *user.UserService
	incidentService     *services.IncidentService
	notificationService notification.Service
	dashboardService    dashboard.Service
	correctiveSVC       *services.CorrectiveActionService
}

func SetupRoutes(app *fiber.App, userService *user.UserService, incidentService *services.IncidentService,
	notificationService notification.Service, dashboardService dashboard.Service,
	correctiveSVC *services.CorrectiveActionService, attachSVC *services.AttachmentService, empSVC *services.EmployeeService) {

	incidentImpl := NewIncidentsHandler(incidentService, attachSVC, empSVC)
	correctiveActionHandler := NewCorrectiveActionHandler(correctiveSVC)
	userSVC := NewUserHandler(userService)
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
	app.Post("/api/auth/signup", userSVC.RegisterUser)
	app.Post("/api/auth/signup/bulk", userSVC.BulkRegisterUsers)

	app.Post("/api/auth/signup/employees", userSVC.RegisterUserWithEmployeeAcc)
	app.Post("/api/auth/signup/employees/bulk", userSVC.BulkRegisterUsersWithEmployeeAcc)

	app.Get("/api/users", middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"), userSVC.Getall)
	app.Post("/api/auth/login", userSVC.LoginUser)
	app.Get("/api/users/:id/details", middleware.AuthMiddleware(), userSVC.GetUser)
	app.Post("/api/users/:id/modify", middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"), userSVC.UpdateUserPassword)
	app.Delete("/api/users/:id", middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"), userSVC.DeleteUser)

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
		incidentImpl.CreateIncidentWithAttachments)
	app.Get("/api/v1/incidents", incidentImpl.ListIncidentsHandler)
	app.Post("/api/v1/incidents/:id/status", incidentImpl.UpdateIncidentStatusHandler)
	app.Get("/api/v1/incidents/:id/view", incidentImpl.GetIncidentHandler)
	app.Post("/api/v1/incidents/:id/assign", incidentImpl.AssignIncidentToUserHandler)

	// Corrective action routes
	// Define routes
	app.Get("/api/v1/incidents/:incidentID/actions", correctiveActionHandler.GetCorrectiveActionsByIncidentID)
	app.Post("/api/v1/actions", correctiveActionHandler.CreateCorrectiveAction)
	app.Get("/api/v1/actions/:id", correctiveActionHandler.GetCorrectiveActionByID)
	app.Put("/api/v1/actions/:id", correctiveActionHandler.UpdateCorrectiveAction)
	app.Delete("/api/v1/actions/:id", correctiveActionHandler.DeleteCorrectiveAction)

	// Notification routes

	// app.Get("/api/notifications", middleware.LoggingMiddleware(), middleware.AuthMiddleware(),
	// NewNotificationHandler(notificationService).GetNotifications)

	// Dashboard routes
	// app.Get("/api/dashboard", middleware.LoggingMiddleware(), middleware.AuthMiddleware(),
	// 	NewDashboardHandler(dashboardService).GetSummary)

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
	app.Get("/api/v1/employees/search", employeeHandler.SearchEmployees)
	app.Get("/employees/:id", employeeHandler.GetEmployee)
	app.Put("/employees/:id", employeeHandler.UpdateEmployee)
	app.Delete("/employees/:id", employeeHandler.DeleteEmployee)
	app.Get("/employees", employeeHandler.ListEmployees)
	app.Get("/api/v1/users/employees", middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"), employeeHandler.ListEmployees)

}
func SetupInvestigationRoutes(app *fiber.App, handler *InvestigationHandler) {

	api := app.Group("/api/v1/investigations")

	api.Get("/", handler.GetAll)
	api.Get("/:id", handler.GetByID)
	api.Get("/incident/:incidentId", handler.GetByIncidentID)
	api.Post("/", handler.Create)
	api.Put("/:id", handler.Update)
	api.Delete("/:id", handler.Delete)
}
func SetupRoleRoutes(app *fiber.App, roleHandler *RoleHandler) {
	app.Post("/employees/:id/assign-role", roleHandler.AssignRole)
}
func SetupDepartmentRoutes(app *fiber.App, handler *DepartmentHandler) {
	api := app.Group("/api/v1/departments")

	api.Post("/", handler.Create)
	api.Post("/update", handler.Update)
	api.Get("/", handler.GetAll)
}

// Setup routes for the dashboard
func SetupDashboardRoutes(app *fiber.App, handler *SafetyDashboardHandler) {
	api := app.Group("/api/v1")

	// Employee dashboard routes
	api.Get("/dashboard/employee/:employeeID", handler.GetEmployeeDashboard)

	// Admin dashboard routes
	api.Get("/dashboard/admin", handler.GetAdminDashboard)
}

func SetupReportsRoutes(app *fiber.App, reportHandler *ReportHandler) {
	// API middleware
	api := app.Group("/api/v1/reports")

	// api.Use(middleware.AuthMiddleware)

	api.Post("/generate", reportHandler.GenerateReport)
	api.Post("/download", reportHandler.DownloadReport)
}
func SetupNotificationRoutes(app *fiber.App, handler *NotificationHandler) {
	notifications := app.Group("/api/v1/notifications", middleware.AuthMiddleware())

	// User notifications
	notifications.Get("/user/:userId", handler.GetUserNotifications)
	
	// System notifications (admin/safety officer only)
	notifications.Get("/system", middleware.RoleMiddleware("admin", "safety_officer"), 
		handler.GetSystemNotifications)
	
	// Mark as read
	notifications.Put("/:id/read", handler.MarkAsRead)
}

func SetupNotificationSettingsRoutes(app *fiber.App, handler *NotificationSettingsHandler) {
	settings := app.Group("/api/notification-settings", middleware.AuthMiddleware())
	
	settings.Get("/:userId", handler.GetSettings)
	settings.Put("/:userId", handler.UpdateSettings)
}
