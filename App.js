import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Import tất cả các màn hình của bạn
import AdminDashboard from "./screens/AdminDashboard";
import ContactScreen from "./screens/ContactScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import HomeScreen from "./screens/HomeScreen";
import LifeTarotScreen from "./screens/LifeTarotScreen";
import LoginScreen from "./screens/LoginScreen";
import ReaderHome from "./screens/ReaderHome";
import RegisterChoiceScreen from './screens/RegisterChoiceScreen';
import RegisterReaderScreen from './screens/RegisterReaderScreen';
import RegisterScreen from "./screens/RegisterScreen";
import RegisterUserScreen from './screens/RegisterUserScreen';
import SettingsScreen from "./screens/SettingsScreen";
import TarotResultScreen from "./screens/TarotResultScreen";
import TarotScreen from "./screens/TarotScreen";

// ✅ Import màn hình thông báo
import NotificationsUserScreen from "./screens/NotificationsUserScreen";
import NotificationsReaderScreen from "./screens/NotificationsReaderScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home_Main" component={HomeScreen} />
      <Stack.Screen name="Tarot" component={TarotScreen} />
      <Stack.Screen name="TarotResult" component={TarotResultScreen} />
      <Stack.Screen name="LifeTarot" component={LifeTarotScreen} />
    </Stack.Navigator>
  );
}

// 🧭 Reader Stack riêng biệt để tránh lỗi "front undefined"
function ReaderStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReaderHome" component={ReaderHome} />
      <Stack.Screen
        name="NotificationsReader"
        component={NotificationsReaderScreen}
        options={{ title: "Thông báo Reader" }}
      />
    </Stack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#FFD700',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTabs') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Contact') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTabs"
        component={HomeStack}
        options={{ title: 'Trang chủ' }}
      />
      <Tab.Screen
        name="Contact"
        component={ContactScreen}
        options={{ title: 'Liên hệ' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Cài đặt' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />

        {/* Reader Stack riêng biệt */}
        <Stack.Screen name="ReaderStack" component={ReaderStack} />

        {/* Màn hình thông báo cho User */}
        <Stack.Screen
          name="NotificationsUser"
          component={NotificationsUserScreen}
          options={{ title: "Thông báo người dùng" }}
        />

        {/* Đăng ký */}
        <Stack.Screen name="RegisterChoice" component={RegisterChoiceScreen} />
        <Stack.Screen name="RegisterUser" component={RegisterUserScreen} />
        <Stack.Screen name="RegisterReader" component={RegisterReaderScreen} />

        {/* Main Tabs */}
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
