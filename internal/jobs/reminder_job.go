package jobs

import (
	"context"
	"log"
	"time"

	"github.com/hopkali04/health-sys/internal/services"
)

func StartReminderJob(notificationService *services.NotificationService) {
	ticker := time.NewTicker(1 * time.Hour) // Run every hour
	defer ticker.Stop()

	for range ticker.C {
		ctx := context.Background()
		if err := notificationService.CheckAndSendReminders(ctx); err != nil {
			log.Printf("Failed to run reminder job: %v", err)
		}
	}
}
