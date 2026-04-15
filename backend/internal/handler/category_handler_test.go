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
	"github.com/lm102c/todo-app/backend/internal/repository"
	"github.com/lm102c/todo-app/backend/internal/testutil"
)

func setupCategoryTest(t *testing.T) (*echo.Echo, *handler.CategoryHandler, uuid.UUID) {
	t.Helper()
	db := testutil.SetupTestDB(t)

	userID := uuid.New()
	_, err := db.Exec(`INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)`,
		userID, "cat-test@example.com", "hash", "カテゴリテスト")
	require.NoError(t, err)

	categoryRepo := repository.NewCategoryRepository(db)
	categoryHandler := handler.NewCategoryHandler(categoryRepo)

	e := echo.New()
	return e, categoryHandler, userID
}

func TestCreateCategory(t *testing.T) {
	e, categoryHandler, userID := setupCategoryTest(t)

	t.Run("successful creation", func(t *testing.T) {
		body := map[string]string{
			"name":  "買い物",
			"color": "#FF6B6B",
		}
		jsonBody, _ := json.Marshal(body)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/categories", bytes.NewReader(jsonBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set(mw.UserIDKey, userID)

		err := categoryHandler.Create(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusCreated, rec.Code)

		var resp map[string]interface{}
		json.Unmarshal(rec.Body.Bytes(), &resp)
		assert.Equal(t, "買い物", resp["name"])
		assert.Equal(t, "#FF6B6B", resp["color"])
		assert.Equal(t, float64(0), resp["todo_count"])
	})

	t.Run("default color", func(t *testing.T) {
		body := map[string]string{"name": "仕事"}
		jsonBody, _ := json.Marshal(body)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/categories", bytes.NewReader(jsonBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set(mw.UserIDKey, userID)

		err := categoryHandler.Create(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusCreated, rec.Code)

		var resp map[string]interface{}
		json.Unmarshal(rec.Body.Bytes(), &resp)
		assert.Equal(t, "#808080", resp["color"])
	})

	t.Run("duplicate name", func(t *testing.T) {
		body := map[string]string{"name": "買い物"}
		jsonBody, _ := json.Marshal(body)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/categories", bytes.NewReader(jsonBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set(mw.UserIDKey, userID)

		err := categoryHandler.Create(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusConflict, rec.Code)
	})

	t.Run("missing name", func(t *testing.T) {
		body := map[string]string{"name": ""}
		jsonBody, _ := json.Marshal(body)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/categories", bytes.NewReader(jsonBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set(mw.UserIDKey, userID)

		err := categoryHandler.Create(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
	})
}

func TestListCategories(t *testing.T) {
	e, categoryHandler, userID := setupCategoryTest(t)

	// Create categories
	for _, name := range []string{"買い物", "仕事", "趣味"} {
		body := map[string]string{"name": name}
		jsonBody, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/categories", bytes.NewReader(jsonBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set(mw.UserIDKey, userID)
		categoryHandler.Create(c)
	}

	t.Run("list all categories", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/categories", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set(mw.UserIDKey, userID)

		err := categoryHandler.List(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, rec.Code)

		var resp map[string]interface{}
		json.Unmarshal(rec.Body.Bytes(), &resp)
		categories := resp["categories"].([]interface{})
		assert.Len(t, categories, 3)
	})
}

func TestDeleteCategory(t *testing.T) {
	e, categoryHandler, userID := setupCategoryTest(t)

	// Create a category
	body := map[string]string{"name": "削除テスト"}
	jsonBody, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/categories", bytes.NewReader(jsonBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set(mw.UserIDKey, userID)
	categoryHandler.Create(c)

	var createResp map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &createResp)
	catID := createResp["id"].(string)

	t.Run("delete existing category", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/v1/categories/"+catID, nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.SetParamNames("id")
		c.SetParamValues(catID)
		c.Set(mw.UserIDKey, userID)

		err := categoryHandler.Delete(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNoContent, rec.Code)
	})

	t.Run("delete nonexistent category", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/v1/categories/"+uuid.New().String(), nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.SetParamNames("id")
		c.SetParamValues(uuid.New().String())
		c.Set(mw.UserIDKey, userID)

		err := categoryHandler.Delete(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, rec.Code)
	})
}
