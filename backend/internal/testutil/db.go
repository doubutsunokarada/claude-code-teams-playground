package testutil

import (
	"fmt"
	"testing"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"

	"github.com/lm102c/todo-app/backend/internal/database"
)

func SetupTestDB(t *testing.T) *sqlx.DB {
	t.Helper()

	// Connect to default database to create test database
	adminDB, err := sqlx.Connect("postgres", "host=localhost port=5432 user=todo_user password=todo_password dbname=todo_app sslmode=disable")
	if err != nil {
		t.Fatalf("failed to connect to admin database: %v", err)
	}

	testDBName := fmt.Sprintf("todo_test_%s", uuid.New().String()[:8])

	_, err = adminDB.Exec(fmt.Sprintf("CREATE DATABASE %s", testDBName))
	if err != nil {
		adminDB.Close()
		t.Fatalf("failed to create test database: %v", err)
	}
	adminDB.Close()

	testDB, err := sqlx.Connect("postgres", fmt.Sprintf("host=localhost port=5432 user=todo_user password=todo_password dbname=%s sslmode=disable", testDBName))
	if err != nil {
		t.Fatalf("failed to connect to test database: %v", err)
	}

	if err := database.RunMigrations(testDB, "../../migrations"); err != nil {
		testDB.Close()
		t.Fatalf("failed to run migrations: %v", err)
	}

	t.Cleanup(func() {
		testDB.Close()
		cleanupDB, err := sqlx.Connect("postgres", "host=localhost port=5432 user=todo_user password=todo_password dbname=todo_app sslmode=disable")
		if err != nil {
			return
		}
		defer cleanupDB.Close()
		cleanupDB.Exec(fmt.Sprintf("DROP DATABASE IF EXISTS %s", testDBName))
	})

	return testDB
}
