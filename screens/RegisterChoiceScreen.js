import {
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function RegisterChoiceScreen({ navigation }) {
    return (
        <ImageBackground
            source={require("../assets/background.png")}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>🌟 Bạn là ...</Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate("RegisterUser")}
                    >
                        <Text style={styles.buttonText}>Querent - Người xem bài</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.readerButton]}
                        onPress={() => navigation.navigate("RegisterReader")}
                    >
                        <Text style={styles.buttonText}>Reader - Người đọc bài</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1, justifyContent: "center" },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(30, 0, 60, 0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    container: {
        width: "100%",
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: 25,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#E0AAFF",
        textAlign: "center",
        marginBottom: 25,
    },
    button: {
        backgroundColor: "#9D4EDD",
        padding: 15,
        borderRadius: 12,
        marginVertical: 10,
        alignItems: "center",
    },
    readerButton: { backgroundColor: "#7B2CBF" },
    buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});