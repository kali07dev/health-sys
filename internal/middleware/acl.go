package middleware

import (
	"github.com/gofiber/fiber/v2"
)

// HasPermission checks if the user's role has the required permission
func HasPermission(role string, requiredPermission string) bool {
	permissions, exists := RolePermissions[role]
	if !exists {
		return false
	}

	for _, permission := range permissions {
		if permission == requiredPermission {
			return true
		}
	}
	return false
}

// PermissionMiddleware enforces access control based on permissions
func PermissionMiddleware(requiredPermission string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		roleInterface := c.Locals("role")
		if roleInterface == nil {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Forbidden: Role information not found",
			})
		}

		userRole, ok := roleInterface.(string)
		if !ok {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Internal Server Error: Invalid role format",
			})
		}

		if !HasPermission(userRole, requiredPermission) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Forbidden: You do not have the required permission",
			})
		}

		return c.Next()
	}
}

// RoleMiddleware enforces access control based on roles
func RoleMiddleware(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole := c.Locals("role").(string)

		for _, allowedRole := range allowedRoles {
			if userRole == allowedRole {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Forbidden: You do not have the required role",
		})
	}
}
