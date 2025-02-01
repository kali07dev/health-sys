package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/hopkali04/health-sys/internal/api"
	"github.com/hopkali04/health-sys/internal/config"
	"github.com/hopkali04/health-sys/internal/db"
	"github.com/hopkali04/health-sys/internal/jobs"
	"github.com/hopkali04/health-sys/internal/middleware"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/hopkali04/health-sys/internal/services/dashboard"
	"github.com/hopkali04/health-sys/internal/services/incident"
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
	utils.InitLogger(cfg.Logging.Level, cfg.Logging.Format)

	// Connect to database
	dbConn, err := db.ConnectDB(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto-migrate models
	if err := dbConn.AutoMigrate(dbConn); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	log.Println("Database migration completed successfully!")

	// Initialize services
	userRepo := user.NewRepository(dbConn)
	IncidentRepo := incident.NewRepository(dbConn)
	NotiRepo := notification.NewRepository(dbConn)
	DashRepo := dashboard.NewRepository(dbConn)

	userService := user.NewService(userRepo)
	NewIncidentHandler := incident.NewService(IncidentRepo)
	NewNotificationHandler := notification.NewService(NotiRepo)
	NewDashboardHandler := dashboard.NewService(DashRepo)

	// New Ideal services
	// employeeService := services.NewEmployeeService(db)
	// roleService := services.NewRoleService(db)

	// employeeHandler := api.NewEmployeeHandler(employeeService)
	// roleHandler := api.NewRoleHandler(roleService)

	// Create Fiber app
	app := fiber.New()

	// Start reminder job
	emailService := services.NewEmailService(cfg.SMTP.Host, cfg.SMTP.Port, cfg.SMTP.Username, cfg.SMTP.Password)
	notificationService := services.NewNotificationService(dbConn, emailService)
	go jobs.StartReminderJob(notificationService)

	// Setup routes
	api.SetupRoutes(app, userService, NewIncidentHandler, NewNotificationHandler, NewDashboardHandler)
	// Middleware
	app.Use(middleware.LoggingMiddleware())

	// Start server
	log.Fatal(app.Listen(":3000"))

	// Log messages with fields
	utils.LogInfo("Application started", map[string]interface{}{
		"version": "1.0.0",
		"env":     "development",
	})
}
