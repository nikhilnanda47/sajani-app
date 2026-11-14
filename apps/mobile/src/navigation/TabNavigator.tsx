// @ts-nocheck
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, elevation } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import SelectAddressScreen from '../screens/SelectAddressScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import OrderReviewScreen from '../screens/OrderReviewScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const ExploreStack = createNativeStackNavigator();
const CartStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();

const stackHeaderStyle = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.primary,
  headerTitleStyle: { fontWeight: '600', fontSize: 16 },
  headerShadowVisible: false,
  headerBackTitle: 'Back',
};

function ExploreStackScreen() {
  return (
    <ExploreStack.Navigator screenOptions={stackHeaderStyle}>
      <ExploreStack.Screen name="ExploreList" component={ExploreScreen} options={{ headerShown: false }} />
      <ExploreStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerTitle: 'Product Details' }} />
    </ExploreStack.Navigator>
  );
}

function CartStackScreen() {
  return (
    <CartStack.Navigator screenOptions={stackHeaderStyle}>
      <CartStack.Screen name="CartView" component={CartScreen} options={{ headerShown: false }} />
      <CartStack.Screen name="SelectAddress" component={SelectAddressScreen} options={{ headerTitle: 'Delivery Address' }} />
      <CartStack.Screen name="AddAddress" component={AddAddressScreen} options={{ headerTitle: 'Add Address' }} />
      <CartStack.Screen name="OrderReview" component={OrderReviewScreen} options={{ headerTitle: 'Review Order' }} />
      <CartStack.Screen name="OrderSuccess" component={OrderSuccessScreen} options={{ headerShown: false }} />
    </CartStack.Navigator>
  );
}

function OrdersStackScreen() {
  return (
    <OrdersStack.Navigator screenOptions={stackHeaderStyle}>
      <OrdersStack.Screen name="OrdersList" component={OrdersScreen} options={{ headerShown: false }} />
      <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ headerTitle: 'Order Details' }} />
    </OrdersStack.Navigator>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Explore') iconName = focused ? 'compass' : 'compass-outline';
          else if (route.name === 'Cart') iconName = focused ? 'bag' : 'bag-outline';
          else if (route.name === 'Orders') iconName = focused ? 'receipt' : 'receipt-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={22} color={focused ? colors.primary : colors.neutral} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.neutral,
        tabBarStyle: {
          backgroundColor: colors.surface,
          ...elevation.nav,
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
          letterSpacing: 0.5,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          color: colors.primary,
          fontWeight: '600' as const,
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerTitle: 'Sajani' }} />
      <Tab.Screen name="Explore" component={ExploreStackScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Cart" component={CartStackScreen} options={{ headerShown: false, headerTitle: 'Shopping Bag' }} />
      <Tab.Screen name="Orders" component={OrdersStackScreen} options={{ headerShown: false, headerTitle: 'My Orders' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
