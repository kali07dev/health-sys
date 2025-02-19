package main

import (
	"fmt"
	"os"

	"github.com/hopkali04/health-sys/cmd/cli"
	"github.com/spf13/cobra"
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "server" {
		cli.RunServer()
		return
	}

	rootCmd := &cobra.Command{
		Use:   "healthsys",
		Short: "Health System CLI tool for database management",
	}

	rootCmd.AddCommand(cli.MigrateCmd())
	rootCmd.AddCommand(cli.UserCmd())

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
