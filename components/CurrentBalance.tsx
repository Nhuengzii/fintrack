import React, { useState } from 'react';
import { View, Modal, StyleSheet, TouchableWithoutFeedback, Keyboard, Platform, TouchableOpacity } from 'react-native';
import { Button, Card, TextInput, Title, Text, Portal, IconButton, HelperText, useTheme } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFinance } from '../hooks/useFinance';
import { thbFormatter, formatDate } from '../utils/finance';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function CurrentBalance() {
    const { currentBalance, setInitialBalance } = useFinance();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [initialBalance, setInitialBalanceValue] = useState('');
    const [initialDate, setInitialDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [error, setError] = useState('');
    const theme = useTheme();

    const handleSubmit = () => {
        if (!initialBalance) {
            setError('Please enter an initial balance');
            return;
        }
        
        const amount = parseFloat(initialBalance);
        if (isNaN(amount) || amount < 0) {
            setError('Please enter a valid positive amount');
            return;
        }

        setInitialBalance(amount, initialDate.toISOString());
        setIsModalVisible(false);
        setInitialBalanceValue('');
        setError('');
    };

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setInitialDate(selectedDate);
        }
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    return (
        <TouchableOpacity 
            style={styles.container} 
            onPress={() => setIsModalVisible(true)}
            activeOpacity={0.9}
        >
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientCard}
            >
                <View style={styles.balanceContainer}>
                    <Text variant="titleMedium" style={styles.label}>Current Balance</Text>
                    <Text variant="displayMedium" style={styles.balance}>
                        {thbFormatter.format(currentBalance)}
                    </Text>
                    <Text variant="bodySmall" style={styles.tapHint}>Tap to set initial balance</Text>
                </View>
            </LinearGradient>

            <Portal>
                <Modal
                    visible={isModalVisible}
                    transparent
                    onRequestClose={() => setIsModalVisible(false)}
                    animationType="fade"
                >
                    <TouchableWithoutFeedback onPress={dismissKeyboard}>
                        <View style={styles.modalOverlay}>
                            <BlurView intensity={20} tint="dark" style={styles.blurOverlay}>
                                <View style={styles.modalContent}>
                                    <Title style={styles.modalTitle}>Set Initial Balance</Title>
                                    <TextInput
                                        label="Initial Balance"
                                        value={initialBalance}
                                        onChangeText={setInitialBalanceValue}
                                        keyboardType="numeric"
                                        mode="outlined"
                                        style={styles.input}
                                        error={!!error}
                                    />
                                    {error ? <HelperText type="error">{error}</HelperText> : null}
                                    
                                    <TouchableOpacity 
                                        onPress={() => setShowDatePicker(true)}
                                        style={styles.dateButton}
                                    >
                                        <Text variant="bodyMedium">Initial Date: {formatDate(initialDate)}</Text>
                                    </TouchableOpacity>

                                    {(showDatePicker || Platform.OS === 'ios') && (
                                        <DateTimePicker
                                            value={initialDate}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={onDateChange}
                                            maximumDate={new Date()}
                                        />
                                    )}

                                    <View style={styles.buttonContainer}>
                                        <Button 
                                            mode="outlined" 
                                            onPress={() => setIsModalVisible(false)}
                                            style={styles.button}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            mode="contained" 
                                            onPress={handleSubmit}
                                            style={styles.button}
                                        >
                                            Save
                                        </Button>
                                    </View>
                                </View>
                            </BlurView>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </Portal>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    gradientCard: {
        padding: 24,
        borderRadius: 20,
    },
    balanceContainer: {
        alignItems: 'center',
    },
    label: {
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 8,
    },
    balance: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 36,
        marginBottom: 8,
    },
    tapHint: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    blurOverlay: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    modalContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 20,
        borderRadius: 20,
    },
    modalTitle: {
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        marginBottom: 10,
    },
    dateButton: {
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 10,
        marginTop: 10,
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    button: {
        flex: 1,
    },
});
