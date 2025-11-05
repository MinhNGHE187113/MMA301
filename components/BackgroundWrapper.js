import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

export default function BackgroundWrapper({ children }) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/background.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={300}
      />
      {/* overlay không căn giữa toàn bộ nữa, để phần con tự điều khiển bố cục */}
      <View style={styles.overlay}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});