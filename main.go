package main

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
	"github.com/hopkali04/health-sys/internal/services/notification"
	"github.com/hopkali04/health-sys/internal/services/user"
	"github.com/hopkali04/health-sys/internal/utils"
)

func main() {
	// Load config
	cfg, err := config.LoadConfig("config.yaml")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize logger
	// utils.InitLogger(cfg.Logging.Level, cfg.Logging.Format)
	utils.InitLogger(cfg.Logging.Level, cfg.Logging.Format, cfg.Logging.File, cfg.Sentry.DSN)

	// Connect to database
	dbConn, err := db.ConnectDB(cfg)
	utils.LogInfo("Application started", map[string]interface{}{
		"version": "1.0.0",
		"env":     "development",
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto-migrate models
	// if err := db.AutoMigrate(dbConn); err != nil {
	// 	log.Fatalf("Failed to migrate database: %v", err)
	// }

	log.Println("Database migration completed successfully!")

	// Initialize services
	// userRepo := user.NewRepository(dbConn)
	// IncidentRepo := incident.NewRepository(dbConn)
	NotiRepo := notification.NewRepository(dbConn)
	DashRepo := dashboard.NewRepository(dbConn)

	userService := user.NewUserService(dbConn)
	// NewIncidentHandler := incident.NewService(IncidentRepo)
	NewIncidentHandler := services.NewIncidentService(dbConn)
	NewNotificationHandler := notification.NewService(NotiRepo)
	NewDashboardHandler := dashboard.NewService(DashRepo)
	NewCorrectiveActionHandler := services.NewCorrectiveActionService(dbConn)
	EmployeeSVC := services.NewEmployeeService(dbConn)
	EmpHandler := api.NewEmployeeHandler(EmployeeSVC)
	NewInvestigationHandler := services.NewInvestigationService(dbConn)
	InvHandler := api.NewInvestigationHandler(NewInvestigationHandler)

	// New Ideal services
	// employeeService := services.NewEmployeeService(db)
	// roleService := services.NewRoleService(db)

	// employeeHandler := api.NewEmployeeHandler(employeeService)
	// roleHandler := api.NewRoleHandler(roleService)

	// Create Fiber app
	app := fiber.New()
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000",
		AllowCredentials: true, // This is crucial for cookies
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
	}))
	app.Use(middleware.LoggingMiddleware())

	// Start reminder job
	emailService := services.NewEmailService(cfg.SMTP.Host, cfg.SMTP.Port, cfg.SMTP.Username, cfg.SMTP.Password, cfg.SMTP.UseTLS)
	notificationService, err := services.NewNotificationService(dbConn, emailService)
	if err != nil {
		log.Fatalf("Failed to initialize notification service: %v", err)
	}
	go jobs.StartReminderJob(notificationService, emailService)

	// Setup routes
	api.SetupRoutes(app, userService, NewIncidentHandler, NewNotificationHandler, NewDashboardHandler, NewCorrectiveActionHandler)
	api.SetupEmployeeRoutes(app, EmpHandler)
	api.SetupInvestigationRoutes(app, InvHandler)
	// Middleware

	// Log messages with fields
	utils.LogInfo("Application started", map[string]interface{}{
		"version": "1.0.0",
		"env":     "development",
	})

	// Start server
	log.Fatal(app.Listen(":8000"))

}
