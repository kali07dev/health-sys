// cmd/cli/migrate.go
package cli

import (
	"fmt"
	"log"

	"github.com/hopkali04/health-sys/internal/config"
	"github.com/hopkali04/health-sys/internal/db"
	"github.com/spf13/cobra"
)

func MigrateCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "migrate",
		Short: "Run database migrations",
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

			// Run migrations
			if err := db.AutoMigrate(dbConn); err != nil {
				log.Fatalf("Failed to migrate database: %v", err)
			}

			fmt.Println("Database migration completed successfully!")
		},
	}

	return cmd
}

