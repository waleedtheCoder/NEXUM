from django.urls import path

from .views import (
    AuthSessionView,
    ForgotPasswordView,
    GuestSessionView,
    LoginView,
    LogoutView,
    ResetPasswordView,
    RotateSessionView,
    SignupView,
    UserOnboardingView,
    VerifyOtpView,
)

urlpatterns = [
    path('auth/signup/', SignupView.as_view(), name='auth-signup'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/verify-otp/', VerifyOtpView.as_view(), name='auth-verify-otp'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/guest-session/', GuestSessionView.as_view(), name='auth-guest-session'),
    path('auth/rotate-session/', RotateSessionView.as_view(), name='auth-rotate-session'),
    path('auth/session/', AuthSessionView.as_view(), name='auth-session'),
    path('profile/', UserOnboardingView.as_view(), name='user-profile'),
]