// cmd/cli/server.go
package cli

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/hopkali04/health-sys/internal/api"
	"github.com/hopkali04/health-sys/internal/config"
	"github.com/hopkali04/health-sys/internal/db"
	"github.com/hopkali04/health-sys/internal/jobs"
	"github.com/hopkali04/health-sys/internal/middleware"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/hopkali04/health-sys/internal/services/dashboard"
	"github.com/hopkali04/health-sys/internal/services/token"
	"github.com/hopkali04/health-sys/internal/services/user"
	"github.com/hopkali04/health-sys/internal/services/reports"
	"github.com/hopkali04/health-sys/internal/utils"
)

func RunServer() {
	// Load config
	cfg, err := config.LoadConfig("config.yaml")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize logger
	utils.InitLogger(cfg.Logging.Level, cfg.Logging.Format, cfg.Logging.File, cfg.Sentry.DSN)

	// Connect to database
	dbConn, err := db.ConnectDB(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize repositories and services
	// NotiRepo := notification.NewRepository(dbConn)
	DashRepo := dashboard.NewRepository(dbConn)

	NewIncidentHandler := services.NewIncidentService(dbConn)
	// NewNotificationHandler := notification.NewService(NotiRepo)
	NewDashboardHandler := dashboard.NewService(DashRepo)
	NewCorrectiveActionHandler := services.NewCorrectiveActionService(dbConn)

	NewDepartmentHandler := services.NewDepartmentService(dbConn)
	DepHandler := api.NewDepartmentHandler(NewDepartmentHandler)

	AttachmentSVC := services.NewAttachmentService(dbConn)

	dashboardService := services.NewSafetyDashboardService(dbConn)
	NewSafetyDashboardHandler := api.NewSafetyDashboardHandler(dashboardService)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		// Disable the default error handler to prevent default error pages
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			// Log the error
			log.Printf("Error: %v", err)

			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}

			// Send JSON response
			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})
	app.Use(middleware.Recovery())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORS.AllowedOrigins,
		AllowCredentials: cfg.CORS.AllowCredentials,
		AllowHeaders:     cfg.CORS.AllowedHeaders,
		AllowMethods:     cfg.CORS.AllowedMethods,
	}))
	app.Use(middleware.LoggingMiddleware())

	// Serve static files from the "uploads" directory
	app.Static("/uploads", "./uploads")

	// Middleware to restrict access to uploads
	app.Use("/uploads", func(c *fiber.Ctx) error {
		// Check if the user is authenticated
		userID := c.Locals("userID")
		if userID == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
		}

		// Proceed to serve the file
		return c.Next()
	})
	// app.Use(validation.CustomValidator())

	// Start reminder job
	emailService := services.NewEmailService(cfg.SMTP.Host, cfg.SMTP.Port, cfg.SMTP.Username, cfg.SMTP.Password, false)
	notificationService, err := services.NewNotificationService(dbConn, emailService)
	if err != nil {
		log.Fatalf("Failed to initialize notification service: %v", err)
	}

	VerSvc := user.NewVerificationService(dbConn, emailService, token.NewTokenService(), cfg.Web.Domain)
	userService := user.NewUserService(dbConn, VerSvc)
	userHandler := api.NewUserHandler(userService, VerSvc)

	EmployeeSVC := services.NewEmployeeService(dbConn, emailService)
	EmpHandler := api.NewEmployeeHandler(EmployeeSVC)

	NewInvestigationHandler := services.NewInvestigationService(dbConn)
	InvHandler := api.NewInvestigationHandler(NewInvestigationHandler, notificationService)

	reportH := api.NewReportHandler(services.NewReportService(dbConn))

	notificationHandler := api.NewNotificationHandler(notificationService, userService)

	notifySettings := api.NewNotificationSettingsHandler(services.NewNotificationSettingsService(dbConn))

	vpc_svc := services.NewVPCService(dbConn, emailService)
	vpcHandler := api.NewVPCHandler(vpc_svc)

	vpcReportHandler := api.NewVPCReportHandler(reports.NewVPCReportService(dbConn))
	
	employeeService := services.NewTemporaryEmployeeService(dbConn)
	tempEmplHandler := api.NewTemporaryEmployeeHandler(employeeService)

	go jobs.StartReminderJob(notificationService, emailService)

	// Setup routes
	api.SetupRoutes(app, userHandler, NewIncidentHandler, notificationService, NewDashboardHandler, NewCorrectiveActionHandler, AttachmentSVC, EmployeeSVC)
	api.SetupEmployeeRoutes(app, EmpHandler)
	api.SetupInvestigationRoutes(app, InvHandler)
	api.SetupDepartmentRoutes(app, DepHandler)
	api.SetupDashboardRoutes(app, NewSafetyDashboardHandler)
	api.SetupNotificationRoutes(app, notificationHandler)
	api.SetupVpcRoutes(app, vpcHandler)
	api.SetupNotificationSettingsRoutes(app, notifySettings)
	api.SetupVpcReports(app, vpcReportHandler)
	api.SetupTemporaryEmployeeRoutes(app, tempEmplHandler)

	api.SetupReportsRoutes(app, reportH)
	app.Get("/panic", func(c *fiber.Ctx) error {
		panic("This is a test panic!")
	})
	// Log startup
	utils.LogInfo("Application started", map[string]interface{}{
		"version": "1.0.0",
		"env":     "development",
	})

	// Start server
	log.Fatal(app.Listen(":8000"))
}
