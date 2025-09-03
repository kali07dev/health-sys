package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/hopkali04/health-sys/internal/api"
	"github.com/hopkali04/health-sys/internal/middleware"
)

// RegisterRoutes registers the routes for VPC resources
func SetupVpcRoutes(app *fiber.App, handler *api.VPCHandler) {
	vpcGroup := app.Group("/api/v1/vpcs")
	vpcGroup.Post("/", middleware.AuthMiddleware(), handler.CreateVPC)
	vpcGroup.Post("/with-attachments", middleware.AuthMiddleware(), handler.CreateVPCWithAttachments)
	vpcGroup.Post("/bulk", middleware.AuthMiddleware(), handler.CreateBulkVPCs)
	vpcGroup.Get("/", middleware.AuthMiddleware(), handler.ListAllVPCs)
	vpcGroup.Get("/:id", middleware.AuthMiddleware(), handler.GetVPC)
	vpcGroup.Get("/number/:vpcNumber", middleware.AuthMiddleware(), handler.GetVPCByNumber)
	vpcGroup.Put("/:id", middleware.AuthMiddleware(), handler.UpdateVPC)
	vpcGroup.Delete("/:id", middleware.AuthMiddleware(), handler.DeleteVPC)
	vpcGroup.Get("/department/:department", middleware.AuthMiddleware(), handler.ListByDepartment)
	vpcGroup.Get("/type/:vpcType", middleware.AuthMiddleware(), handler.ListByVpcType)
}
