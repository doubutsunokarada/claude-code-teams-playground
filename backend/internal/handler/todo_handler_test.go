package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/lm102c/todo-app/backend/internal/handler"
	mw "github.com/lm102c/todo-app/backend/internal/middleware"
	"github.com/lm102c/todo-app/backend/internal/model"
	"github.com/lm102c/todo-app/backend/internal/repository"
	"github.com/lm102c/todo-app/backend/internal/testutil"
)

func setupTodoTest(t *testing.T) (*echo.Echo, *handler.TodoHandler, uuid.UUID) {
	t.Helper()
	db := testutil.SetupTestDB(t)

	// Create a test user
	userID := uuid.New()
	_, err := db.Exec(`INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)`,
		userID, "todo-test@example.com", "hash", "TODOテスト")
	require.NoError(t, err)

	todoRepo := repository.NewTodoRepository(db)
	todoHandler := handler.NewTodoHandler(todoRepo)

	e := echo.New()
	return e, todoHandler, userID
}

func TestCreateTodo(t *testing.T) {
	e, todoHandler, userID := setupTodoTest(t)

	t.Run("successful creation", func(t *testing.T) {
		body := map[string]interface{}{
			"title":       "テストTODO",
			"description": "テスト説明",
			"priority":    "high",
		}
		jsonBody, _ := json.Marshal(body)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/todos", bytes.NewReader(jsonBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set(mw.UserIDKey, userID)

		err := todoHandler.Create(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusCreated, rec.Code)

		var resp map[string]interface{}
		json.Unmarshal(rec.Body.Bytes(), &resp)
		assert.Equal(t, "テストTODO", resp["title"])
		assert.Equal(t, "high", resp["priority"])
		assert.Equal(t, "pending", resp["status"])
	})

	t.Run("missing title", func(t *testing.T) {
		body := map[string]interface{}{"title": ""}
		jsonBody, _ := json.Marshal(body)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/todos", bytes.NewReader(jsonBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set(mw.UserIDKey, userID)

		err := todoHandler.Create(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
	})

	t.Run("invalid status", func(t *testing.T) {
		body := map[string]interface{}{
			"title":  "テスト",
			"status": "invalid",
		}
		jsonBody, _ := json.Marshal(body)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/todos", bytes.NewReader(jsonBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set(mw.UserIDKey, userID)

		err := todoHandler.Create(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
	})
}

func TestListTodos(t *testing.T) {
	e, todoHandler, userID := setupTodoTest(t)

	// Create some todos
	for i := 0; i < 3; i++ {
		body := map[string]interface{}{
			"title": "TODO " + string(rune('A'+i)),
		}
		jsonBody, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/todos", bytes.NewReader(jsonBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set(mw.UserIDKey, userID)
		todoHandler.Create(c)
	}

	t.Run("list all todos", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/todos", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set(mw.UserIDKey, userID)

		err := todoHandler.List(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, rec.Code)

		var resp map[string]interface{}
		json.Unmarshal(rec.Body.Bytes(), &resp)
		todos := resp["todos"].([]interface{})
		assert.Len(t, todos, 3)

		pagination := resp["pagination"].(map[string]interface{})
		assert.Equal(t, float64(3), pagination["total_count"])
	})

	t.Run("filter by status", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/todos?status=pending", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.SetParamNames()
		c.Set(mw.UserIDKey, userID)

		err := todoHandler.List(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, rec.Code)
	})
}

func TestGetTodo(t *testing.T) {
	e, todoHandler, userID := setupTodoTest(t)

	// Create a todo
	body := map[string]interface{}{"title": "取得テスト"}
	jsonBody, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/todos", bytes.NewReader(jsonBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set(mw.UserIDKey, userID)
	todoHandler.Create(c)

	var createResp model.TodoWithCategory
	json.Unmarshal(rec.Body.Bytes(), &createResp)

	t.Run("existing todo", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/todos/"+createResp.ID.String(), nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.SetParamNames("id")
		c.SetParamValues(createResp.ID.String())
		c.Set(mw.UserIDKey, userID)

		err := todoHandler.Get(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, rec.Code)
	})

	t.Run("nonexistent todo", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/todos/"+uuid.New().String(), nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.SetParamNames("id")
		c.SetParamValues(uuid.New().String())
		c.Set(mw.UserIDKey, userID)

		err := todoHandler.Get(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, rec.Code)
	})
}

func TestUpdateTodo(t *testing.T) {
	e, todoHandler, userID := setupTodoTest(t)

	// Create a todo
	body := map[string]interface{}{"title": "更新テスト"}
	jsonBody, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/todos", bytes.NewReader(jsonBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set(mw.UserIDKey, userID)
	todoHandler.Create(c)

	var createResp model.TodoWithCategory
	json.Unmarshal(rec.Body.Bytes(), &createResp)

	t.Run("update status", func(t *testing.T) {
		updateBody := map[string]interface{}{"status": "done"}
		jsonBody, _ := json.Marshal(updateBody)

		req := httptest.NewRequest(http.MethodPatch, "/api/v1/todos/"+createResp.ID.String(), bytes.NewReader(jsonBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.SetParamNames("id")
		c.SetParamValues(createResp.ID.String())
		c.Set(mw.UserIDKey, userID)

		err := todoHandler.Update(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, rec.Code)

		var resp map[string]interface{}
		json.Unmarshal(rec.Body.Bytes(), &resp)
		assert.Equal(t, "done", resp["status"])
	})
}

func TestDeleteTodo(t *testing.T) {
	e, todoHandler, userID := setupTodoTest(t)

	// Create a todo
	body := map[string]interface{}{"title": "削除テスト"}
	jsonBody, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/todos", bytes.NewReader(jsonBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set(mw.UserIDKey, userID)
	todoHandler.Create(c)

	var createResp model.TodoWithCategory
	json.Unmarshal(rec.Body.Bytes(), &createResp)

	t.Run("delete existing todo", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/v1/todos/"+createResp.ID.String(), nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.SetParamNames("id")
		c.SetParamValues(createResp.ID.String())
		c.Set(mw.UserIDKey, userID)

		err := todoHandler.Delete(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNoContent, rec.Code)
	})

	t.Run("delete nonexistent todo", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/v1/todos/"+uuid.New().String(), nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.SetParamNames("id")
		c.SetParamValues(uuid.New().String())
		c.Set(mw.UserIDKey, userID)

		err := todoHandler.Delete(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, rec.Code)
	})
}
