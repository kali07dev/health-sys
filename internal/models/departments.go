package models

type Department struct {
	ID   int    `gorm:"primaryKey"`
	Name string `gorm:"not null"`
}