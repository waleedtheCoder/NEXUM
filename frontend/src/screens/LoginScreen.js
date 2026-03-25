// // import React, { useState } from 'react';
// // import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Alert } from 'react-native';
// // import { Ionicons } from '@expo/vector-icons';
// // import { useSafeAreaInsets } from 'react-native-safe-area-context';
// // import { useNavigation } from '@react-navigation/native';
// // import ScreenHeader from '../components/ScreenHeader';
// // import { useUser } from '../context/UserContext';
// // import { colors, fonts, spacing, radii } from '../constants/theme';

// // export default function LoginScreen() {
// //   const navigation = useNavigation();
// //   const insets = useSafeAreaInsets();
// //   const { login } = useUser();
// //   const [email, setEmail] = useState('');
// //   const [password, setPassword] = useState('');
// //   const [showPass, setShowPass] = useState(false);
// //   const [loading, setLoading] = useState(false);


// //   const handleLogin = async () => {
// //     if (!email || !password) { Alert.alert('Error', 'Please enter email and password.'); return; }
// //     // Demo login — navigate straight to MainApp
// //     setLoading(true);
// //     await login('demo_session', { name: 'Demo User', email }, 'shopkeeper');
// //     navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
// //     setLoading(false);
// //   };

// //   return (
// //     <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
// //       <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
// //       <ScreenHeader title="Sign In" showBack />
// //       <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
// //         <Text style={styles.label}>Email *</Text>
// //         <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor={colors.textLight} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
// //         <Text style={styles.label}>Password *</Text>
// //         <View style={styles.passWrap}>
// //           <TextInput style={styles.passInput} placeholder="Enter password" placeholderTextColor={colors.textLight} secureTextEntry={!showPass} value={password} onChangeText={setPassword} />
// //           <TouchableOpacity onPress={() => setShowPass(!showPass)}>
// //             <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
// //           </TouchableOpacity>
// //         </View>
// //         <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotWrap}>
// //           <Text style={styles.forgotText}>Forgot Password?</Text>
// //         </TouchableOpacity>
// //         <TouchableOpacity style={[styles.loginBtn, loading && styles.loginBtnDisabled]} onPress={handleLogin} disabled={loading}>
// //           <Text style={styles.loginBtnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
// //         </TouchableOpacity>
// //         <View style={styles.signupRow}>
// //           <Text style={styles.signupText}>Don't have an account?</Text>
// //           <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
// //             <Text style={styles.signupLink}> Sign Up</Text>
// //           </TouchableOpacity>
// //         </View>
// //       </ScrollView>
// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: { flex: 1, backgroundColor: colors.background },
// //   scroll: { padding: spacing.lg },
// //   label: { color: colors.primary, fontSize: 13, fontFamily: fonts.medium, marginBottom: 6, marginTop: 14 },
// //   input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: fonts.regular, color: colors.text },
// //   passWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14 },
// //   passInput: { flex: 1, paddingVertical: 12, fontSize: 14, fontFamily: fonts.regular, color: colors.text },
// //   forgotWrap: { alignSelf: 'flex-end', marginTop: 8, marginBottom: spacing.lg },
// //   forgotText: { fontSize: 13, fontFamily: fonts.medium, color: colors.primary },
// //   loginBtn: { backgroundColor: colors.accent, borderRadius: radii.md, paddingVertical: 15, alignItems: 'center', marginBottom: spacing.md },
// //   loginBtnDisabled: { opacity: 0.6 },
// //   loginBtnText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
// //   signupRow: { flexDirection: 'row', justifyContent: 'center' },
// //   signupText: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary },
// //   signupLink: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.primary },
// // });


// import React, { useState } from 'react';
// import {
//   View, Text, TextInput, TouchableOpacity,
//   StyleSheet, ScrollView, StatusBar, Alert,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useNavigation } from '@react-navigation/native';
// import ScreenHeader from '../components/ScreenHeader';
// import { colors, fonts, spacing, radii } from '../constants/theme';

// export default function LoginScreen() {
//   const navigation = useNavigation();
//   const insets = useSafeAreaInsets();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPass, setShowPass] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const handleLogin = () => {
//     if (!email || !password) {
//       Alert.alert('Error', 'Please enter email and password.');
//       return;
//     }
//     setLoading(true);
//     // Mock login — no backend needed
//     setTimeout(() => {
//       setLoading(false);
//       navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
//     }, 1000);
//   };

//   return (
//     <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
//       <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
//       <ScreenHeader title="Sign In" showBack />

//       <ScrollView
//         contentContainerStyle={styles.scroll}
//         keyboardShouldPersistTaps="handled"
//       >
//         <Text style={styles.subtitle}>
//           Enter any email and password to continue in demo mode.
//         </Text>

//         <Text style={styles.label}>Email *</Text>
//         <TextInput
//           style={styles.input}
//           placeholder="your@email.com"
//           placeholderTextColor={colors.textLight}
//           keyboardType="email-address"
//           autoCapitalize="none"
//           value={email}
//           onChangeText={setEmail}
//         />

//         <Text style={styles.label}>Password *</Text>
//         <View style={styles.passWrap}>
//           <TextInput
//             style={styles.passInput}
//             placeholder="Enter password"
//             placeholderTextColor={colors.textLight}
//             secureTextEntry={!showPass}
//             value={password}
//             onChangeText={setPassword}
//           />
//           <TouchableOpacity onPress={() => setShowPass(!showPass)}>
//             <Ionicons
//               name={showPass ? 'eye-off' : 'eye'}
//               size={20}
//               color={colors.textSecondary}
//             />
//           </TouchableOpacity>
//         </View>

//         <TouchableOpacity
//           onPress={() => navigation.navigate('ForgotPassword')}
//           style={styles.forgotWrap}
//         >
//           <Text style={styles.forgotText}>Forgot Password?</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
//           onPress={handleLogin}
//           disabled={loading}
//         >
//           <Text style={styles.loginBtnText}>
//             {loading ? 'Signing in...' : 'Sign In'}
//           </Text>
//         </TouchableOpacity>

//         {/* Demo hint */}
//         <View style={styles.demoBox}>
//           <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
//           <Text style={styles.demoText}>
//             Demo mode — type anything and tap Sign In
//           </Text>
//         </View>

//         <View style={styles.signupRow}>
//           <Text style={styles.signupText}>Don't have an account?</Text>
//           <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
//             <Text style={styles.signupLink}> Sign Up</Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: colors.background },
//   scroll: { padding: spacing.lg },
//   subtitle: {
//     fontSize: 13,
//     color: colors.textSecondary,
//     textAlign: 'center',
//     marginBottom: spacing.md,
//     lineHeight: 20,
//   },
//   label: {
//     color: colors.primary,
//     fontSize: 13,
//     fontFamily: fonts.medium,
//     marginBottom: 6,
//     marginTop: 14,
//   },
//   input: {
//     backgroundColor: colors.surface,
//     borderWidth: 1,
//     borderColor: colors.border,
//     borderRadius: radii.md,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     fontSize: 14,
//     fontFamily: fonts.regular,
//     color: colors.text,
//   },
//   passWrap: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.surface,
//     borderWidth: 1,
//     borderColor: colors.border,
//     borderRadius: radii.md,
//     paddingHorizontal: 14,
//   },
//   passInput: {
//     flex: 1,
//     paddingVertical: 12,
//     fontSize: 14,
//     fontFamily: fonts.regular,
//     color: colors.text,
//   },
//   forgotWrap: {
//     alignSelf: 'flex-end',
//     marginTop: 8,
//     marginBottom: spacing.lg,
//   },
//   forgotText: {
//     fontSize: 13,
//     fontFamily: fonts.medium,
//     color: colors.primary,
//   },
//   loginBtn: {
//     backgroundColor: colors.accent,
//     borderRadius: radii.md,
//     paddingVertical: 15,
//     alignItems: 'center',
//     marginBottom: spacing.md,
//   },
//   loginBtnDisabled: { opacity: 0.6 },
//   loginBtnText: {
//     color: '#fff',
//     fontSize: 15,
//     fontFamily: fonts.semiBold,
//   },
//   demoBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     backgroundColor: colors.primaryLight,
//     borderRadius: radii.md,
//     padding: 12,
//     marginBottom: spacing.lg,
//   },
//   demoText: {
//     flex: 1,
//     fontSize: 12,
//     fontFamily: fonts.regular,
//     color: colors.primary,
//   },
//   signupRow: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//   },
//   signupText: {
//     fontSize: 14,
//     fontFamily: fonts.regular,
//     color: colors.textSecondary,
//   },
//   signupLink: {
//     fontSize: 14,
//     fontFamily: fonts.semiBold,
//     color: colors.primary,
//   },
// });

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { colors, fonts, spacing, radii } from '../constants/theme';

export default function LoginScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    // Mock login — no backend needed
    setTimeout(() => {
      setLoading(false);
      navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
    }, 1000);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title="Sign In" showBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          Enter any email and password to continue in demo mode.
        </Text>

        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          placeholderTextColor={colors.textLight}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password *</Text>
        <View style={styles.passWrap}>
          <TextInput
            style={styles.passInput}
            placeholder="Enter password"
            placeholderTextColor={colors.textLight}
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Ionicons
              name={showPass ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.forgotWrap}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginBtnText}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        {/* Demo hint */}
        <View style={styles.demoBox}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.demoText}>
            Demo mode — type anything and tap Sign In
          </Text>
        </View>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signupLink}> Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  label: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: fonts.medium,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  passWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
  },
  passInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: spacing.lg,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  loginBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
  demoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: spacing.lg,
  },
  demoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.primary,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  signupLink: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
});