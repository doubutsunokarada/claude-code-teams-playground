package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/lm102c/todo-app/backend/internal/model"
)

type TodoRepository struct {
	db *sqlx.DB
}

func NewTodoRepository(db *sqlx.DB) *TodoRepository {
	return &TodoRepository{db: db}
}

func (r *TodoRepository) Create(ctx context.Context, todo *model.Todo) error {
	query := `INSERT INTO todos (id, user_id, category_id, title, description, status, priority, due_date)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING created_at, updated_at`
	return r.db.QueryRowContext(ctx, query,
		todo.ID, todo.UserID, todo.CategoryID, todo.Title, todo.Description,
		todo.Status, todo.Priority, todo.DueDate,
	).Scan(&todo.CreatedAt, &todo.UpdatedAt)
}

func (r *TodoRepository) GetByID(ctx context.Context, id, userID uuid.UUID) (*model.Todo, error) {
	var todo model.Todo
	query := `SELECT id, user_id, category_id, title, description, status, priority,
		due_date, created_at, updated_at
		FROM todos WHERE id = $1 AND user_id = $2`
	err := r.db.GetContext(ctx, &todo, query, id, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &todo, err
}

func (r *TodoRepository) GetWithCategory(ctx context.Context, id, userID uuid.UUID) (*model.TodoWithCategory, error) {
	todo, err := r.GetByID(ctx, id, userID)
	if err != nil || todo == nil {
		return nil, err
	}

	result := &model.TodoWithCategory{Todo: *todo}
	if todo.CategoryID != nil {
		var cat model.CategorySummary
		catQuery := `SELECT id, name, color FROM categories WHERE id = $1`
		if err := r.db.GetContext(ctx, &cat, catQuery, *todo.CategoryID); err == nil {
			result.Category = &cat
		}
	}
	return result, nil
}

type ListResult struct {
	Todos      []model.TodoWithCategory
	TotalCount int
}

func (r *TodoRepository) List(ctx context.Context, params model.TodoListParams) (*ListResult, error) {
	where := []string{"t.user_id = $1"}
	args := []interface{}{params.UserID}
	argIdx := 2

	if params.Status != "" {
		where = append(where, fmt.Sprintf("t.status = $%d", argIdx))
		args = append(args, params.Status)
		argIdx++
	}
	if params.Priority != "" {
		where = append(where, fmt.Sprintf("t.priority = $%d", argIdx))
		args = append(args, params.Priority)
		argIdx++
	}
	if params.CategoryID != "" {
		where = append(where, fmt.Sprintf("t.category_id = $%d", argIdx))
		args = append(args, params.CategoryID)
		argIdx++
	}
	if params.Search != "" {
		where = append(where, fmt.Sprintf("(t.title ILIKE $%d OR t.description ILIKE $%d)", argIdx, argIdx))
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	// Count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM todos t WHERE %s", whereClause)
	var totalCount int
	if err := r.db.GetContext(ctx, &totalCount, countQuery, args...); err != nil {
		return nil, fmt.Errorf("failed to count todos: %w", err)
	}

	// Sort
	sortColumn := "t.created_at"
	switch params.Sort {
	case "due_date":
		sortColumn = "t.due_date"
	case "priority":
		sortColumn = "t.priority"
	case "title":
		sortColumn = "t.title"
	}
	order := "DESC"
	if params.Order == "asc" {
		order = "ASC"
	}

	offset := (params.Page - 1) * params.PerPage

	query := fmt.Sprintf(`SELECT t.id, t.user_id, t.category_id, t.title, t.description,
		t.status, t.priority, t.due_date, t.created_at, t.updated_at
		FROM todos t WHERE %s ORDER BY %s %s LIMIT $%d OFFSET $%d`,
		whereClause, sortColumn, order, argIdx, argIdx+1)
	args = append(args, params.PerPage, offset)

	var todos []model.Todo
	if err := r.db.SelectContext(ctx, &todos, query, args...); err != nil {
		return nil, fmt.Errorf("failed to list todos: %w", err)
	}

	// Fetch categories
	results := make([]model.TodoWithCategory, len(todos))
	categoryCache := make(map[uuid.UUID]*model.CategorySummary)

	for i, todo := range todos {
		results[i] = model.TodoWithCategory{Todo: todo}
		if todo.CategoryID != nil {
			if cat, ok := categoryCache[*todo.CategoryID]; ok {
				results[i].Category = cat
			} else {
				var cat model.CategorySummary
				catQuery := `SELECT id, name, color FROM categories WHERE id = $1`
				if err := r.db.GetContext(ctx, &cat, catQuery, *todo.CategoryID); err == nil {
					categoryCache[*todo.CategoryID] = &cat
					results[i].Category = &cat
				}
			}
		}
	}

	return &ListResult{Todos: results, TotalCount: totalCount}, nil
}

func (r *TodoRepository) Update(ctx context.Context, id, userID uuid.UUID, updates map[string]interface{}) (*model.Todo, error) {
	setClauses := []string{}
	args := []interface{}{}
	argIdx := 1

	for key, val := range updates {
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", key, argIdx))
		args = append(args, val)
		argIdx++
	}
	setClauses = append(setClauses, "updated_at = NOW()")

	query := fmt.Sprintf(`UPDATE todos SET %s WHERE id = $%d AND user_id = $%d
		RETURNING id, user_id, category_id, title, description, status, priority, due_date, created_at, updated_at`,
		strings.Join(setClauses, ", "), argIdx, argIdx+1)
	args = append(args, id, userID)

	var todo model.Todo
	err := r.db.QueryRowxContext(ctx, query, args...).StructScan(&todo)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update todo: %w", err)
	}
	return &todo, nil
}

func (r *TodoRepository) Delete(ctx context.Context, id, userID uuid.UUID) error {
	query := `DELETE FROM todos WHERE id = $1 AND user_id = $2`
	result, err := r.db.ExecContext(ctx, query, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete todo: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}
