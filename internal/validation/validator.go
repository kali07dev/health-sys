// validator.go
package validation

import (
	"encoding/json"
	"fmt"
	"reflect"
	"strings"

	"github.com/go-playground/validator"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/schema"
)

var validate *validator.Validate

func init() {
	validate = validator.New()

	// Register custom validation functions
	validate.RegisterValidation("uuid", validateUUID)
	validate.RegisterValidation("json", validateJSON)

	// Register struct level validation for password matching
	validate.RegisterStructValidation(passwordMatchValidator, schema.CreateUserWithEmployeeRequest{})
}

// ValidationError represents a field validation error
type ValidationError struct {
	Field   string      `json:"field"`
	Tag     string      `json:"tag"`
	Value   interface{} `json:"value"`
	Message string      `json:"message"`
}

// ValidateStruct validates a struct and returns formatted errors
func ValidateStruct(data interface{}) ([]ValidationError, error) {
	var errors []ValidationError

	err := validate.Struct(data)
	if err != nil {
		if validationErrors, ok := err.(validator.ValidationErrors); ok {
			for _, err := range validationErrors {
				var element ValidationError
				element.Field = strings.ToLower(err.Field())
				element.Tag = err.Tag()
				element.Value = err.Value()
				element.Message = getErrorMessage(err)
				errors = append(errors, element)
			}
			return errors, fmt.Errorf("validation failed")
		}
		return nil, err
	}
	return nil, nil
}

// ParseAndValidate parses the request body and validates the struct
func ParseAndValidate(ctx *fiber.Ctx, data interface{}) error {
	// Check Content-Type
	contentType := ctx.Get("Content-Type")
	if !strings.Contains(contentType, "application/json") {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid Content-Type",
			"details": "Expected application/json",
		})
	}

	// Get raw body for logging
	body := ctx.Body()
	fmt.Printf("Raw request body: %s\n", string(body))

	// Parse request body
	if err := ctx.BodyParser(data); err != nil {
		fmt.Printf("Body parsing error: %v\n", err)
		return err
	}

	// Log parsed data
	// fmt.Printf("Parsed data: %+v\n", data)

	// Validate struct
	validationErrors, err := ValidateStruct(data)
	if err != nil {
		// fmt.Printf("Validation errors: %+v\n", validationErrors)
		var msg string
		if validationErrors != nil {
			msg = fmt.Sprintf("Validation failed: %v", validationErrors)
		} else {
			msg = fmt.Sprintf("Internal validation error: %v", err)
		}
		return fmt.Errorf("%v: %s", validationErrors, msg)
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

func passwordMatchValidator(sl validator.StructLevel) {
	type passwordContainer interface {
		GetPassword() string
		GetConfirmPassword() string
	}

	if pwd, ok := sl.Current().Interface().(passwordContainer); ok {
		if pwd.GetPassword() != pwd.GetConfirmPassword() {
			sl.ReportError(pwd.GetConfirmPassword(), "confirm_password",
				"ConfirmPassword", "eqfield", "password")
		}
	}
}

// Helper function to get human-readable error messages
func getErrorMessage(err validator.FieldError) string {
	switch err.Tag() {
	case "required":
		return fmt.Sprintf("Field '%s' is required", err.Field())
	case "email":
		return "Invalid email address format"
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
	case "eqfield":
		return "Passwords do not match"
	default:
		return fmt.Sprintf("Failed validation on %s", err.Tag())
	}
}

// CustomValidator middleware for Fiber
func CustomValidator() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Add content type checking
		if c.Method() == "POST" || c.Method() == "PUT" {
			contentType := c.Get("Content-Type")
			if !strings.Contains(contentType, "application/json") {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error":   "Invalid Content-Type",
					"details": "Expected application/json",
				})
			}
		}

		c.Locals("validator", validate)
		return c.Next()
	}
}
