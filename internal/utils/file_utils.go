package utils

import (
	"path/filepath"
	"strings"
)

// AllowedFileExtensions defines the set of allowed file extensions.
// Using a map for O(1) lookup. Values are MIME types or true for simplicity.

var AllowedFileExtensions = map[string]string{
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".png":  "image/png",
	".gif":  "image/gif",
	".pdf":  "application/pdf",
	".doc":  "application/msword",
	".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	".xls":  "application/vnd.ms-excel",
	".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	".txt":  "text/plain",
}

// IsAllowedFileType checks if the file extension is in the allowed list.
func IsAllowedFileType(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	_, allowed := AllowedFileExtensions[ext]
	return allowed
}

// GetFileContentType returns the expected Content-Type for a given filename's extension.
// Returns an empty string if the extension is not recognized or mapped.
func GetFileContentType(filename string) string {
    ext := strings.ToLower(filepath.Ext(filename))
    return AllowedFileExtensions[ext] // Returns "" if not found, which is fine
}