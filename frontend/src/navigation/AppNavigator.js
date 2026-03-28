// import React from 'react';
// import { ActivityIndicator, View } from 'react-native';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { useUser } from '../context/UserContext';

// // ── Auth / Onboarding Screens ───────────────────────────────────────────────
// import LogoScreen from '../screens/LogoScreen';
// import WelcomeScreen from '../screens/WelcomeScreen';
// import ShopkeeperSupplierScreen from '../screens/ShopkeeperSupplierScreen';
// import LocationsScreen from '../screens/LocationsScreen';
// import LoginSignupOptionScreen from '../screens/LoginSignupOptionScreen';
// import LoginSelectionScreen from '../screens/LoginSelectionScreen';
// import LoginScreen from '../screens/LoginScreen';
// import EmailLoginScreen from '../screens/EmailLoginScreen';
// import SignUpScreen from '../screens/SignUpScreen';
// import OTPVerificationScreen from '../screens/OTPVerificationScreen';
// import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
// import ResetPasswordScreen from '../screens/ResetPasswordScreen';

// // ── Main App Screens ────────────────────────────────────────────────────────
// import HomeScreen from '../screens/HomeScreen';
// import SearchScreen from '../screens/SearchScreen';
// import CategoryNavigationScreen from '../screens/CategoryNavigationScreen';
// import CategorySelectionScreen from '../screens/CategorySelectionScreen';
// import MarketplaceBrowsingScreen from '../screens/MarketplaceBrowsingScreen';
// import MobileListingScreen from '../screens/MobileListingScreen';
// import ProductDetailScreen from '../screens/ProductDetailScreen';
// import MyListingsScreen from '../screens/MyListingsScreen';
// import MyListingsManagementScreen from '../screens/MyListingsManagementScreen';
// import CreateListingScreen from '../screens/CreateListingScreen';
// import ChatListScreen from '../screens/ChatListScreen';
// import ChatConversationScreen from '../screens/ChatConversationScreen';
// import AccountSettingsScreen from '../screens/AccountSettingsScreen';
// import AccountLoggedOutScreen from '../screens/AccountLoggedOutScreen';
// import AppNavigationScreen from '../screens/AppNavigationScreen';
// import NotificationsScreen from '../screens/NotificationsScreen';

// const Stack = createStackNavigator();
// const Tab = createBottomTabNavigator();

// const SCREEN_OPTIONS = { headerShown: false };

// // ── Bottom Tab Navigator ─────────────────────────────────────────────────────
// function MainTabNavigator() {
//   return (
//     <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
//       <Tab.Screen name="Home" component={HomeScreen} />
//       <Tab.Screen name="MyListings" component={MyListingsScreen} />
//       <Tab.Screen name="CategorySelection" component={CategorySelectionScreen} />
//       <Tab.Screen name="ChatList" component={ChatListScreen} />
//       <Tab.Screen name="AccountSettings" component={AccountSettingsScreen} />
//     </Tab.Navigator>
//   );
// }

// // ── Auth Stack ───────────────────────────────────────────────────────────────
// function AuthStack() {
//   return (
//     <Stack.Navigator screenOptions={SCREEN_OPTIONS}>
//       <Stack.Screen name="Welcome" component={WelcomeScreen} />
//       <Stack.Screen name="ShopkeeperSupplier" component={ShopkeeperSupplierScreen} />
//       <Stack.Screen name="Locations" component={LocationsScreen} />
//       <Stack.Screen name="LoginSignupOption" component={LoginSignupOptionScreen} />
//       <Stack.Screen name="LoginSelection" component={LoginSelectionScreen} />
//       <Stack.Screen name="Login" component={LoginScreen} />
//       <Stack.Screen name="EmailLogin" component={EmailLoginScreen} />
//       <Stack.Screen name="SignUp" component={SignUpScreen} />
//       <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
//       <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
//       <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
//     </Stack.Navigator>
//   );
// }

// // ── Root Stack ───────────────────────────────────────────────────────────────
// function RootStack() {
//   return (
//     <Stack.Navigator screenOptions={SCREEN_OPTIONS}>
//       {/* Splash */}
//       <Stack.Screen name="Logo" component={LogoScreen} />

//       {/* Auth flow */}
//       <Stack.Screen name="Auth" component={AuthStack} />

//       {/* Main tabbed app */}
//       <Stack.Screen name="MainApp" component={MainTabNavigator} />

//       {/* Screens pushed on top of any tab */}
//       <Stack.Screen name="Search" component={SearchScreen} />
//       <Stack.Screen name="CategoryNavigation" component={CategoryNavigationScreen} />
//       <Stack.Screen name="MarketplaceBrowsing" component={MarketplaceBrowsingScreen} />
//       <Stack.Screen name="MobileListing" component={MobileListingScreen} />
//       <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
//       <Stack.Screen name="MyListingsManagement" component={MyListingsManagementScreen} />
//       <Stack.Screen name="CreateListing" component={CreateListingScreen} />
//       <Stack.Screen name="ChatConversation" component={ChatConversationScreen} />
//       <Stack.Screen name="Notifications" component={NotificationsScreen} />
//       <Stack.Screen name="AppNavigation" component={AppNavigationScreen} />
//       <Stack.Screen name="AccountLoggedOut" component={AccountLoggedOutScreen} />

//       {/* Shortcuts so BottomNav can navigate directly by name */}
//       <Stack.Screen name="LoginSignupOption" component={LoginSignupOptionScreen} />
//       <Stack.Screen name="EditProfile" component={AccountSettingsScreen} />
//     </Stack.Navigator>
//   );
// }

// // ── Root Navigator with Auth Gate ────────────────────────────────────────────
// export default function AppNavigator() {
//   const { isLoading } = useUser();

//   if (isLoading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00A859' }}>
//         <ActivityIndicator size="large" color="#fff" />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       <RootStack />
//     </NavigationContainer>
//   );
// }


import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useUser } from '../context/UserContext';

// ── Auth / Onboarding Screens ───────────────────────────────────────────────
import LogoScreen from '../screens/LogoScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import ShopkeeperSupplierScreen from '../screens/ShopkeeperSupplierScreen';
import LocationsScreen from '../screens/LocationsScreen';
import LoginSignupOptionScreen from '../screens/LoginSignupOptionScreen';
import LoginSelectionScreen from '../screens/LoginSelectionScreen';
import LoginScreen from '../screens/LoginScreen';
import EmailLoginScreen from '../screens/EmailLoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

// ── Main App Screens ────────────────────────────────────────────────────────
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import CategoryNavigationScreen from '../screens/CategoryNavigationScreen';
import CategorySelectionScreen from '../screens/CategorySelectionScreen';
import MarketplaceBrowsingScreen from '../screens/MarketplaceBrowsingScreen';
import MobileListingScreen from '../screens/MobileListingScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import MyListingsManagementScreen from '../screens/MyListingsManagementScreen';
import CreateListingScreen from '../screens/CreateListingScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatConversationScreen from '../screens/ChatConversationScreen';
import AccountSettingsScreen from '../screens/AccountSettingsScreen';
import SupplierAccountScreen from '../screens/SupplierAccountScreen';
import AccountLoggedOutScreen from '../screens/AccountLoggedOutScreen';
import AppNavigationScreen from '../screens/AppNavigationScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OrderDetailScreen  from '../screens/OrderDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const SCREEN_OPTIONS = { headerShown: false };

// ── Bottom Tab Navigator ─────────────────────────────────────────────────────
function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="MyListings" component={MyListingsScreen} />
      <Tab.Screen name="CategorySelection" component={CategorySelectionScreen} />
      <Tab.Screen name="ChatList" component={ChatListScreen} />
      <Tab.Screen name="AccountSettings" component={AccountSettingsScreen} />
    </Tab.Navigator>
  );
}

// ── Auth Stack ───────────────────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="ShopkeeperSupplier" component={ShopkeeperSupplierScreen} />
      <Stack.Screen name="Locations" component={LocationsScreen} />
      <Stack.Screen name="LoginSignupOption" component={LoginSignupOptionScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="EmailLogin" component={EmailLoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

// ── Root Stack ───────────────────────────────────────────────────────────────
function RootStack() {
  return (
    <Stack.Navigator screenOptions={SCREEN_OPTIONS}>
      {/* Splash */}
      <Stack.Screen name="Logo" component={LogoScreen} />

      {/* Auth flow */}
      <Stack.Screen name="Auth" component={AuthStack} />

      {/* Main tabbed app */}
      <Stack.Screen name="MainApp" component={MainTabNavigator} />

      {/* Screens pushed on top of any tab */}
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="CategoryNavigation" component={CategoryNavigationScreen} />
      <Stack.Screen name="MarketplaceBrowsing" component={MarketplaceBrowsingScreen} />
      <Stack.Screen name="MobileListing" component={MobileListingScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="MyListingsManagement" component={MyListingsManagementScreen} />
      <Stack.Screen name="CreateListing" component={CreateListingScreen} />
      <Stack.Screen name="SupplierAccountScreen" component={SupplierAccountScreen} />
      <Stack.Screen name="ChatConversation" component={ChatConversationScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="AppNavigation" component={AppNavigationScreen} />
      <Stack.Screen name="AccountLoggedOut" component={AccountLoggedOutScreen} />

      {/* Shortcuts so any screen can navigate directly by name */}
      <Stack.Screen name="LoginSignupOption" component={LoginSignupOptionScreen} />
      <Stack.Screen name="EditProfile" component={AccountSettingsScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="LoginSelection" component={LoginSelectionScreen} />

      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <Stack.Screen name="OrderDetail"  component={OrderDetailScreen} />
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