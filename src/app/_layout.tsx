import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Package, Calendar, History, Settings } from 'lucide-react-native';
import { Palette } from '@/constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import { AuthScreen } from '@/components/AuthScreen';

function MainTabs() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Palette.cream }}>
        <ActivityIndicator size="large" color={Palette.forest} />
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <DataProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Palette.forest,
          tabBarInactiveTintColor: '#8B958F',
          tabBarStyle: {
            backgroundColor: Palette.white,
            borderTopColor: Palette.cardBorder,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 10,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: Palette.white,
            borderBottomColor: Palette.cardBorder,
            borderBottomWidth: 1,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: {
            fontWeight: '700',
            color: Palette.charcoal,
            fontSize: 18,
          },
          headerTintColor: Palette.forest,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarLabel: 'Inicio',
            tabBarIcon: ({ color, size }) => <Home size={size || 22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="objects"
          options={{
            title: 'Mis Objetos',
            tabBarLabel: 'Objetos',
            tabBarIcon: ({ color, size }) => <Package size={size || 22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Calendario',
            tabBarLabel: 'Calendario',
            tabBarIcon: ({ color, size }) => <Calendar size={size || 22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Historial',
            tabBarLabel: 'Historial',
            tabBarIcon: ({ color, size }) => <History size={size || 22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Ajustes',
            tabBarLabel: 'Ajustes',
            tabBarIcon: ({ color, size }) => <Settings size={size || 22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </DataProvider>
  );
}

export default function AppLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <MainTabs />
    </AuthProvider>
  );
}
