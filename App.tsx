import React from 'react'
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors, borderRadius } from './src/theme'

import { AuthProvider, useAuth } from './src/contexts/AuthContext'
import { ToastProvider } from './src/components/Toast'
import LoginScreen from './src/screens/LoginScreen'
import RegisterScreen from './src/screens/auth/RegisterScreen'

// Manager screens
import ManagerDashboard from './src/screens/manager/DashboardScreen'
import ManagerDailyPayments from './src/screens/manager/DailyPaymentsScreen'
import ManagerExpenditure from './src/screens/manager/ExpenditureScreen'
import ManagerReports from './src/screens/manager/ReportsScreen'
import ExtraPayments from './src/screens/manager/ExtraPaymentsScreen'
import Leaves from './src/screens/manager/LeavesScreen'
import Accounts from './src/screens/manager/AccountsScreen'
import Documents from './src/screens/manager/DocumentsScreen'
import Employees from './src/screens/manager/EmployeesScreen'
import Managers from './src/screens/manager/ManagersScreen'
import IncomeStats from './src/screens/manager/IncomeStatsScreen'
import Income from './src/screens/manager/IncomeScreen'
import ExpenditureForm from './src/screens/manager/forms/ExpenditureForm'
import ExtraPaymentForm from './src/screens/manager/forms/ExtraPaymentForm'
import LeaveForm from './src/screens/manager/forms/LeaveForm'
import TaxiForm from './src/screens/manager/forms/TaxiForm'
import DriverForm from './src/screens/manager/forms/DriverForm'
import DailyPaymentForm from './src/screens/manager/forms/DailyPaymentForm'
import IncomeForm from './src/screens/manager/forms/IncomeForm'
import TaxiDetail from './src/screens/manager/TaxiDetailScreen'
import DriverDetail from './src/screens/manager/DriverDetailScreen'
import ManagerSettings from './src/screens/manager/ManagerSettingsScreen'

// Driver screens
import DriverDashboard from './src/screens/driver/DashboardScreen'
import DriverPayments from './src/screens/driver/PaymentsScreen'
import DriverHistory from './src/screens/driver/HistoryScreen'
import DriverExpenditure from './src/screens/driver/ExpenditureScreen'
import QRScanScreen from './src/screens/driver/QRScanScreen'

// Employee screens
import EmployeeDashboard from './src/screens/employee/DashboardScreen'

// SuperAdmin screens
import SuperAdminDashboard from './src/screens/superadmin/DashboardScreen'
import SuperAdminDrivers from './src/screens/superadmin/DriversScreen'
import SuperAdminDriverDetail from './src/screens/superadmin/DriverDetailScreen'
import SuperAdminTaxis from './src/screens/superadmin/TaxisScreen'
import SuperAdminTaxiDetail from './src/screens/superadmin/TaxiDetailScreen'
import SuperAdminManagers from './src/screens/superadmin/ManagersScreen'
import SuperAdminManagerDetail from './src/screens/superadmin/ManagerDetailScreen'
import SuperAdminEmployees from './src/screens/superadmin/EmployeesScreen'
import SuperAdminAccounts from './src/screens/superadmin/AccountsScreen'
import SuperAdminDailyPayments from './src/screens/superadmin/DailyPaymentsScreen'
import SuperAdminDocuments from './src/screens/superadmin/DocumentsScreen'
import SuperAdminExpenditure from './src/screens/superadmin/ExpenditureScreen'
import SuperAdminExtraPayments from './src/screens/superadmin/ExtraPaymentsScreen'
import SuperAdminIncome from './src/screens/superadmin/IncomeScreen'
import SuperAdminIncomeStats from './src/screens/superadmin/IncomeStatsScreen'
import SuperAdminLeaves from './src/screens/superadmin/LeavesScreen'
import SuperAdminReports from './src/screens/superadmin/ReportsScreen'
import SuperAdminSettings from './src/screens/superadmin/SettingsScreen'
import SuperAdminOrganizations from './src/screens/superadmin/OrganizationsScreen'
import SuperAdminTaxiForm from './src/screens/superadmin/forms/TaxiForm'
import SuperAdminDriverForm from './src/screens/superadmin/forms/DriverForm'

// Platform screens
import PlatformDashboard from './src/screens/platform/DashboardScreen'
import PlatformOrganizations from './src/screens/platform/OrganizationsScreen'

type RootStackParamList = {
  Login: undefined
  Register: undefined
  ManagerTabs: undefined
  DriverTabs: undefined
  EmployeeTabs: undefined
  SuperAdminTabs: undefined
  PlatformTabs: undefined
  // Shared stack screens
  Leaves: undefined
  Documents: undefined
  Accounts: undefined
  Employees: undefined
  Managers: undefined
  IncomeStats: undefined
  Income: undefined
  TaxiForm: undefined
  DriverForm: undefined
  DailyPaymentForm: undefined
  IncomeForm: undefined
  TaxiDetail: { taxiId: string }
  DriverDetail: { driverId: string }
  ManagerSettings: undefined
  QRScan: undefined
  // SuperAdmin stack screens
  SADrivers: undefined
  SADriverDetail: { driverId: string }
  SADriverForm: undefined
  SATaxis: undefined
  SATaxiDetail: { taxiId: string }
  SATaxiForm: undefined
  SAManagers: undefined
  SAManagerDetail: { managerId: string }
  SAEmployees: undefined
  SAAccounts: undefined
  SADailyPayments: undefined
  SADocuments: undefined
  SAExpenditure: undefined
  SAExtraPayments: undefined
  SAIncome: undefined
  SAIncomeStats: undefined
  SALeaves: undefined
  SAReports: undefined
  SASettings: undefined
  SAOrganizations: undefined
  // Platform stack screens
  PlatformOrganizations: undefined
  // Modal screens
  ExpenditureForm: { taxiId?: string } | undefined
  ExtraPaymentForm: { taxiId?: string } | undefined
  LeaveForm: { taxiId?: string } | undefined
}

const tabIcon: Record<string, { focused: keyof typeof MaterialCommunityIcons.glyphMap; unfocused: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  Dashboard: { focused: 'view-dashboard', unfocused: 'view-dashboard-outline' },
  Payments: { focused: 'cash-multiple', unfocused: 'cash-multiple' },
  Expenditure: { focused: 'cash-remove', unfocused: 'cash-remove' },
  ExtraPayments: { focused: 'cash-plus', unfocused: 'cash-plus' },
  Leaves: { focused: 'calendar-remove', unfocused: 'calendar-remove-outline' },
  Reports: { focused: 'file-chart', unfocused: 'file-chart-outline' },
  History: { focused: 'history', unfocused: 'history' },
  Taxis: { focused: 'car', unfocused: 'car-outline' },
  Drivers: { focused: 'account', unfocused: 'account-outline' },
  Income: { focused: 'trending-up', unfocused: 'trending-up' },
  More: { focused: 'dots-horizontal', unfocused: 'dots-horizontal' },
  Orgs: { focused: 'domain', unfocused: 'domain' },
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator()

function useTabBarStyle() {
  const insets = useSafeAreaInsets()
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 0)
  return {
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopWidth: 0,
      elevation: 8,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      height: 56 + bottomInset,
      paddingBottom: bottomInset + 6,
      paddingTop: 6,
    } as const,
    tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const, marginTop: 2 },
  }
}

function TabBarIcon({ focused, route }: { focused: boolean; route: any }) {
  const icons = tabIcon[route.name]
  if (!icons) return null
  return (
    <View style={{ alignItems: 'center' }}>
      <MaterialCommunityIcons name={focused ? icons.focused : icons.unfocused} size={20} color={focused ? colors.primary : colors.textTertiary} />
      {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 3 }} />}
    </View>
  )
}

function ManagerTabNavigator() {
  const { tabBarStyle, tabBarLabelStyle } = useTabBarStyle()
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle,
        tabBarLabelStyle,
        tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} route={route} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={ManagerDashboard} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Payments" component={ManagerDailyPayments} options={{ tabBarLabel: 'Payments' }} />
      <Tab.Screen name="Reports" component={ManagerReports} options={{ tabBarLabel: 'Reports' }} />
    </Tab.Navigator>
  )
}

function DriverTabNavigator() {
  const { tabBarStyle, tabBarLabelStyle } = useTabBarStyle()
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle,
        tabBarLabelStyle,
        tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} route={route} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={DriverDashboard} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Payments" component={DriverPayments} options={{ tabBarLabel: 'Payments' }} />
      <Tab.Screen name="History" component={DriverHistory} options={{ tabBarLabel: 'History' }} />
      <Tab.Screen name="Expenditure" component={DriverExpenditure} options={{ tabBarLabel: 'Expenses' }} />
    </Tab.Navigator>
  )
}

function EmployeeTabNavigator() {
  const { tabBarStyle, tabBarLabelStyle } = useTabBarStyle()
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle,
        tabBarLabelStyle,
        tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} route={route} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={EmployeeDashboard} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Payments" component={ManagerDailyPayments} options={{ tabBarLabel: 'Payments' }} />
      <Tab.Screen name="Expenditure" component={ManagerExpenditure} options={{ tabBarLabel: 'Expenses' }} />
      <Tab.Screen name="Reports" component={ManagerReports} options={{ tabBarLabel: 'Reports' }} />
    </Tab.Navigator>
  )
}

function SuperAdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopWidth: 0, elevation: 8, shadowColor: '#0F172A', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, height: 60, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ focused, color }) => {
          const icons = tabIcon[route.name]
          if (!icons) return null
          return (<View style={{ alignItems: 'center' }}><MaterialCommunityIcons name={focused ? icons.focused : icons.unfocused} size={20} color={color} />{focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 3 }} />}</View>)
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={SuperAdminDashboard} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Drivers" component={SuperAdminDrivers} options={{ tabBarLabel: 'Drivers' }} />
      <Tab.Screen name="Taxis" component={SuperAdminTaxis} options={{ tabBarLabel: 'Taxis' }} />
      <Tab.Screen name="Income" component={SuperAdminIncome} options={{ tabBarLabel: 'Income' }} />
      <Tab.Screen name="Reports" component={SuperAdminReports} options={{ tabBarLabel: 'Reports' }} />
      <Tab.Screen name="More" component={SuperAdminDashboard} options={{ tabBarLabel: 'More' }} />
    </Tab.Navigator>
  )
}

function PlatformTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopWidth: 0, elevation: 8, shadowColor: '#0F172A', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, height: 60, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ focused, color }) => {
          const icons = tabIcon[route.name]
          if (!icons) return null
          return (<View style={{ alignItems: 'center' }}><MaterialCommunityIcons name={focused ? icons.focused : icons.unfocused} size={20} color={color} />{focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 3 }} />}</View>)
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={PlatformDashboard} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Orgs" component={PlatformOrganizations} options={{ tabBarLabel: 'Organizations' }} />
    </Tab.Navigator>
  )
}

function Navigator() {
  const { user, token, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    )
  }

  const role = user?.role?.toLowerCase()
  const isManager = role === 'manager' || role === 'orgadmin'
  const isSuperAdmin = role === 'superadmin'
  const isPlatform = role === 'platformadmin'
  const isEmployee = role === 'employee'
  const isDriver = role === 'driver'

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token && user ? (
          <>
            {isSuperAdmin ? (
              <Stack.Screen name="SuperAdminTabs" component={SuperAdminTabNavigator} />
            ) : isPlatform ? (
              <Stack.Screen name="PlatformTabs" component={PlatformTabNavigator} />
            ) : isEmployee ? (
              <Stack.Screen name="EmployeeTabs" component={EmployeeTabNavigator} />
            ) : isManager ? (
              <Stack.Screen name="ManagerTabs" component={ManagerTabNavigator} />
            ) : isDriver ? (
              <Stack.Screen name="DriverTabs" component={DriverTabNavigator} />
            ) : (
              <Stack.Screen name="ManagerTabs" component={ManagerTabNavigator} />
            )}

            {/* Shared stack screens */}
            <Stack.Screen name="Leaves" component={Leaves} options={{ headerShown: false }} />
            <Stack.Screen name="Documents" component={Documents} options={{ headerShown: false }} />
            <Stack.Screen name="Accounts" component={Accounts} options={{ headerShown: false }} />
            <Stack.Screen name="Employees" component={Employees} options={{ headerShown: false }} />
            <Stack.Screen name="Managers" component={Managers} options={{ headerShown: false }} />
            <Stack.Screen name="IncomeStats" component={IncomeStats} options={{ headerShown: false }} />
            <Stack.Screen name="Income" component={Income} options={{ headerShown: false }} />
            <Stack.Screen name="TaxiForm" component={TaxiForm} options={{ headerShown: false }} />
            <Stack.Screen name="DriverForm" component={DriverForm} options={{ headerShown: false }} />
            <Stack.Screen name="DailyPaymentForm" component={DailyPaymentForm} options={{ headerShown: false }} />
            <Stack.Screen name="IncomeForm" component={IncomeForm} options={{ headerShown: false }} />
            <Stack.Screen name="TaxiDetail" component={TaxiDetail} options={{ headerShown: false }} />
            <Stack.Screen name="DriverDetail" component={DriverDetail} options={{ headerShown: false }} />
            <Stack.Screen name="ManagerSettings" component={ManagerSettings} options={{ headerShown: false }} />
            <Stack.Screen name="QRScan" component={QRScanScreen} options={{ headerShown: false }} />

            {/* SuperAdmin stack screens */}
            <Stack.Screen name="SADrivers" component={SuperAdminDrivers} options={{ headerShown: true, title: 'Drivers' }} />
            <Stack.Screen name="SADriverDetail" component={SuperAdminDriverDetail} options={{ headerShown: true, title: 'Driver Details' }} />
            <Stack.Screen name="SADriverForm" component={SuperAdminDriverForm} options={{ headerShown: true, title: 'Add Driver' }} />
            <Stack.Screen name="SATaxis" component={SuperAdminTaxis} options={{ headerShown: true, title: 'Taxis' }} />
            <Stack.Screen name="SATaxiDetail" component={SuperAdminTaxiDetail} options={{ headerShown: true, title: 'Taxi Details' }} />
            <Stack.Screen name="SATaxiForm" component={SuperAdminTaxiForm} options={{ headerShown: true, title: 'Add Taxi' }} />
            <Stack.Screen name="SAManagers" component={SuperAdminManagers} options={{ headerShown: true, title: 'Managers' }} />
            <Stack.Screen name="SAManagerDetail" component={SuperAdminManagerDetail} options={{ headerShown: true, title: 'Manager Details' }} />
            <Stack.Screen name="SAEmployees" component={SuperAdminEmployees} options={{ headerShown: true, title: 'Employees' }} />
            <Stack.Screen name="SAAccounts" component={SuperAdminAccounts} options={{ headerShown: true, title: 'Accounts' }} />
            <Stack.Screen name="SADailyPayments" component={SuperAdminDailyPayments} options={{ headerShown: true, title: 'Daily Payments' }} />
            <Stack.Screen name="SADocuments" component={SuperAdminDocuments} options={{ headerShown: true, title: 'Documents' }} />
            <Stack.Screen name="SAExpenditure" component={SuperAdminExpenditure} options={{ headerShown: true, title: 'Expenses' }} />
            <Stack.Screen name="SAExtraPayments" component={SuperAdminExtraPayments} options={{ headerShown: true, title: 'Extra Payments' }} />
            <Stack.Screen name="SAIncome" component={SuperAdminIncome} options={{ headerShown: true, title: 'Income' }} />
            <Stack.Screen name="SAIncomeStats" component={SuperAdminIncomeStats} options={{ headerShown: true, title: 'Income Stats' }} />
            <Stack.Screen name="SALeaves" component={SuperAdminLeaves} options={{ headerShown: true, title: 'Leaves' }} />
            <Stack.Screen name="SAReports" component={SuperAdminReports} options={{ headerShown: true, title: 'Reports' }} />
            <Stack.Screen name="SASettings" component={SuperAdminSettings} options={{ headerShown: true, title: 'Settings' }} />
            <Stack.Screen name="SAOrganizations" component={SuperAdminOrganizations} options={{ headerShown: true, title: 'Organizations' }} />

            {/* Platform stack screens */}
            <Stack.Screen name="PlatformOrganizations" component={PlatformOrganizations} options={{ headerShown: true, title: 'Organizations' }} />

            {/* Modal group */}
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              <Stack.Screen name="ExpenditureForm" component={ExpenditureForm} options={{ headerShown: true, title: 'Record Expense' }} />
              <Stack.Screen name="ExtraPaymentForm" component={ExtraPaymentForm} options={{ headerShown: true, title: 'Extra Payment' }} />
              <Stack.Screen name="LeaveForm" component={LeaveForm} options={{ headerShown: true, title: 'Leave Day' }} />
            </Stack.Group>
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: true, title: 'Register' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <ToastProvider>
            <Navigator />
          </ToastProvider>
          <StatusBar style="dark" />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
})
