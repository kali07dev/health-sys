// cmd/cli/user.go
package cli

import (
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/config"
	"github.com/hopkali04/health-sys/internal/db"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/spf13/cobra"
)

func UserCmd() *cobra.Command {
	var (
		email     string
		password  string
		firstName string
		lastName  string
	)

	cmd := &cobra.Command{
		Use:   "create-admin",
		Short: "Create an admin user",
		Run: func(cmd *cobra.Command, args []string) {
			// Load config
			cfg, err := config.LoadConfig("config.yaml")
			if err != nil {
				log.Fatalf("Failed to load config: %v", err)
			}

			// Connect to database
			dbConn, err := db.ConnectDB(cfg)
			if err != nil {
				log.Fatalf("Failed to connect to database: %v", err)
			}

			// Hash password
			// hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
			// if err != nil {
			// 	log.Fatalf("Failed to hash password: %v", err)
			// }

			// Create user
			// user := schema.UserRequest{
			// 	Email:        email,
			// 	Password: password,
			// 	ConfirmPassword:     password,
			// }

			// Create employee
			requestData := schema.CreateUserWithEmployeeRequest{
				// ID:             uuid.New(),
				// UserID:         user.ID,
				Email:           email,
				Password:        password,
				ConfirmPassword: password,
				EmployeeNumber:  fmt.Sprintf("ADM%s", uuid.New().String()[:8]),
				FirstName:       firstName,
				LastName:        lastName,
				Department:      "Administration",
				Position:        "System Administrator",
				Role:            "admin",
				IsSafetyOfficer: true,
				StartDate:       time.Now(),
				OfficeLocation:  "Head Office",
				ContactNumber:   "1234567890",
				// IsActive:       true,
			}

			// Begin transaction
			// tx := dbConn.Begin()

			// // Create user
			// if err := tx.Create(&user).Error; err != nil {
			// 	tx.Rollback()
			// 	log.Fatalf("Failed to create user: %v", err)
			// }

			// // Create employee
			// if err := tx.Create(&employee).Error; err != nil {
			// 	tx.Rollback()
			// 	log.Fatalf("Failed to create employee: %v", err)
			// }

			// // Commit transaction
			// if err := tx.Commit().Error; err != nil {
			// 	log.Fatalf("Failed to commit transaction: %v", err)
			// }

			err = services.NewAdminService(dbConn).CreateAdminWithEmployee(&requestData)
			if err != nil {
				log.Fatalf("Failed to commit transaction: %v", err)
			}

			fmt.Printf("Admin user created successfully!\nEmail: %s\n", email)
		},
	}

	// Add flags
	cmd.Flags().StringVarP(&email, "email", "e", "", "Admin user email (required)")
	cmd.Flags().StringVarP(&password, "password", "p", "", "Admin user password (required)")
	cmd.Flags().StringVarP(&firstName, "firstname", "f", "", "Admin user first name (required)")
	cmd.Flags().StringVarP(&lastName, "lastname", "l", "", "Admin user last name (required)")

	// Mark flags as required
	cmd.MarkFlagRequired("email")
	cmd.MarkFlagRequired("password")
	cmd.MarkFlagRequired("firstname")
	cmd.MarkFlagRequired("lastname")

	return cmd
}
