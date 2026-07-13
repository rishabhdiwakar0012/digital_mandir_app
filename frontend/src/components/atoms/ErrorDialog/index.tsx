import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Typography } from '../Typography';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

interface ErrorDialogProps {
    visible: boolean;
    title?: string;
    message: string;
    onClose: () => void;
}

const { width } = Dimensions.get('window');

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
    visible,
    title = 'Error',
    message,
    onClose,
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={styles.overlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <TouchableOpacity 
                    activeOpacity={1} 
                    style={styles.dialogContainer}
                >
                    <View style={styles.iconContainer}>
                        <LottieView
                            source={require('../../../../assets/crose.json')}
                            autoPlay
                            loop={false}
                            style={{ width: 100, height: 100 }}
                        />
                    </View>
                    
                    <Typography variant="h3" style={styles.title}>
                        {title}
                    </Typography>
                    
                    <Typography variant="body1" style={styles.message}>
                        {message}
                    </Typography>

                    <TouchableOpacity 
                        style={styles.button} 
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Typography variant="body1" style={styles.buttonText}>
                            OK
                        </Typography>
                    </TouchableOpacity>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    dialogContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        width: width - 48,
        maxWidth: 400,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        paddingTop: 10,
    },
    title: {
        color: '#212121',
        fontSize: 20,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        color: '#616161',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    button: {
        backgroundColor: '#E53935',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 16,
    },
});
