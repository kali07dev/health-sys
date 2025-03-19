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
	"github.com/hopkali04/health-sys/internal/utils"
)

func (h *CorrectiveActionHandler) VerifyCompletion(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to verify completion of corrective action", map[string]interface{}{
		"path": c.Path(),
		"id":   c.Params("id"),
	})

	actionIDStr := c.Params("id")
	if actionIDStr == "" {
		utils.LogError("Missing action ID in request", map[string]interface{}{
			"error": "action ID is required",
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "action ID is required"})
	}

	actionID, err := uuid.Parse(actionIDStr)
	if err != nil {
		utils.LogError("Invalid action ID format", map[string]interface{}{
			"actionID": actionIDStr,
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid action ID format"})
	}

	verifierID := c.Locals("userID")
	if verifierID == nil {
		utils.LogError("Unauthorized access attempt", map[string]interface{}{
			"actionID": actionID,
		})
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	verifierIDStr, ok := verifierID.(string)
	if !ok {
		utils.LogError("Invalid user ID format", map[string]interface{}{
			"actionID": actionID,
			"userID":   verifierID,
			"error":    "failed to assert user ID type",
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": verifierID})
	}

	uuidVerifierID, err := uuid.Parse(verifierIDStr)
	if err != nil {
		utils.LogError("Failed to parse verifier ID", map[string]interface{}{
			"actionID": actionID,
			"userID":   verifierIDStr,
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": verifierID})
	}

	utils.LogDebug("Fetching employee details for verifier", map[string]interface{}{
		"verifierID": uuidVerifierID,
	})

	emp, err := h.CorrectiveActionservice.GetEmployeeByUserID(uuidVerifierID)
	if err != nil {
		utils.LogError("Failed to fetch employee details", map[string]interface{}{
			"verifierID": uuidVerifierID,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to check user existence", "details": err.Error()})
	}

	utils.LogDebug("Verifying completion of corrective action", map[string]interface{}{
		"actionID":   actionID,
		"verifierID": emp.ID,
	})

	if err := h.CorrectiveActionservice.VerifyCompletion(c.Context(), actionID, emp.ID); err != nil {
		utils.LogError("Failed to verify completion", map[string]interface{}{
			"actionID":   actionID,
			"verifierID": emp.ID,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully verified completion of corrective action", map[string]interface{}{
		"actionID":   actionID,
		"verifierID": emp.ID,
	})
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "action verified successfully"})
}

func (h *CorrectiveActionHandler) GetActionEvidenceByCorrectiveActionID(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to fetch evidence by corrective action ID", map[string]interface{}{
		"path":               c.Path(),
		"correctiveActionID": c.Params("correctiveActionID"),
	})

	correctiveActionIDStr := c.Params("correctiveActionID")
	if correctiveActionIDStr == "" {
		utils.LogError("Missing corrective action ID in request", map[string]interface{}{
			"error": "corrective action ID is required",
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "corrective action ID is required"})
	}

	correctiveActionID, err := uuid.Parse(correctiveActionIDStr)
	if err != nil {
		utils.LogError("Invalid corrective action ID format", map[string]interface{}{
			"correctiveActionID": correctiveActionIDStr,
			"error":              err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid corrective action ID format"})
	}

	utils.LogDebug("Fetching evidence by corrective action ID", map[string]interface{}{
		"correctiveActionID": correctiveActionID,
	})

	evidences, err := h.CorrectiveActionservice.GetActionEvidenceByCorrectiveActionID(correctiveActionID)
	if err != nil {
		utils.LogError("Failed to fetch evidence", map[string]interface{}{
			"correctiveActionID": correctiveActionID,
			"error":              err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully retrieved evidence", map[string]interface{}{
		"correctiveActionID": correctiveActionID,
		"count":              len(evidences),
	})
	return c.Status(fiber.StatusOK).JSON(evidences)
}

func (h *CorrectiveActionHandler) GetActionEvidenceByID(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to fetch evidence by ID", map[string]interface{}{
		"path": c.Path(),
		"id":   c.Params("id"),
	})

	evidenceIDStr := c.Params("id")
	if evidenceIDStr == "" {
		utils.LogError("Missing evidence ID in request", map[string]interface{}{
			"error": "evidence ID is required",
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "evidence ID is required"})
	}

	evidenceID, err := uuid.Parse(evidenceIDStr)
	if err != nil {
		utils.LogError("Invalid evidence ID format", map[string]interface{}{
			"evidenceID": evidenceIDStr,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid evidence ID format"})
	}

	utils.LogDebug("Fetching evidence by ID", map[string]interface{}{
		"evidenceID": evidenceID,
	})

	evidence, err := h.CorrectiveActionservice.GetActionEvidenceByID(evidenceID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			utils.LogError("Evidence not found", map[string]interface{}{
				"evidenceID": evidenceID,
			})
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		}
		utils.LogError("Failed to fetch evidence", map[string]interface{}{
			"evidenceID": evidenceID,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully retrieved evidence", map[string]interface{}{
		"evidenceID": evidence.ID,
	})
	return c.Status(fiber.StatusOK).JSON(evidence)
}

func (h *CorrectiveActionHandler) CreateActionEvidenceWithAttachments(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to create evidence with attachments", map[string]interface{}{
		"path": c.Path(),
		"id":   c.Params("id"),
	})

	actionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid action ID format", map[string]interface{}{
			"actionID": c.Params("id"),
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid action ID format"})
	}

	evidenceDataStr := c.FormValue("evidenceData")
	if evidenceDataStr == "" {
		utils.LogError("Missing evidence data in request", map[string]interface{}{
			"actionID": actionID,
			"error":    "evidence data is required",
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "evidence data is required"})
	}

	var req schema.CreateActionEvidenceDTO
	if err := json.Unmarshal([]byte(evidenceDataStr), &req); err != nil {
		utils.LogError("Invalid evidence data format", map[string]interface{}{
			"actionID": actionID,
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid evidence data format", "details": err.Error()})
	}

	userID := c.Locals("userID")
	if userID == nil {
		utils.LogError("Unauthorized access attempt", map[string]interface{}{
			"actionID": actionID,
		})
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	form, err := c.MultipartForm()
	if err != nil {
		utils.LogError("Failed to parse form", map[string]interface{}{
			"actionID": actionID,
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "failed to parse form"})
	}

	files := form.File["attachments"]
	if len(files) == 0 {
		utils.LogError("No files uploaded", map[string]interface{}{
			"actionID": actionID,
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "no files uploaded"})
	}

	var uploadedFiles []*multipart.FileHeader
	for _, file := range files {
		if !isAllowedFileTypes(file.Filename) {
			utils.LogError("Invalid file type", map[string]interface{}{
				"actionID": actionID,
				"file":     file.Filename,
			})
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid file type",
				"file":  file.Filename,
			})
		}
		uploadedFiles = append(uploadedFiles, file)
	}

	if len(uploadedFiles) == 0 {
		utils.LogError("No valid files uploaded", map[string]interface{}{
			"actionID": actionID,
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "no valid files uploaded"})
	}

	userIDStr, ok := userID.(string)
	if !ok {
		utils.LogError("Invalid user ID format", map[string]interface{}{
			"actionID": actionID,
			"userID":   userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": userID})
	}

	userIDSesh, err := uuid.Parse(userIDStr)
	if err != nil {
		utils.LogError("Failed to parse user ID", map[string]interface{}{
			"actionID": actionID,
			"userID":   userIDStr,
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": userID})
	}

	emp, err := h.CorrectiveActionservice.GetEmployeeByUserID(userIDSesh)
	if err != nil {
		utils.LogError("Failed to fetch associated employee", map[string]interface{}{
			"userID": userIDSesh,
			"error":  err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "cannot find associated employeeID"})
	}

	uuidUserID := emp.ID

	for _, file := range uploadedFiles {
		fileURL, err := saveFileToStorage(file, actionID)
		if err != nil {
			utils.LogError("Failed to save file", map[string]interface{}{
				"actionID": actionID,
				"file":     file.Filename,
				"error":    err.Error(),
			})
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to save file", "details": err.Error()})
		}

		evidence := &models.ActionEvidence{
			CorrectiveActionID: actionID,
			FileType:           req.FileType,
			FileName:           file.Filename,
			FileURL:            fileURL,
			UploadedBy:         uuidUserID,
			Description:        req.Description,
		}

		if err := h.CorrectiveActionservice.CreateActionEvidence(evidence); err != nil {
			utils.LogError("Failed to create evidence record", map[string]interface{}{
				"actionID": actionID,
				"file":     file.Filename,
				"error":    err.Error(),
			})
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create evidence record", "details": err.Error()})
		}
	}

	utils.LogInfo("Successfully created evidence records", map[string]interface{}{
		"actionID": actionID,
		"count":    len(uploadedFiles),
	})
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "evidence created successfully"})
}

func saveFileToStorage(file *multipart.FileHeader, actionID uuid.UUID) (string, error) {
	filename := filepath.Base(file.Filename)
	storagePath := fmt.Sprintf("uploads/actions/%s/%s", actionID, filename)

	if err := os.MkdirAll(filepath.Dir(storagePath), 0755); err != nil {
		return "", fmt.Errorf("failed to create directory: %w", err)
	}

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
