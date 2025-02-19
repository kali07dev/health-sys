package validation

import (
	"encoding/json"
	"fmt"
	"reflect"
	"strings"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

var validate *validator.Validate

func init() {
	validate = validator.New()
	
	// Register custom validation functions
	validate.RegisterValidation("uuid", validateUUID)
	validate.RegisterValidation("json", validateJSON)
}

// ValidationError represents a field validation error
type ValidationError struct {
	Field   string      `json:"field"`
	Tag     string      `json:"tag"`
	Value   interface{} `json:"value"`
	Message string      `json:"message"`
}

// ValidateStruct validates a struct and returns formatted errors
func ValidateStruct(data interface{}) []ValidationError {
	var errors []ValidationError

	err := validate.Struct(data)
	if err != nil {
		for _, err := range err.(validator.ValidationErrors) {
			var element ValidationError
			element.Field = strings.ToLower(err.Field())
			element.Tag = err.Tag()
			element.Value = err.Value()
			element.Message = getErrorMessage(err)
			errors = append(errors, element)
		}
	}
	return errors
}

// ParseAndValidate parses the request body and validates the struct
func ParseAndValidate(ctx *fiber.Ctx, data interface{}) error {
	// Parse request body
	if err := ctx.BodyParser(data); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"details": err.Error(),
		})
	}

	// Validate struct
	if errors := ValidateStruct(data); len(errors) > 0 {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Validation failed",
			"details": errors,
		})
	}

	return nil
}

// Custom validation functions
func validateUUID(fl validator.FieldLevel) bool {
	field := fl.Field()
	if field.Kind() == reflect.String {
		_, err := uuid.Parse(field.String())
		return err == nil
	}
	return false
}

func validateJSON(fl validator.FieldLevel) bool {
	field := fl.Field()
	if field.Kind() == reflect.String {
		var js json.RawMessage
		return json.Unmarshal([]byte(field.String()), &js) == nil
	}
	return false
}

// Helper function to get human-readable error messages
func getErrorMessage(err validator.FieldError) string {
	switch err.Tag() {
	case "required":
		return "This field is required"
	case "email":
		return "Invalid email address"
	case "min":
		return fmt.Sprintf("Must be at least %s characters long", err.Param())
	case "max":
		return fmt.Sprintf("Must not be longer than %s characters", err.Param())
	case "uuid":
		return "Invalid UUID format"
	case "json":
		return "Invalid JSON format"
	case "oneof":
		return fmt.Sprintf("Must be one of: %s", err.Param())
	default:
		return fmt.Sprintf("Failed validation on %s", err.Tag())
	}
}

// CustomValidator middleware for Fiber
func CustomValidator() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Store validator in context for reuse
		c.Locals("validator", validate)
		return c.Next()
	}
}