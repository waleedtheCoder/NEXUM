from django.urls import path

from .views import (
    AuthSessionView,
    ForgotPasswordView,
    LoginView,
    ResetPasswordView,
    SignupView,
    TokenRefreshView,       # NEW
    UserOnboardingView,
    VerifyOtpView,
)

urlpatterns = [
    # ── Existing (unchanged) ─────────────────────────────────────────────
    path('auth/signup/',          SignupView.as_view(),         name='auth-signup'),
    path('auth/login/',           LoginView.as_view(),          name='auth-login'),
    path('auth/verify-otp/',      VerifyOtpView.as_view(),      name='auth-verify-otp'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('auth/reset-password/',  ResetPasswordView.as_view(),  name='auth-reset-password'),
    path('auth/session/',         AuthSessionView.as_view(),    name='auth-session'),
    path('profile/',              UserOnboardingView.as_view(), name='user-profile'),
    # ── NEW ──────────────────────────────────────────────────────────────
    path('auth/token-refresh/',   TokenRefreshView.as_view(),   name='auth-token-refresh'),
]
