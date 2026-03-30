import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useUser } from '../context/UserContext';

// ── Auth / Onboarding Screens ───────────────────────────────────────────────
import SplashScreen             from '../screens/SplashScreen';
import WelcomeScreen            from '../screens/WelcomeScreen';
import RoleSelectionScreen      from '../screens/RoleSelectionScreen';
import LocationsScreen          from '../screens/LocationsScreen';
import AuthOptionsScreen        from '../screens/AuthOptionsScreen';
import SavedAccountLoginScreen  from '../screens/SavedAccountLoginScreen';
import LoginScreen              from '../screens/LoginScreen';
import EmailLoginScreen         from '../screens/EmailLoginScreen';
import SignUpScreen             from '../screens/SignUpScreen';
import OTPVerificationScreen    from '../screens/OTPVerificationScreen';
import ForgotPasswordScreen     from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen      from '../screens/ResetPasswordScreen';

// ── Main App Screens ────────────────────────────────────────────────────────
import HomeScreen                 from '../screens/HomeScreen';
import SearchScreen               from '../screens/SearchScreen';
import CategoryBrowseScreen       from '../screens/CategoryBrowseScreen';
import CategorySelectionScreen    from '../screens/CategorySelectionScreen';
import MarketplaceBrowsingScreen  from '../screens/MarketplaceBrowsingScreen';
import CategoryListingsScreen     from '../screens/CategoryListingsScreen';
import ProductDetailScreen        from '../screens/ProductDetailScreen';
import MyListingsScreen           from '../screens/MyListingsScreen';
import MyListingsManagementScreen from '../screens/MyListingsManagementScreen';
import CreateListingScreen        from '../screens/CreateListingScreen';
import ChatListScreen             from '../screens/ChatListScreen';
import ChatConversationScreen     from '../screens/ChatConversationScreen';
import AccountSettingsScreen      from '../screens/AccountSettingsScreen';
import SupplierAccountScreen      from '../screens/SupplierAccountScreen';
import GuestAccountScreen         from '../screens/GuestAccountScreen';
import MoreMenuScreen             from '../screens/MoreMenuScreen';
import NotificationsScreen        from '../screens/NotificationsScreen';
import OrderHistoryScreen         from '../screens/OrderHistoryScreen';
import OrderDetailScreen          from '../screens/OrderDetailScreen';

// ── Phase 2 new screens ─────────────────────────────────────────────────────
import SupplierProfileScreen      from '../screens/SupplierProfileScreen';

// ── Phase 3 new screens ─────────────────────────────────────────────────────
import SavedListingsScreen        from '../screens/SavedListingsScreen';
import IncomingOrdersScreen       from '../screens/IncomingOrdersScreen';

// ── New screens (edit profile + restock reminders) ──────────────────────────
import EditProfileScreen          from '../screens/EditProfileScreen';
import RestockRemindersScreen     from '../screens/RestockRemindersScreen';

// ── Supplier Network + mode-switching screens ────────────────────────────────
import SupplierNetworkScreen         from '../screens/SupplierNetworkScreen';
import ShopkeeperDashboardScreen     from '../screens/ShopkeeperDashboardScreen';
import BecomeSupplierScreen          from '../screens/BecomeSupplierScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const SCREEN_OPTIONS = { headerShown: false };

// ── Bottom Tab Navigator ─────────────────────────────────────────────────────
function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tab.Screen name="Home"              component={HomeScreen} />
      <Tab.Screen name="MyListings"        component={MyListingsScreen} />
      <Tab.Screen name="CategorySelection" component={CategorySelectionScreen} />
      <Tab.Screen name="ChatList"          component={ChatListScreen} />
      <Tab.Screen name="AccountSettings"   component={AccountSettingsScreen} />
    </Tab.Navigator>
  );
}

// ── Auth Stack ───────────────────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="Welcome"            component={WelcomeScreen} />
      <Stack.Screen name="RoleSelection"      component={RoleSelectionScreen} />
      <Stack.Screen name="Locations"          component={LocationsScreen} />
      <Stack.Screen name="AuthOptions"        component={AuthOptionsScreen} />
      <Stack.Screen name="Login"              component={LoginScreen} />
      <Stack.Screen name="EmailLogin"         component={EmailLoginScreen} />
      <Stack.Screen name="SignUp"             component={SignUpScreen} />
      <Stack.Screen name="OTPVerification"    component={OTPVerificationScreen} />
      <Stack.Screen name="ForgotPassword"     component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword"      component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

// ── Root Stack ───────────────────────────────────────────────────────────────
function RootStack() {
  return (
    <Stack.Navigator screenOptions={SCREEN_OPTIONS}>

      {/* Splash */}
      <Stack.Screen name="Splash"           component={SplashScreen} />

      {/* Auth / onboarding flow */}
      <Stack.Screen name="Auth"             component={AuthStack} />
      <Stack.Screen name="SavedAccountLogin" component={SavedAccountLoginScreen} />
      <Stack.Screen name="AuthOptions"       component={AuthOptionsScreen} />

      {/* Main tabbed app */}
      <Stack.Screen name="MainApp" component={MainTabNavigator} />

      {/* ── Marketplace ─────────────────────────────────────────────────── */}
      <Stack.Screen name="Search"              component={SearchScreen} />
      <Stack.Screen name="CategoryBrowse"      component={CategoryBrowseScreen} />
      <Stack.Screen name="MarketplaceBrowsing" component={MarketplaceBrowsingScreen} />
      <Stack.Screen name="CategoryListings"    component={CategoryListingsScreen} />
      <Stack.Screen name="ProductDetail"       component={ProductDetailScreen} />
      <Stack.Screen name="SupplierProfile"     component={SupplierProfileScreen} />

      {/* ── Saved listings ──────────────────────────────────────────────── */}
      <Stack.Screen name="SavedListings"       component={SavedListingsScreen} />

      {/* ── Listings management ─────────────────────────────────────────── */}
      <Stack.Screen name="MyListingsManagement" component={MyListingsManagementScreen} />
      <Stack.Screen name="CreateListing"        component={CreateListingScreen} />

      {/* ── Supplier ────────────────────────────────────────────────────── */}
      <Stack.Screen name="SupplierAccount" component={SupplierAccountScreen} />
      <Stack.Screen name="IncomingOrders"  component={IncomingOrdersScreen} />

      {/* ── Chat ────────────────────────────────────────────────────────── */}
      <Stack.Screen name="ChatConversation" component={ChatConversationScreen} />

      {/* ── Notifications ───────────────────────────────────────────────── */}
      <Stack.Screen name="Notifications" component={NotificationsScreen} />

      {/* ── Orders (shopkeeper) ─────────────────────────────────────────── */}
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <Stack.Screen name="OrderDetail"  component={OrderDetailScreen} />

      {/* ── Supplier Network + mode switching ───────────────────────────── */}
      <Stack.Screen name="SupplierNetwork"      component={SupplierNetworkScreen} />
      <Stack.Screen name="ShopkeeperDashboard"  component={ShopkeeperDashboardScreen} />
      <Stack.Screen name="BecomeSupplier"       component={BecomeSupplierScreen} />

      {/* ── Account ─────────────────────────────────────────────────────── */}
      <Stack.Screen name="MoreMenu"          component={MoreMenuScreen} />
      <Stack.Screen name="GuestAccount"      component={GuestAccountScreen} />
      <Stack.Screen name="EditProfile"       component={EditProfileScreen} />
      <Stack.Screen name="RestockReminders"  component={RestockRemindersScreen} />

    </Stack.Navigator>
  );
}

// ── Root Navigator with Auth Gate ────────────────────────────────────────────
export default function AppNavigator() {
  const { isLoading } = useUser();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00A859' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}