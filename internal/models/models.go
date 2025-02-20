package models

import (
	"time"

	"github.com/google/uuid"
)

type HazardFrequency struct {
	Type         string   `json:"type"`
	Frequency    int      `json:"frequency"`
	RiskScore    float64  `json:"riskScore"`
	TrendChange  float64  `json:"trendChange"` // Percentage change from previous period
	TopLocations []string `json:"topLocations"`
}

type MonthlyTrend struct {
	Month         time.Time `json:"month"`
	IncidentCount int       `json:"incidentCount"`
	SeverityScore float64   `json:"severityScore"`
	ResolvedCount int       `json:"resolvedCount"`
	NewHazards    int       `json:"newHazards"`
}

type RiskPattern struct {
	Category    string   `json:"category"`
	Frequency   int      `json:"frequency"`
	Severity    string   `json:"severity"`
	Departments []string `json:"departments"`
	RootCauses  []string `json:"rootCauses"`
	TrendChange float64  `json:"trendChange"`
}

type RecurringIssue struct {
	Description  string    `json:"description"`
	Frequency    int       `json:"frequency"`
	LastOccurred time.Time `json:"lastOccurred"`
	Status       string    `json:"status"`
	Priority     string    `json:"priority"`
	Locations    []string  `json:"locations"`
}

type OverdueAction struct {
	ID          uuid.UUID `json:"id"`
	Description string    `json:"description"`
	DueDate     time.Time `json:"dueDate"`
	DaysOverdue int       `json:"daysOverdue"`
	Priority    string    `json:"priority"`
	AssignedTo  string    `json:"assignedTo"`
	Department  string    `json:"department"`
}

type ComplianceTrend struct {
	Period         time.Time `json:"period"`
	ComplianceRate float64   `json:"complianceRate"`
	ActionsClosed  int       `json:"actionsClosed"`
	ActionsOverdue int       `json:"actionsOverdue"`
	AvgClosureTime float64   `json:"avgClosureTime"`
}
