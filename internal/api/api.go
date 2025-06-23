package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/hopkali04/health-sys/internal/middleware"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/hopkali04/health-sys/internal/services/dashboard"

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
	app.Post("/api/auth/google/signup", userSVC.VerifyAccount)
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
	userRoutes.Put("/:userId/role", middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"), userSVC.UpdateUserRole)

	// Route for updating user information
	userRoutes.Put("/:userId", middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"), userSVC.UpdateUser)

	// Route for updating user status (active/inactive)
	userRoutes.Put("/:userId/status", middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"), userSVC.UpdateUserStatus)

	apiIncidents := app.Group("/api/v1")
	// apiIncidents.Use(middleware.AuthMiddleware)

	apiIncidents.Post("/incidents/with-attachments", middleware.AuthMiddleware(), middleware.PermissionMiddleware(middleware.PermissionCreateIncidents), incidentImpl.CreateIncidentWithAttachments)
	apiIncidents.Post("/incidents", middleware.AuthMiddleware(), middleware.PermissionMiddleware(middleware.PermissionCreateIncidents), incidentImpl.CreateIncident)
	apiIncidents.Get("/incidents", incidentImpl.ListIncidentsHandler)
	apiIncidents.Get("/incidents/closed", incidentImpl.ListClosedIncidentsHandler)
	apiIncidents.Post("/incidents/:id/status", incidentImpl.UpdateIncidentStatusHandler)
	apiIncidents.Get("/incidents/:id/view", incidentImpl.GetIncidentHandler)
	apiIncidents.Post("/incidents/:id/update", incidentImpl.UpdateIncidentHandler)
	apiIncidents.Post("/incidents/:id/assign", incidentImpl.AssignIncidentToUserHandler)
	apiIncidents.Get("/incidents/:id/summary", incidentImpl.GetIncidentSummary)
	apiIncidents.Get("/incidents/employee/:id", incidentImpl.GetIncidentsByEmployeeID)
	apiIncidents.Get("/incidents/employee/:employeeID/closed", incidentImpl.GetClosedIncidentsByEmployeeIDHandler)

	apiIncidents.Post("/incidents/:id/close", middleware.AuthMiddleware(), middleware.PermissionMiddleware(middleware.PermissionManageIncidents), incidentImpl.CloseIncidentHandler)

	app.Post("/api/v1/actions/:id/evidence", middleware.AuthMiddleware(), correctiveActionHandler.CreateActionEvidenceWithAttachments)

	// Corrective action routes
	// Define routes
	app.Get("/api/v1/incidents/:incidentID/actions", correctiveActionHandler.GetCorrectiveActionsByIncidentID)
	app.Get("/api/v1/incidents/:id/user", correctiveActionHandler.GetCorrectiveActionsByEmployeeID)
	app.Post("/api/v1/actions", correctiveActionHandler.CreateCorrectiveAction)
	app.Get("/api/v1/actions/:id", correctiveActionHandler.GetCorrectiveActionByID)
	app.Put("/api/v1/actions/:id", middleware.AuthMiddleware(), correctiveActionHandler.UpdateCorrectiveAction)
	app.Post("/api/v1/actions/:id/admin", middleware.AuthMiddleware(), correctiveActionHandler.AdminCompleteActionAndVerify)
	app.Delete("/api/v1/actions/:id", correctiveActionHandler.DeleteCorrectiveAction)

	app.Post("/api/v1/actions/:id/complete", middleware.AuthMiddleware(), correctiveActionHandler.LabelAsCompleted)
	app.Post("/api/v1/actions/:id/verify", middleware.AuthMiddleware(), correctiveActionHandler.VerifyCompletion)

	// Admin-only route
	app.Post("/api/users", middleware.AuthMiddleware(), middleware.RoleMiddleware(middleware.RoleAdmin),
		userSVC.RegisterUser)

}

func SetupEmployeeRoutes(app *fiber.App, employeeHandler *EmployeeHandler) {
	apiEmp := app.Group("/api/v1")
	apiEmp.Post("/employees", employeeHandler.CreateEmployee)
	apiEmp.Get("/employees/search", employeeHandler.SearchEmployees)
	apiEmp.Get("/employees/:id", employeeHandler.GetEmployee)
	apiEmp.Get("/profile/employee", middleware.AuthMiddleware(), employeeHandler.GetEmployeeProfile)
	apiEmp.Put("/employees/:id", middleware.AuthMiddleware(), employeeHandler.UpdateEmployee)
	apiEmp.Post("/employees/profile/update", middleware.AuthMiddleware(), employeeHandler.UpdateUserProfile)
	apiEmp.Delete("/employees/:id", employeeHandler.DeleteEmployee)
	apiEmp.Get("/employees", employeeHandler.ListEmployees)
	apiEmp.Get("/users/employees", middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"), employeeHandler.ListEmployees)

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

func SetupTemporaryEmployeeRoutes(app *fiber.App, employeeHandler *TemporaryEmployeeHandler) {

	employeeRoutes := app.Group("/api/temporary-employees")
	{
		employeeRoutes.Post("/", employeeHandler.CreateEmployee)
		employeeRoutes.Get("/", employeeHandler.SearchEmployees)
		employeeRoutes.Get("/search/with-temporarly", employeeHandler.SearchAllEmployees)
		employeeRoutes.Get("/get/all", employeeHandler.ListEmployees)
		employeeRoutes.Get("/:id", employeeHandler.GetEmployee)
		employeeRoutes.Put("/:id", employeeHandler.UpdateEmployee)
		employeeRoutes.Delete("/:id", employeeHandler.DeleteEmployee)
		employeeRoutes.Post("/:id/deactivate", employeeHandler.DeActivateEmployee)
		employeeRoutes.Post("/:id/activate", employeeHandler.ActivateEmployee)
	}
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

// RegisterRoutes registers the routes for VPC resources
func SetupVpcRoutes(app *fiber.App, h *VPCHandler) {
	vpcGroup := app.Group("/api/v1/vpcs")
	vpcGroup.Post("/", middleware.AuthMiddleware(), h.CreateVPC)
	vpcGroup.Post("/with-attachments", middleware.AuthMiddleware(), h.CreateVPCWithAttachments)
	vpcGroup.Post("/bulk", middleware.AuthMiddleware(), h.CreateBulkVPCs)
	vpcGroup.Get("/", middleware.AuthMiddleware(), h.ListAllVPCs)
	vpcGroup.Get("/:id", middleware.AuthMiddleware(), h.GetVPC)
	vpcGroup.Get("/number/:vpcNumber", middleware.AuthMiddleware(), h.GetVPCByNumber)
	vpcGroup.Put("/:id", middleware.AuthMiddleware(), h.UpdateVPC)
	vpcGroup.Delete("/:id", middleware.AuthMiddleware(), h.DeleteVPC)
	vpcGroup.Get("/department/:department", middleware.AuthMiddleware(), h.ListByDepartment)
	vpcGroup.Get("/type/:vpcType", middleware.AuthMiddleware(), h.ListByVpcType)
}

func SetupVpcReports(app *fiber.App, h *VPCReportHandler) {
	// Single VPC Reports
	vpcReportGroup := app.Group("/api/v1/vpcs/reports/:id") // Group by :id
	vpcReportGroup.Get("/preview", h.GetVPCReportPreview)
	vpcReportGroup.Get("/pdf", h.GetVPCReportPDF)
	vpcReportGroup.Get("/html", h.GetVPCReportHTML)

	// Summary Reports (New Group)
	summaryReportGroup := app.Group("/api/v1/vpc/reports/summary")
	summaryReportGroup.Get("/preview", h.GetSummaryReportPreview)
	summaryReportGroup.Get("/download", h.GetSummaryReportDownload) // For PDF/HTML full download
}
