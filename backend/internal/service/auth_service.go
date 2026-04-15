package service

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"

	"github.com/lm102c/todo-app/backend/internal/model"
	"github.com/lm102c/todo-app/backend/internal/repository"
)

const (
	AccessTokenExpiry  = 15 * time.Minute
	RefreshTokenExpiry = 7 * 24 * time.Hour
)

type AuthService struct {
	userRepo  *repository.UserRepository
	rdb       *redis.Client
	jwtSecret []byte
}

func NewAuthService(userRepo *repository.UserRepository, rdb *redis.Client, jwtSecret string) *AuthService {
	return &AuthService{
		userRepo:  userRepo,
		rdb:       rdb,
		jwtSecret: []byte(jwtSecret),
	}
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func (s *AuthService) Register(ctx context.Context, req RegisterRequest) (*model.User, *TokenPair, error) {
	fields := make(map[string]string)
	if req.Email == "" {
		fields["email"] = "メールアドレスは必須です"
	}
	if req.Password == "" {
		fields["password"] = "パスワードは必須です"
	} else if len(req.Password) < 8 {
		fields["password"] = "パスワードは8文字以上にしてください"
	}
	if req.Name == "" {
		fields["name"] = "名前は必須です"
	}
	if len(fields) > 0 {
		return nil, nil, model.NewValidationError(fields)
	}

	existing, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to check email: %w", err)
	}
	if existing != nil {
		return nil, nil, model.NewAppError(http.StatusConflict, "EMAIL_ALREADY_EXISTS", "このメールアドレスは既に登録されています")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &model.User{
		ID:           uuid.New(),
		Email:        req.Email,
		PasswordHash: string(hash),
		Name:         req.Name,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, nil, fmt.Errorf("failed to create user: %w", err)
	}

	tokens, err := s.generateTokens(ctx, user.ID)
	if err != nil {
		return nil, nil, err
	}

	return user, tokens, nil
}

func (s *AuthService) Login(ctx context.Context, req LoginRequest) (*model.User, *TokenPair, error) {
	fields := make(map[string]string)
	if req.Email == "" {
		fields["email"] = "メールアドレスは必須です"
	}
	if req.Password == "" {
		fields["password"] = "パスワードは必須です"
	}
	if len(fields) > 0 {
		return nil, nil, model.NewValidationError(fields)
	}

	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get user: %w", err)
	}
	if user == nil {
		return nil, nil, model.NewAppError(http.StatusUnauthorized, "INVALID_CREDENTIALS", "メールアドレスまたはパスワードが正しくありません")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, nil, model.NewAppError(http.StatusUnauthorized, "INVALID_CREDENTIALS", "メールアドレスまたはパスワードが正しくありません")
	}

	tokens, err := s.generateTokens(ctx, user.ID)
	if err != nil {
		return nil, nil, err
	}

	return user, tokens, nil
}

func (s *AuthService) Refresh(ctx context.Context, req RefreshRequest) (*TokenPair, error) {
	if req.RefreshToken == "" {
		return nil, model.NewAppError(http.StatusBadRequest, "VALIDATION_ERROR", "リフレッシュトークンは必須です")
	}

	claims, err := s.parseToken(req.RefreshToken)
	if err != nil {
		return nil, model.NewAppError(http.StatusUnauthorized, "TOKEN_EXPIRED", "トークンが無効または期限切れです")
	}

	tokenType, _ := claims["type"].(string)
	if tokenType != "refresh" {
		return nil, model.NewAppError(http.StatusUnauthorized, "UNAUTHORIZED", "無効なトークンタイプです")
	}

	userIDStr, _ := claims["sub"].(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, model.NewAppError(http.StatusUnauthorized, "UNAUTHORIZED", "無効なトークンです")
	}

	jti, _ := claims["jti"].(string)
	revoked, err := s.rdb.Get(ctx, "revoked:"+jti).Result()
	if err == nil && revoked == "1" {
		return nil, model.NewAppError(http.StatusUnauthorized, "TOKEN_EXPIRED", "トークンは無効化されています")
	}

	// Revoke old refresh token
	s.rdb.Set(ctx, "revoked:"+jti, "1", RefreshTokenExpiry)

	return s.generateTokens(ctx, userID)
}

func (s *AuthService) Logout(ctx context.Context, accessToken string, userID uuid.UUID) error {
	claims, err := s.parseToken(accessToken)
	if err == nil {
		if jti, ok := claims["jti"].(string); ok {
			s.rdb.Set(ctx, "revoked:"+jti, "1", AccessTokenExpiry)
		}
	}
	// Revoke all refresh tokens for this user by setting a logout timestamp
	s.rdb.Set(ctx, fmt.Sprintf("logout:%s", userID.String()), time.Now().Unix(), RefreshTokenExpiry)
	return nil
}

func (s *AuthService) ValidateAccessToken(tokenString string) (uuid.UUID, error) {
	claims, err := s.parseToken(tokenString)
	if err != nil {
		return uuid.Nil, err
	}

	tokenType, _ := claims["type"].(string)
	if tokenType != "access" {
		return uuid.Nil, fmt.Errorf("invalid token type")
	}

	userIDStr, _ := claims["sub"].(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid user id in token")
	}

	return userID, nil
}

func (s *AuthService) generateTokens(ctx context.Context, userID uuid.UUID) (*TokenPair, error) {
	now := time.Now()

	accessJTI := uuid.New().String()
	accessClaims := jwt.MapClaims{
		"sub":  userID.String(),
		"type": "access",
		"jti":  accessJTI,
		"iat":  now.Unix(),
		"exp":  now.Add(AccessTokenExpiry).Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenStr, err := accessToken.SignedString(s.jwtSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to sign access token: %w", err)
	}

	refreshJTI := uuid.New().String()
	refreshClaims := jwt.MapClaims{
		"sub":  userID.String(),
		"type": "refresh",
		"jti":  refreshJTI,
		"iat":  now.Unix(),
		"exp":  now.Add(RefreshTokenExpiry).Unix(),
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenStr, err := refreshToken.SignedString(s.jwtSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to sign refresh token: %w", err)
	}

	// Store refresh token JTI in Redis
	s.rdb.Set(ctx, "refresh:"+refreshJTI, userID.String(), RefreshTokenExpiry)

	return &TokenPair{
		AccessToken:  accessTokenStr,
		RefreshToken: refreshTokenStr,
	}, nil
}

func (s *AuthService) parseToken(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	return claims, nil
}
