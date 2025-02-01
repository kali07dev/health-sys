package middleware

const (
	RoleAdmin        = "admin"
	RoleSafetyOfficer = "safety_officer"
	RoleManager      = "manager"
	RoleEmployee     = "employee"
)

// Permission constants
const (
	PermissionReadIncidents      = "read:incidents"
	PermissionCreateIncidents    = "create:incidents"
	PermissionManageIncidents    = "manage:incidents"
	PermissionAssignTasks        = "assign:tasks"
	PermissionGenerateReports    = "generate:reports"
	PermissionManageUsers        = "manage:users"
	PermissionManageRoles        = "manage:roles"
)

// RolePermissions defines what permissions each role has
var RolePermissions = map[string][]string{
	RoleAdmin: {
		PermissionReadIncidents,
		PermissionCreateIncidents,
		PermissionManageIncidents,
		PermissionAssignTasks,
		PermissionGenerateReports,
		PermissionManageUsers,
		PermissionManageRoles,
	},
	RoleSafetyOfficer: {
		PermissionReadIncidents,
		PermissionCreateIncidents,
		PermissionManageIncidents,
		PermissionAssignTasks,
		PermissionGenerateReports,
	},
	RoleManager: {
		PermissionReadIncidents,
		PermissionCreateIncidents,
		PermissionAssignTasks,
		PermissionGenerateReports,
	},
	RoleEmployee: {
		PermissionReadIncidents,
		PermissionCreateIncidents,
	},
}