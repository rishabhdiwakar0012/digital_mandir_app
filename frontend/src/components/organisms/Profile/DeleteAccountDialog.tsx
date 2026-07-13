import React from 'react';
import { View, StyleSheet, Modal, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Typography, Button } from '../../atoms';
import { useColors } from '../../../theme';
import { useDeleteAccount } from '../../../api/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

interface DeleteAccountDialogProps {
    visible: boolean;
    onClose: () => void;
}

export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({ visible, onClose }) => {
    const colors = useColors();
    const { mutate: deleteAccount, isPending } = useDeleteAccount();

    const handleDelete = () => {
        deleteAccount(undefined, {
            onSuccess: () => {
                Alert.alert("Account Deleted", "Your account has been deleted successfully.");
                onClose();
            },
            onError: (error) => {
                Alert.alert("Error", "Could not delete account. Please try again later.");
            }
        });
    };

    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.dialogContainer}>
                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#999999" />
                    </TouchableOpacity>

                    {/* Trash Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="trash" size={30} color="#FF5252" />
                        </View>
                    </View>

                    {/* Title */}
                    <Typography variant="h3" style={styles.title}>
                        Delete Account?
                    </Typography>

                    {/* Description */}
                    <Typography variant="body1" style={styles.description}>
                        Are you sure you want to delete your account? This action is irreversible and all your data will be permanently removed.
                    </Typography>

                    {/* Delete Button */}
                    {isPending ? (
                        <ActivityIndicator color={colors.error} style={styles.deleteButton} />
                    ) : (
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={isPending}>
                            <Typography variant="body1" style={styles.deleteButtonText}>Delete Account</Typography>
                            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}

                    {/* Cancel Link */}
                    <TouchableOpacity onPress={onClose}>
                        <Typography variant="body1" style={styles.cancelLink}>Cancel</Typography>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    dialogContainer: {
        width: '100%',
        borderRadius: 20,
        padding: 24,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
    },
    iconContainer: {
        marginBottom: 24,
        marginTop: 16,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    deleteButton: {
        width: '100%',
        backgroundColor: '#FF5252',
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    deleteButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    cancelLink: {
        color: '#999999',
        fontSize: 16,
        textAlign: 'center',
    },
});
