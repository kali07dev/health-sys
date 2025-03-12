package api

import (
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
)
func (h *CorrectiveActionHandler) VerifyCompletion(c *fiber.Ctx) error {
	// Parse action ID from request params
	actionIDStr := c.Params("id")
	if actionIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "action ID is required"})
	}

	// Convert action ID to UUID
	actionID, err := uuid.Parse(actionIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid action ID format"})
	}

	// Get the currently authenticated user's ID (verifier)
	verifierID := c.Locals("userID")
	if verifierID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	// Convert verifier ID to UUID
	verifierIDStr, ok := verifierID.(string)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": verifierID})
	}

	uuidVerifierID, err := uuid.Parse(verifierIDStr)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": verifierID})
	}
	emp, err := h.CorrectiveActionservice.GetEmployeeByUserID(uuidVerifierID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to check user existence", "details": err.Error()})
	}

	// Call the service method to verify completion
	if err := h.CorrectiveActionservice.VerifyCompletion(c.Context(), actionID, emp.ID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "action verified successfully"})
}
func (h *CorrectiveActionHandler) GetActionEvidenceByCorrectiveActionID(c *fiber.Ctx) error {
	// Parse corrective action ID from request params
	correctiveActionIDStr := c.Params("correctiveActionID")
	if correctiveActionIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "corrective action ID is required"})
	}

	// Convert string to UUID
	correctiveActionID, err := uuid.Parse(correctiveActionIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid corrective action ID format"})
	}

	// Fetch evidence by corrective action ID
	evidences, err := h.CorrectiveActionservice.GetActionEvidenceByCorrectiveActionID(correctiveActionID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(evidences)
}
func (h *CorrectiveActionHandler) GetActionEvidenceByID(c *fiber.Ctx) error {
	// Parse evidence ID from request params
	evidenceIDStr := c.Params("id")
	if evidenceIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "evidence ID is required"})
	}

	// Convert string to UUID
	evidenceID, err := uuid.Parse(evidenceIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid evidence ID format"})
	}

	// Fetch evidence by ID
	evidence, err := h.CorrectiveActionservice.GetActionEvidenceByID(evidenceID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(evidence)
}

func (h *CorrectiveActionHandler) CreateActionEvidenceWithAttachments(c *fiber.Ctx) error {

	actionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid action ID format",
		})
	}
	// Parse evidence data from form
	evidenceDataStr := c.FormValue("evidenceData")
	if evidenceDataStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "evidence data is required"})
	}

	var req schema.CreateActionEvidenceDTO
	if err := json.Unmarshal([]byte(evidenceDataStr), &req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid evidence data format", "details": err.Error()})
	}

	// Get the currently authenticated user's ID
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	// Handle file upload
	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "failed to parse form"})
	}

	files := form.File["attachments"]
	if len(files) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "no files uploaded"})
	}

	// Process all files
	var uploadedFiles []*multipart.FileHeader
	for _, file := range files {
		// Validate file type
		if !isAllowedFileType(file.Filename) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid file type",
				"file":  file.Filename,
			})
		}
		uploadedFiles = append(uploadedFiles, file)
	}

	if len(uploadedFiles) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "no valid files uploaded"})
	}

	// Type assertion for userID
	userIDStr, ok := userID.(string)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": userID})
	}

	userIDSesh, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": userID})
	}
	emp, err:= h.CorrectiveActionservice.GetEmployeeByUserID(userIDSesh)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "cannot find associated employeeID"})
	}
	uuidUserID := emp.ID

	// Parse ActionID from request

	// actionID, err := uuid.Parse(req.ActionID)
	// if err != nil {
	// 	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid action ID format"})
	// }

	// Save files and create evidence records
	for _, file := range uploadedFiles {
		// Generate file URL (e.g., save to storage and get the URL)
		fileURL, err := saveFileToStorage(file, actionID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to save file", "details": err.Error()})
		}

		// Create evidence record
		evidence := &models.ActionEvidence{
			CorrectiveActionID: actionID,
			FileType:           req.FileType,
			FileName:           file.Filename,
			FileURL:            fileURL,
			UploadedBy:         uuidUserID,
			Description:        req.Description,
		}

		if err := h.CorrectiveActionservice.CreateActionEvidence(evidence); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create evidence record", "details": err.Error()})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "evidence created successfully"})
}

func saveFileToStorage(file *multipart.FileHeader, actionID uuid.UUID) (string, error) {
	// Define storage path
	filename := filepath.Base(file.Filename)
	storagePath := fmt.Sprintf("uploads/actions/%s/%s", actionID, filename)

	// Create directory if it doesn't exist
	if err := os.MkdirAll(filepath.Dir(storagePath), 0755); err != nil {
		return "", fmt.Errorf("failed to create directory: %w", err)
	}

	// Open and save the file
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer src.Close()

	dst, err := os.Create(storagePath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	if _, err = io.Copy(dst, src); err != nil {
		return "", fmt.Errorf("failed to save file: %w", err)
	}

	// Return the file URL (e.g., relative path or full URL)
	return storagePath, nil
}

func isAllowedFileTypes(filename string) bool {
	allowedTypes := []string{".jpg", ".jpeg", ".png", ".pdf", ".mp4"}
	ext := strings.ToLower(filepath.Ext(filename))
	for _, t := range allowedTypes {
		if ext == t {
			return true
		}
	}
	return false
}
