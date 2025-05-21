// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      // tüm sekme çubuğunu gizliyoruz
      screenOptions={{
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="math"
        options={{
          // eğer yine de ikon veya başlık ekliyse kaldırabilirsiniz
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
