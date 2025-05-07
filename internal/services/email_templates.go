package services

import (
	"fmt"
	"html/template"
	"strings"

	"github.com/hopkali04/health-sys/internal/models"
)

func (s *EmailService) sendVPCNotificationEmail(to []string, vpc *models.VPC) error {
	template := &EmailTemplate{
		Subject: "📝 New VPC Report Submitted",
		Title:   "New Visible Personal Commitment (VPC)",
		Message: template.HTML(fmt.Sprintf(`
			<div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
				<h3 style="color: #2e7d32; margin-bottom: 15px;">VPC Report Details</h3>
				<p><strong>VPC No:</strong> %s</p>
				<p><strong>Reported Date:</strong> %s</p>
				<p><strong>Reported By:</strong> %s</p>
				<p><strong>Department:</strong> %s</p>
				<p><strong>VPC Type:</strong> %s</p>
				<p><strong>Description:</strong> %s</p>
				<p><strong>Action Taken:</strong> %s</p>
				<p><strong>Incident Relates To:</strong> %s</p>
				<p style="color: #424245; margin-top: 15px;">Please review this VPC submission and take appropriate action if necessary.</p>
			</div>`,
			vpc.VpcNumber,
			vpc.ReportedDate.Format("January 2, 2006 15:04"),
			vpc.ReportedBy,
			vpc.Department,
			strings.Title(vpc.VpcType), // capitalize "safe"/"unsafe"
			vpc.Description,
			vpc.ActionTaken,
			vpc.IncidentRelatesTo,
		)),
		ActionLink: fmt.Sprintf("/vpc/%s", vpc.ID),
		ActionText: "View VPC Report",
	}

	return s.SendEmail(to, template.Subject, template.Message)
}
