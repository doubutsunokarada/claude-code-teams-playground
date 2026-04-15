package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/lm102c/todo-app/backend/internal/model"
)

type CategoryRepository struct {
	db *sqlx.DB
}

func NewCategoryRepository(db *sqlx.DB) *CategoryRepository {
	return &CategoryRepository{db: db}
}

func (r *CategoryRepository) Create(ctx context.Context, cat *model.Category) error {
	query := `INSERT INTO categories (id, user_id, name, color)
		VALUES ($1, $2, $3, $4)
		RETURNING created_at, updated_at`
	return r.db.QueryRowContext(ctx, query,
		cat.ID, cat.UserID, cat.Name, cat.Color,
	).Scan(&cat.CreatedAt, &cat.UpdatedAt)
}

func (r *CategoryRepository) GetByID(ctx context.Context, id, userID uuid.UUID) (*model.Category, error) {
	var cat model.Category
	query := `SELECT id, user_id, name, color, created_at, updated_at
		FROM categories WHERE id = $1 AND user_id = $2`
	err := r.db.GetContext(ctx, &cat, query, id, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &cat, err
}

func (r *CategoryRepository) GetByName(ctx context.Context, userID uuid.UUID, name string) (*model.Category, error) {
	var cat model.Category
	query := `SELECT id, user_id, name, color, created_at, updated_at
		FROM categories WHERE user_id = $1 AND name = $2`
	err := r.db.GetContext(ctx, &cat, query, userID, name)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &cat, err
}

func (r *CategoryRepository) List(ctx context.Context, userID uuid.UUID) ([]model.CategoryWithCount, error) {
	query := `SELECT c.id, c.user_id, c.name, c.color, c.created_at, c.updated_at,
		COUNT(t.id) AS todo_count
		FROM categories c
		LEFT JOIN todos t ON t.category_id = c.id
		WHERE c.user_id = $1
		GROUP BY c.id
		ORDER BY c.name ASC`

	var categories []model.CategoryWithCount
	if err := r.db.SelectContext(ctx, &categories, query, userID); err != nil {
		return nil, fmt.Errorf("failed to list categories: %w", err)
	}
	return categories, nil
}

func (r *CategoryRepository) Update(ctx context.Context, id, userID uuid.UUID, updates map[string]interface{}) (*model.Category, error) {
	setClauses := []string{}
	args := []interface{}{}
	argIdx := 1

	for key, val := range updates {
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", key, argIdx))
		args = append(args, val)
		argIdx++
	}
	setClauses = append(setClauses, "updated_at = NOW()")

	query := fmt.Sprintf(`UPDATE categories SET %s WHERE id = $%d AND user_id = $%d
		RETURNING id, user_id, name, color, created_at, updated_at`,
		joinStrings(setClauses, ", "), argIdx, argIdx+1)
	args = append(args, id, userID)

	var cat model.Category
	err := r.db.QueryRowxContext(ctx, query, args...).StructScan(&cat)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update category: %w", err)
	}
	return &cat, nil
}

func (r *CategoryRepository) Delete(ctx context.Context, id, userID uuid.UUID) error {
	query := `DELETE FROM categories WHERE id = $1 AND user_id = $2`
	result, err := r.db.ExecContext(ctx, query, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete category: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func joinStrings(strs []string, sep string) string {
	result := ""
	for i, s := range strs {
		if i > 0 {
			result += sep
		}
		result += s
	}
	return result
}
