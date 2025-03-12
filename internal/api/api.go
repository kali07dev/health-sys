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

func SetupRoutes(app *fiber.App, userSVC *UserHandler, incidentService *services.IncidentService,
	notificationService *services.NotificationService, dashboardService dashboard.Service,
	correctiveSVC *services.CorrectiveActionService, attachSVC *services.AttachmentService, empSVC *services.EmployeeService) {

	incidentImpl := NewIncidentsHandler(incidentService, attachSVC, empSVC)
	correctiveActionHandler := NewCorrectiveActionHandler(correctiveSVC, notificationService)
	app.Get("/api/me", middleware.AuthMiddleware(), func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"user": fiber.Map{
				"id":   c.Locals("userID"),
				"role": c.Locals("role"),
			},
		})
	})

	app.Post("/api/auth/login", userSVC.LoginUser)
	app.Post("/api/auth/logout", userSVC.LogoutUser)
	app.Post("/api/auth/verify", userSVC.VerifyAccount)
	app.Post("/api/auth/reset-password/request", userSVC.RequestPasswordReset)
	app.Post("/api/auth/reset-password/complete", userSVC.CompletePasswordReset)

	// app.Post("/auth/logout", func(c *fiber.Ctx) error {
	// 	c.ClearCookie("auth-token")
	// 	return c.JSON(fiber.Map{"message": "Logged out"})
	// })

	// User routes
	app.Post("/api/auth/signup", userSVC.RegisterUserWithEmployeeAcc)
	app.Post("/api/auth/signup/bulk", userSVC.BulkRegisterUsers)

	app.Post("/api/auth/signup/employees", userSVC.RegisterUserWithEmployeeAcc)
	app.Post("/api/auth/signup/employees/bulk", userSVC.BulkRegisterUsersWithEmployeeAcc)

	app.Get("/api/users", middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"), userSVC.Getall)
	app.Get("/api/users/:id/details", middleware.AuthMiddleware(), userSVC.GetUser)
	app.Post("/api/users/:id/modify", middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"), userSVC.UpdateUserPassword)
	app.Delete("/api/users/:id", middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"), userSVC.DeleteUser)

	// User routes group
	userRoutes := app.Group("/api/users")
	
	// Apply auth middleware to all user routes
	// userRoutes.Use(middleware.AuthMiddleware)

	// Route for updating user role
	userRoutes.Put("/:userId/role",  middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"), userSVC.UpdateUserRole)
	
	// Route for updating user information
	userRoutes.Put("/:userId",  middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"), userSVC.UpdateUser)
	
	// Route for updating user status (active/inactive)
	userRoutes.Put("/:userId/status",  middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"), userSVC.UpdateUserStatus)

	// Incident routes
	// app.Post("/api/incidents", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.PermissionMiddleware(middleware.PermissionCreateIncidents),
	// 	NewIncidentHandler(incidentService).CreateIncident)
	// app.Get("/api/incidents/:id", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.PermissionMiddleware(middleware.PermissionReadIncidents),
	// 	NewIncidentHandler(incidentService).GetIncident)
	// app.Put("/api/incidents/:id", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.PermissionMiddleware(middleware.PermissionManageIncidents),
	// 	NewIncidentHandler(incidentService).UpdateIncident)
	// app.Delete("/api/incidents/:id", middleware.LoggingMiddleware(), middleware.AuthMiddleware(), middleware.PermissionMiddleware(middleware.PermissionManageIncidents),
	// 	NewIncidentHandler(incidentService).DeleteIncident)

	apiIncidents := app.Group("/api/v1")
	// apiIncidents.Use(middleware.AuthMiddleware)

	apiIncidents.Post("/incidents/with-attachments", middleware.AuthMiddleware(), middleware.PermissionMiddleware(middleware.PermissionCreateIncidents), incidentImpl.CreateIncidentWithAttachments)
	apiIncidents.Post("/incidents", middleware.PermissionMiddleware(middleware.PermissionCreateIncidents), incidentImpl.CreateIncident)
	apiIncidents.Get("/incidents", incidentImpl.ListIncidentsHandler)
	apiIncidents.Post("/incidents/:id/status", incidentImpl.UpdateIncidentStatusHandler)
	apiIncidents.Get("/incidents/:id/view", incidentImpl.GetIncidentHandler)
	apiIncidents.Post("/incidents/:id/assign", incidentImpl.AssignIncidentToUserHandler)
	apiIncidents.Get("/incidents/:id/summary", incidentImpl.GetIncidentSummary)
	apiIncidents.Get("/incidents/employee/:id", incidentImpl.GetIncidentsByEmployeeID)


	apiIncidents.Post("/incidents/:id/close", middleware.AuthMiddleware(),middleware.PermissionMiddleware(middleware.PermissionManageIncidents), incidentImpl.CloseIncidentHandler)

	app.Post("/api/v1/actions/:id/evidence", middleware.AuthMiddleware(), correctiveActionHandler.CreateActionEvidenceWithAttachments)


	// Corrective action routes
	// Define routes
	app.Get("/api/v1/incidents/:incidentID/actions", correctiveActionHandler.GetCorrectiveActionsByIncidentID)
	app.Get("/api/v1/incidents/:id/user", correctiveActionHandler.GetCorrectiveActionsByEmployeeID)
	app.Post("/api/v1/actions", correctiveActionHandler.CreateCorrectiveAction)
	app.Get("/api/v1/actions/:id", correctiveActionHandler.GetCorrectiveActionByID)
	app.Put("/api/v1/actions/:id", middleware.AuthMiddleware(), correctiveActionHandler.UpdateCorrectiveAction)
	app.Delete("/api/v1/actions/:id", correctiveActionHandler.DeleteCorrectiveAction)

	app.Post("/api/v1/actions/:id/complete", correctiveActionHandler.LabelAsCompleted)
	app.Post("/api/v1/actions/:id/verify", correctiveActionHandler.VerifyCompletion)

	// Notification routes

	// app.Get("/api/notifications", middleware.LoggingMiddleware(), middleware.AuthMiddleware(),
	// NewNotificationHandler(notificationService).GetNotifications)

	// Dashboard routes
	// app.Get("/api/dashboard", middleware.LoggingMiddleware(), middleware.AuthMiddleware(),
	// 	NewDashboardHandler(dashboardService).GetSummary)

	/////////
	// Admin-only route
	app.Post("/api/users", middleware.AuthMiddleware(), middleware.RoleMiddleware(middleware.RoleAdmin),
		userSVC.RegisterUser)

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
	api.Get("/:id/employee", handler.GetAllByEmployeeID)
	api.Get("/incident/:incidentId", handler.GetByIncidentID)
	api.Post("/", handler.Create)
	api.Put("/:id", handler.Update)
	api.Delete("/:id", handler.Delete)
	api.Post("/:id/close", handler.CloseInvestigation)
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

func SetupInterViewRoutes(app *fiber.App, handler *InterviewHandler) {
    interview := app.Group("/api/v1/interview", middleware.AuthMiddleware())

    // Route to schedule an interview
    interview.Post("/schedule", handler.ScheduleInterviewHandler)

    // Route to update the status of an interview
    interview.Put("/:id/status", handler.UpdateInterviewStatus)

    // Route to get details of a specific interview
    interview.Get("/:id", handler.GetInterviewDetails)

    // Route to get evidence details for a specific interview
    interview.Get("/:id/evidence", handler.GetEvidenceDetails)
}
