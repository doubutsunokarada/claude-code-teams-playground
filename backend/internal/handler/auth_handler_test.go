package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/lm102c/todo-app/backend/internal/handler"
	mw "github.com/lm102c/todo-app/backend/internal/middleware"
	"github.com/lm102c/todo-app/backend/internal/repository"
	"github.com/lm102c/todo-app/backend/internal/service"
	"github.com/lm102c/todo-app/backend/internal/testutil"
)

func setupAuthTest(t *testing.T) (*echo.Echo, *handler.AuthHandler, *service.AuthService) {
	t.Helper()
	db := testutil.SetupTestDB(t)
	rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
	t.Cleanup(func() { rdb.Close() })

	userRepo := repository.NewUserRepository(db)
	authService := service.NewAuthService(userRepo, rdb, "test-secret")
	authHandler := handler.NewAuthHandler(authService)

	e := echo.New()
	return e, authHandler, authService
}

func TestRegister(t *testing.T) {
	e, authHandler, _ := setupAuthTest(t)

	t.Run("successful registration", func(t *testing.T) {
		body := map[string]string{
			"email":    "test@example.com",
			"password": "password123",
			"name":     "テストユーザー",
		}
		jsonBody, _ := json.Marshal(body)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(jsonBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := authHandler.Register(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusCreated, rec.Code)

		var resp map[string]interface{}
		err = json.Unmarshal(rec.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.NotEmpty(t, resp["access_token"])
		assert.NotEmpty(t, resp["refresh_token"])

		user := resp["user"].(map[string]interface{})
		assert.Equal(t, "test@example.com", user["email"])
		assert.Equal(t, "テストユーザー", user["name"])
	})

	t.Run("duplicate email", func(t *testing.T) {
		body := map[string]string{
			"email":    "test@example.com",
			"password": "password123",
			"name":     "テストユーザー2",
		}
		jsonBody, _ := json.Marshal(body)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(jsonBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := authHandler.Register(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusConflict, rec.Code)
	})

	t.Run("missing fields", func(t *testing.T) {
		body := map[string]string{
			"email": "",
		}
		jsonBody, _ := json.Marshal(body)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(jsonBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := authHandler.Register(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
	})
}

func TestLogin(t *testing.T) {
	e, authHandler, _ := setupAuthTest(t)

	// Register a user first
	regBody := map[string]string{
		"email":    "login@example.com",
		"password": "password123",
		"name":     "ログインテスト",
	}
	jsonBody, _ := json.Marshal(regBody)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(jsonBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	authHandler.Register(c)

	t.Run("successful login", func(t *testing.T) {
		body := map[string]string{
			"email":    "login@example.com",
			"password": "password123",
		}
		jsonBody, _ := json.Marshal(body)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(jsonBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := authHandler.Login(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, rec.Code)

		var resp map[string]interface{}
		json.Unmarshal(rec.Body.Bytes(), &resp)
		assert.NotEmpty(t, resp["access_token"])
		assert.NotEmpty(t, resp["refresh_token"])
	})

	t.Run("wrong password", func(t *testing.T) {
		body := map[string]string{
			"email":    "login@example.com",
			"password": "wrongpassword",
		}
		jsonBody, _ := json.Marshal(body)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(jsonBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := authHandler.Login(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, rec.Code)
	})

	t.Run("nonexistent email", func(t *testing.T) {
		body := map[string]string{
			"email":    "nobody@example.com",
			"password": "password123",
		}
		jsonBody, _ := json.Marshal(body)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(jsonBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := authHandler.Login(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, rec.Code)
	})
}

func TestRefresh(t *testing.T) {
	e, authHandler, _ := setupAuthTest(t)

	// Register to get tokens
	regBody := map[string]string{
		"email":    "refresh@example.com",
		"password": "password123",
		"name":     "リフレッシュテスト",
	}
	jsonBody, _ := json.Marshal(regBody)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(jsonBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	authHandler.Register(c)

	var regResp map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &regResp)
	refreshToken := regResp["refresh_token"].(string)

	t.Run("successful refresh", func(t *testing.T) {
		body := map[string]string{
			"refresh_token": refreshToken,
		}
		jsonBody, _ := json.Marshal(body)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", bytes.NewReader(jsonBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := authHandler.Refresh(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, rec.Code)

		var resp map[string]interface{}
		json.Unmarshal(rec.Body.Bytes(), &resp)
		assert.NotEmpty(t, resp["access_token"])
		assert.NotEmpty(t, resp["refresh_token"])
	})

	t.Run("reused refresh token is rejected", func(t *testing.T) {
		body := map[string]string{
			"refresh_token": refreshToken,
		}
		jsonBody, _ := json.Marshal(body)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", bytes.NewReader(jsonBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := authHandler.Refresh(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, rec.Code)
	})
}

func TestLogout(t *testing.T) {
	e, authHandler, authService := setupAuthTest(t)

	// Register to get tokens
	regBody := map[string]string{
		"email":    "logout@example.com",
		"password": "password123",
		"name":     "ログアウトテスト",
	}
	jsonBody, _ := json.Marshal(regBody)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(jsonBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	authHandler.Register(c)

	var regResp map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &regResp)
	accessToken := regResp["access_token"].(string)

	t.Run("successful logout", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/logout", nil)
		req.Header.Set("Authorization", "Bearer "+accessToken)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		// Simulate auth middleware setting user_id
		userID, _ := authService.ValidateAccessToken(accessToken)
		c.Set(mw.UserIDKey, userID)

		err := authHandler.Logout(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNoContent, rec.Code)
	})
}
