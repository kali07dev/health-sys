package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type AuditLog struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	TableName string    `gorm:"size:50;not null"`
	RecordID  uuid.UUID `gorm:"type:uuid;not null"`
	Action    string    `gorm:"size:10;not null;check:action IN ('INSERT', 'UPDATE', 'DELETE')"`
	OldData   JSONB     `gorm:"type:jsonb"`
	NewData   JSONB     `gorm:"type:jsonb"`
	UserID    uuid.UUID `gorm:"type:uuid"`
	IPAddress string    `gorm:"type:inet"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}

// JSONB is a custom type for handling JSONB fields in GORM.
type JSONB map[string]interface{}


// Scan implements the sql.Scanner interface
func (j *JSONB) Scan(value interface{}) error {
    if value == nil {
        *j = make(JSONB)
        return nil
    }

    var data map[string]interface{}
    var bytes []byte

    switch v := value.(type) {
    case []byte:
        bytes = v
    case string:
        bytes = []byte(v)
    default:
        return fmt.Errorf("unsupported type for JSONB: %T", value)
    }

    if len(bytes) == 0 {
        *j = make(JSONB)
        return nil
    }

    if err := json.Unmarshal(bytes, &data); err != nil {
        return fmt.Errorf("error unmarshaling JSONB: %v", err)
    }

    *j = data
    return nil
}

// Value implements the driver.Valuer interface
func (j JSONB) Value() (driver.Value, error) {
    if j == nil {
        return nil, nil
    }
    return json.Marshal(j)
}

// MarshalJSON implements the json.Marshaler interface
func (j JSONB) MarshalJSON() ([]byte, error) {
    if j == nil {
        return []byte("{}"), nil
    }
    return json.Marshal(map[string]interface{}(j))
}

// UnmarshalJSON implements the json.Unmarshaler interface
func (j *JSONB) UnmarshalJSON(data []byte) error {
    if *j == nil {
        *j = make(JSONB)
    }
    return json.Unmarshal(data, (*map[string]interface{})(j))
}