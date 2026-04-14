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
from .fcm_token_view import RegisterFCMTokenView
from .supplier_profile_view import SupplierPublicProfileView
from .network_views import SupplierNetworkView, ToggleFavouriteSupplierView
from .reminder_views import RemindersView, ReminderDetailView
from .profile_image_view import ProfileImageUploadView
from .admin_views import AdminStatsView, AdminSuppliersView, AdminShopkeepersView, AdminVerificationsView
from .verification_view import SupplierVerificationView

urlpatterns = [
    # ── Auth ─────────────────────────────────────────────────────────────
    path('auth/signup/',          SignupView.as_view(),         name='auth-signup'),
    path('auth/login/',           LoginView.as_view(),          name='auth-login'),
    path('auth/verify-otp/',      VerifyOtpView.as_view(),      name='auth-verify-otp'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('auth/reset-password/',  ResetPasswordView.as_view(),  name='auth-reset-password'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/guest-session/', GuestSessionView.as_view(), name='auth-guest-session'),
    path('auth/rotate-session/', RotateSessionView.as_view(), name='auth-rotate-session'),
    path('auth/session/',         AuthSessionView.as_view(),    name='auth-session'),
    path('auth/token-refresh/',   TokenRefreshView.as_view(),   name='auth-token-refresh'),
    # ── Profile ──────────────────────────────────────────────────────────
    path('profile/',              UserOnboardingView.as_view(),    name='user-profile'),
    path('profile/image/',        ProfileImageUploadView.as_view(), name='profile-image-upload'),
    # ── Restock Reminders ────────────────────────────────────────────────
    path('reminders/',            RemindersView.as_view(),          name='reminders-list'),
    path('reminders/<int:reminder_id>/', ReminderDetailView.as_view(), name='reminder-detail'),
    # ── Supplier / Network ────────────────────────────────────────────────
    path('fcm-token/',                   RegisterFCMTokenView.as_view(),        name='fcm-token'),
    path('supplier/<int:supplier_id>/',  SupplierPublicProfileView.as_view(),   name='supplier-profile'),
    path('network/',                     SupplierNetworkView.as_view(),         name='supplier-network'),
    path('network/toggle/',              ToggleFavouriteSupplierView.as_view(), name='network-toggle'),
    # ── Verification ─────────────────────────────────────────────────────
    path('verification/request/', SupplierVerificationView.as_view(), name='verification-request'),
    # ── Admin ────────────────────────────────────────────────────────────
    path('admin/stats/',                        AdminStatsView.as_view(),          name='admin-stats'),
    path('admin/suppliers/',                    AdminSuppliersView.as_view(),      name='admin-suppliers'),
    path('admin/shopkeepers/',                  AdminShopkeepersView.as_view(),    name='admin-shopkeepers'),
    path('admin/verifications/',                AdminVerificationsView.as_view(),  name='admin-verifications'),
    path('admin/verifications/<int:supplier_id>/', AdminVerificationsView.as_view(), name='admin-verification-approve'),
]