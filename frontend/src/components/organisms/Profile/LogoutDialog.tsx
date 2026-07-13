import React from 'react';
import { View, StyleSheet, Modal, Dimensions } from 'react-native';
import { Typography, Button } from '../../atoms';
import { useColors } from '../../../theme';
import { useLogout } from '../../../api/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface LogoutDialogProps {
    visible: boolean;
    onClose: () => void;
}

const { width } = Dimensions.get('window');

export const LogoutDialog: React.FC<LogoutDialogProps> = ({ visible, onClose }) => {
    const colors = useColors();
    const { mutate: logout, isPending } = useLogout();
    const { t } = useTranslation();

    const handleLogout = () => {
        logout(undefined, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.dialogContainer, { backgroundColor: colors.background }]}>
                    <View style={styles.iconContainer}>
                        <View style={styles.iconBackground}>
                            <Ionicons name="log-out-outline" size={32} color="#FF9C26" />
                        </View>
                    </View>
                    
                    <Typography variant="h3" style={[styles.title, { color: colors.text }]}>
                        {t('profileScreen.logoutConfirmationTitle', 'Log Out')}
                    </Typography>
                    
                    <Typography variant="body1" style={[styles.message, { color: colors.textSecondary }]}>
                        {t('profileScreen.logoutConfirmationMessage', 'Are you sure you want to log out of your account?')}
                    </Typography>

                    <View style={styles.buttonContainer}>
                        <Button
                            variant="outline"
                            title={t('common.cancel', 'Cancel')}
                            onPress={onClose}
                            disabled={isPending}
                            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 4 }}
                            textStyle={{ fontSize: 13 }}
                        />
                        <Button
                            variant="primary"
                            title={t('common.confirm', 'Log Out')}
                            onPress={handleLogout}
                            disabled={isPending}
                            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 4 }}
                            textStyle={{ fontSize: 13 }}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    dialogContainer: {
        width: width - 48,
        maxWidth: 400,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 20,
    },
    iconBackground: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFF5E6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        gap: 16,
        marginTop: 8,
    },
});
