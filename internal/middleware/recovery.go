package middleware

import (
	"fmt"
	"runtime/debug"

	"github.com/gofiber/fiber/v2"
)

// RecoveryConfig holds the configuration for the Recovery middleware
type RecoveryConfig struct {
	// EnableDetailedErrors determines if we should return stack traces and detailed error info
	// Set this to true in development and false in production
	EnableDetailedErrors bool
}

// DefaultRecoveryConfig returns the default config for Recovery middleware
// By default, it enables detailed errors for safety (assuming development environment)
func DefaultRecoveryConfig() RecoveryConfig {
	return RecoveryConfig{
		EnableDetailedErrors: true, // Default to detailed errors (development mode)
	}
}

// Recovery middleware recovers from panics and prevents the server from crashing
func Recovery(config ...RecoveryConfig) fiber.Handler {
	// Set default config
	cfg := DefaultRecoveryConfig()
	
	// Override with custom config if provided
	if len(config) > 0 {
		cfg = config[0]
	}

	// Return middleware handler
	return func(c *fiber.Ctx) error {
		// Wrap the handler in a recovery function
		defer func() {
			if r := recover(); r != nil {
				err := fmt.Errorf("panic recovered: %v", r)
				
				// Log the error and stack trace when detailed errors are enabled
				if cfg.EnableDetailedErrors {
					stackTrace := debug.Stack()
					fmt.Printf("--------------------\n")
					fmt.Printf("[PANIC RECOVERED] %v\n%s\n", err, stackTrace)
					fmt.Printf("--------------------\n")
				}
				
				// Set status code
				statusCode := fiber.StatusInternalServerError
				
				// Send appropriate response based on configuration
				if cfg.EnableDetailedErrors {
					// When detailed errors are enabled, send error information
					_ = c.Status(statusCode).JSON(fiber.Map{
						"error":      "Internal Server Error",
						"message":    fmt.Sprintf("%v", r),
						"stackTrace": string(debug.Stack()),
					})
				} else {
					// Otherwise, only send generic error message
					_ = c.Status(statusCode).JSON(fiber.Map{
						"error": "Internal Server Error",
					})
				}
			}
		}()
		
		// Continue with the next handler
		return c.Next()
	}
}