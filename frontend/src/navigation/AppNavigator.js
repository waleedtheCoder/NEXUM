import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useUser } from '../context/UserContext';

// ── Splash ──────────────────────────────────────────────────────────────────
import SplashScreen             from '../screens/SplashScreen';

// ── Auth / Onboarding Screens ───────────────────────────────────────────────
import AuthOptionsScreen        from '../screens/AuthOptionsScreen';
import SavedAccountLoginScreen  from '../screens/SavedAccountLoginScreen';
import LoginScreen              from '../screens/LoginScreen';
import EmailLoginScreen         from '../screens/EmailLoginScreen';
import SignUpScreen             from '../screens/SignUpScreen';
import OTPVerificationScreen    from '../screens/OTPVerificationScreen';
import ForgotPasswordScreen     from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen      from '../screens/ResetPasswordScreen';

// ── Onboarding (post-signup) ────────────────────────────────────────────────
import WelcomeScreen            from '../screens/WelcomeScreen';
import RoleSelectionScreen      from '../screens/RoleSelectionScreen';
import SupplierPhoneScreen      from '../screens/SupplierPhoneScreen';
import LocationsScreen          from '../screens/LocationsScreen';
import ShopkeeperCityScreen     from '../screens/ShopkeeperCityScreen';

// ── Tab Screens ─────────────────────────────────────────────────────────────
import HomeScreen               from '../screens/HomeScreen';
import MarketplaceBrowsingScreen from '../screens/MarketplaceBrowsingScreen';
import SellTabScreen            from '../screens/SellTabScreen';
import ChatListScreen           from '../screens/ChatListScreen';
import AccountTabScreen         from '../screens/AccountTabScreen';

// ── Marketplace Stack ────────────────────────────────────────────────────────
import SearchScreen             from '../screens/SearchScreen';
import CategoryBrowseScreen     from '../screens/CategoryBrowseScreen';
import CategorySelectionScreen  from '../screens/CategorySelectionScreen';
import CategoryListingsScreen   from '../screens/CategoryListingsScreen';
import ProductDetailScreen      from '../screens/ProductDetailScreen';
import SupplierProfileScreen    from '../screens/SupplierProfileScreen';
import SavedListingsScreen      from '../screens/SavedListingsScreen';

// ── Listings ─────────────────────────────────────────────────────────────────
import MyListingsScreen         from '../screens/MyListingsScreen';
import MyListingsManagementScreen from '../screens/MyListingsManagementScreen';
import CreateListingScreen      from '../screens/CreateListingScreen';

// ── Chat ─────────────────────────────────────────────────────────────────────
import ChatConversationScreen   from '../screens/ChatConversationScreen';

// ── Orders ──────────────────────────────────────────────────────────────────
import OrderHistoryScreen       from '../screens/OrderHistoryScreen';
import OrderDetailScreen        from '../screens/OrderDetailScreen';
import IncomingOrdersScreen     from '../screens/IncomingOrdersScreen';

// ── Supplier ─────────────────────────────────────────────────────────────────
import SupplierNetworkScreen    from '../screens/SupplierNetworkScreen';
import BecomeSupplierScreen     from '../screens/BecomeSupplierScreen';

// ── Account ──────────────────────────────────────────────────────────────────
import MoreMenuScreen           from '../screens/MoreMenuScreen';
import EditProfileScreen        from '../screens/EditProfileScreen';
import RestockRemindersScreen   from '../screens/RestockRemindersScreen';

import ShopkeeperDashboardScreen from '../screens/ShopkeeperDashboardScreen';

// ── Admin ─────────────────────────────────────────────────────────────────────
import ShopkeeperAIAnalyticsScreen from '../screens/ShopkeeperAIAnalyticsScreen';
import SupplierAIAnalyticsScreen   from '../screens/SupplierAIAnalyticsScreen';

import AdminDashboardScreen      from '../screens/AdminDashboardScreen';
import AdminSuppliersScreen      from '../screens/AdminSuppliersScreen';
import AdminShopkeepersScreen    from '../screens/AdminShopkeepersScreen';
import AdminProductsScreen       from '../screens/AdminProductsScreen';
import AdminUserDetailScreen     from '../screens/AdminUserDetailScreen';
import AdminVerificationsScreen  from '../screens/AdminVerificationsScreen';
import VerificationScreen        from '../screens/VerificationScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const SCREEN_OPTIONS = { headerShown: false };

// ── Bottom Tab Navigator ─────────────────────────────────────────────────────
// tabBarStyle: none — custom BottomNav component is used by each screen instead.
function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Browse"   component={MarketplaceBrowsingScreen} />
      <Tab.Screen name="Sell"     component={SellTabScreen} />
      <Tab.Screen name="ChatList" component={ChatListScreen} />
      <Tab.Screen name="Account"  component={AccountTabScreen} />
    </Tab.Navigator>
  );
}

// ── Root Stack ───────────────────────────────────────────────────────────────
function RootStack() {
  return (
    <Stack.Navigator screenOptions={SCREEN_OPTIONS} initialRouteName="Splash">

      {/* ── Splash ──────────────────────────────────────────────────────── */}
      <Stack.Screen name="Splash"   component={SplashScreen} />

      {/* ── Main tabbed app ─────────────────────────────────────────────── */}
      <Stack.Screen name="MainApp"  component={MainTabNavigator} />

      {/* ── Auth screens (lazy — pushed on demand from anywhere) ─────────── */}
      <Stack.Screen name="AuthOptions"        component={AuthOptionsScreen} />
      <Stack.Screen name="SavedAccountLogin"  component={SavedAccountLoginScreen} />
      <Stack.Screen name="Login"              component={LoginScreen} />
      <Stack.Screen name="EmailLogin"         component={EmailLoginScreen} />
      <Stack.Screen name="SignUp"             component={SignUpScreen} />
      <Stack.Screen name="OTPVerification"    component={OTPVerificationScreen} />
      <Stack.Screen name="ForgotPassword"     component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword"      component={ResetPasswordScreen} />

      {/* ── Post-signup onboarding ───────────────────────────────────────── */}
      <Stack.Screen name="Welcome"        component={WelcomeScreen} />
      <Stack.Screen name="RoleSelection"  component={RoleSelectionScreen} />
      <Stack.Screen name="SupplierPhone"    component={SupplierPhoneScreen} />
      <Stack.Screen name="Locations"        component={LocationsScreen} />
      <Stack.Screen name="ShopkeeperCity"   component={ShopkeeperCityScreen} />

      {/* ── Marketplace ─────────────────────────────────────────────────── */}
      <Stack.Screen name="Search"              component={SearchScreen} />
      <Stack.Screen name="CategoryBrowse"      component={CategoryBrowseScreen} />
      <Stack.Screen name="CategorySelection"   component={CategorySelectionScreen} />
      <Stack.Screen name="MarketplaceBrowsing" component={MarketplaceBrowsingScreen} />
      <Stack.Screen name="CategoryListings"    component={CategoryListingsScreen} />
      <Stack.Screen name="ProductDetail"       component={ProductDetailScreen} />
      <Stack.Screen name="SupplierProfile"     component={SupplierProfileScreen} />
      <Stack.Screen name="SavedListings"       component={SavedListingsScreen} />

      {/* ── Listings management ─────────────────────────────────────────── */}
      <Stack.Screen name="MyListings"           component={MyListingsScreen} />
      <Stack.Screen name="MyListingsManagement" component={MyListingsManagementScreen} />
      <Stack.Screen name="CreateListing"        component={CreateListingScreen} />

      {/* ── Chat ────────────────────────────────────────────────────────── */}
      <Stack.Screen name="ChatConversation" component={ChatConversationScreen} />

      {/* ── Orders ──────────────────────────────────────────────────────── */}
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <Stack.Screen name="OrderDetail"  component={OrderDetailScreen} />
      <Stack.Screen name="IncomingOrders" component={IncomingOrdersScreen} />

      {/* ── Supplier ────────────────────────────────────────────────────── */}
      <Stack.Screen name="SupplierAccount"  component={AccountTabScreen} />
      <Stack.Screen name="SupplierNetwork"  component={SupplierNetworkScreen} />
      <Stack.Screen name="BecomeSupplier"   component={BecomeSupplierScreen} />

      {/* ── Account ─────────────────────────────────────────────────────── */}
      <Stack.Screen name="MoreMenu"         component={MoreMenuScreen} />
      <Stack.Screen name="GuestAccount"     component={AccountTabScreen} />
      <Stack.Screen name="EditProfile"      component={EditProfileScreen} />
      <Stack.Screen name="RestockReminders" component={RestockRemindersScreen} />

      {/* ── Mode switching ───────────────────────────────────────────────── */}
      <Stack.Screen name="ShopkeeperDashboard" component={ShopkeeperDashboardScreen} />

      {/* ── AI Analytics ────────────────────────────────────────────────── */}
      <Stack.Screen name="ShopkeeperAIAnalytics" component={ShopkeeperAIAnalyticsScreen} />
      <Stack.Screen name="SupplierAIAnalytics"   component={SupplierAIAnalyticsScreen} />

      {/* ── Supplier verification ───────────────────────────────────────── */}
      <Stack.Screen name="Verification" component={VerificationScreen} />

      {/* ── Admin ───────────────────────────────────────────────────────── */}
      <Stack.Screen name="AdminDashboard"      component={AdminDashboardScreen}     />
      <Stack.Screen name="AdminSuppliers"      component={AdminSuppliersScreen}     />
      <Stack.Screen name="AdminShopkeepers"    component={AdminShopkeepersScreen}   />
      <Stack.Screen name="AdminProducts"       component={AdminProductsScreen}      />
      <Stack.Screen name="AdminUserDetail"     component={AdminUserDetailScreen}    />
      <Stack.Screen name="AdminVerifications"  component={AdminVerificationsScreen} />

    </Stack.Navigator>
  );
}

// ── Root Navigator ────────────────────────────────────────────────────────────
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
