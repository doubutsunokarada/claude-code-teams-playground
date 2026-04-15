package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/lm102c/todo-app/backend/internal/model"
)

type UserRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user *model.User) error {
	query := `INSERT INTO users (id, email, password_hash, name)
		VALUES ($1, $2, $3, $4)
		RETURNING created_at, updated_at`
	return r.db.QueryRowContext(ctx, query,
		user.ID, user.Email, user.PasswordHash, user.Name,
	).Scan(&user.CreatedAt, &user.UpdatedAt)
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	var user model.User
	query := `SELECT id, email, password_hash, name, created_at, updated_at FROM users WHERE email = $1`
	err := r.db.GetContext(ctx, &user, query, email)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &user, err
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	var user model.User
	query := `SELECT id, email, password_hash, name, created_at, updated_at FROM users WHERE id = $1`
	err := r.db.GetContext(ctx, &user, query, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &user, err
}

func (r *UserRepository) Update(ctx context.Context, id uuid.UUID, name string) (*model.User, error) {
	var user model.User
	query := `UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2
		RETURNING id, email, password_hash, name, created_at, updated_at`
	err := r.db.QueryRowxContext(ctx, query, name, id).StructScan(&user)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &user, err
}
