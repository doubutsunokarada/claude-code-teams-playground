package model

import (
	"time"

	"github.com/google/uuid"
)

type TodoStatus string

const (
	TodoStatusPending    TodoStatus = "pending"
	TodoStatusInProgress TodoStatus = "in_progress"
	TodoStatusDone       TodoStatus = "done"
)

type TodoPriority string

const (
	TodoPriorityLow    TodoPriority = "low"
	TodoPriorityMedium TodoPriority = "medium"
	TodoPriorityHigh   TodoPriority = "high"
)

type Todo struct {
	ID          uuid.UUID    `db:"id" json:"id"`
	UserID      uuid.UUID    `db:"user_id" json:"-"`
	CategoryID  *uuid.UUID   `db:"category_id" json:"-"`
	Title       string       `db:"title" json:"title"`
	Description *string      `db:"description" json:"description"`
	Status      TodoStatus   `db:"status" json:"status"`
	Priority    TodoPriority `db:"priority" json:"priority"`
	DueDate     *string      `db:"due_date" json:"due_date"`
	CreatedAt   time.Time    `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time    `db:"updated_at" json:"updated_at"`
}

type TodoWithCategory struct {
	Todo
	Category *CategorySummary `json:"category"`
}

type CategorySummary struct {
	ID    uuid.UUID `json:"id"`
	Name  string    `json:"name"`
	Color string    `json:"color"`
}
