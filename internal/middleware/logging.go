package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/hopkali04/health-sys/internal/utils"
)

func LoggingMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		utils.LogInfo("Request received", map[string]interface{}{
			"method": c.Method(),
			"path":   c.Path(),
			"ip":     c.IP(),
		})
		return c.Next()
	}
}
