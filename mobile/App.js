import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import RoomDetailScreen from './src/screens/RoomDetailScreen';
import AddRoomScreen from './src/screens/AddRoomScreen';
import AddTenantScreen from './src/screens/AddTenantScreen';
import AddBillScreen from './src/screens/AddBillScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Rooms & Dues',
          tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="AddRoomTab"
        component={AddRoomScreen}
        options={{
          tabBarLabel: 'Add Room',
          tabBarIcon: ({ color, size }) => <Feather name="plus-square" color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings & Cloud',
          tabBarIcon: ({ color, size }) => <Feather name="sliders" color={color} size={size - 2} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
          <Stack.Screen name="AddRoom" component={AddRoomScreen} />
          <Stack.Screen name="AddTenant" component={AddTenantScreen} />
          <Stack.Screen
            name="AddBill"
            component={AddBillScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
