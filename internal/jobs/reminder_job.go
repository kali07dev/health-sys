package jobs

import (
	"log"
	"time"

	"github.com/hopkali04/health-sys/internal/services"
)

func StartReminderJob(notificationService *services.NotificationService, mail *services.EmailService) {
	ticker := time.NewTicker(24 * time.Hour) // Run every day
	//TODO: GET FROM TABLE

	log.Println("Reminder JOB Running successfully!")
	defer ticker.Stop()

	for range ticker.C {
		log.Println("Reminder JOB Running successfully!")
		// err := mail.TestConnection()
		// if err != nil {
		// 	log.Println("Failed to test conn: %v", err)
		// }
		// ctx := context.Background()
		if err := notificationService.CheckAndSendReminders(); err != nil {
			log.Printf("Failed to run reminder job: %v", err)
		}
	}
}
