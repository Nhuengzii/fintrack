import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Platform, Modal, TouchableOpacity, Keyboard } from 'react-native';
import { Button, Card, TextInput, Text, SegmentedButtons, IconButton, HelperText, Portal } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFinance, TransactionType, RecurrenceType } from '@/hooks/useFinance';
import { formatDate } from '@/utils/finance';

export default function TransactionForm() {
    const { addTransaction } = useFinance();
    const [type, setType] = useState<TransactionType>('income');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
    const [error, setError] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [key, setKey] = useState(0);

    // Use refs for better performance
    const amountRef = useRef<TextInput>(null);
    const descriptionRef = useRef<TextInput>(null);

    const handleSubmit = useCallback(async () => {
        try {
            if (!amount || !description) {
                setError('Please fill in all fields');
                return;
            }

            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                setError('Please enter a valid positive amount');
                return;
            }

            console.log('Submitting transaction:', {
                type,
                amount: parsedAmount,
                date: date.toISOString(),
                description,
                recurrence
            });

            await addTransaction({
                type,
                amount: parsedAmount,
                date: date.toISOString(),
                description,
                recurrence
            });

            // Reset form
            setAmount('');
            setDescription('');
            if (amountRef.current) amountRef.current.clear();
            if (descriptionRef.current) descriptionRef.current.clear();
            setDate(new Date());
            setRecurrence('none');
            setError('');
            setKey(prev => prev + 1);
            Keyboard.dismiss();

            console.log('Transaction added successfully');
        } catch (error) {
            console.error('Error adding transaction:', error);
            setError('Failed to add transaction. Please try again.');
        }
    }, [type, date, recurrence, addTransaction, amount, description]);

    const onDateChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setDate(selectedDate);
        }
    }, []);

    const DatePickerContent = () => {
        if (Platform.OS === 'ios') {
            return (
                <Portal>
                    <Modal
                        visible={showDatePicker}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setShowDatePicker(false)}
                    >
                        <TouchableOpacity
                            style={styles.modalOverlay}
                            activeOpacity={1}
                            onPress={() => setShowDatePicker(false)}
                        >
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text variant="titleMedium">Select Date</Text>
                                    <IconButton
                                        icon="close"
                                        size={24}
                                        onPress={() => setShowDatePicker(false)}
                                    />
                                </View>
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display="spinner"
                                    onChange={onDateChange}
                                    style={styles.datePicker}
                                />
                                <Button
                                    mode="contained"
                                    onPress={() => setShowDatePicker(false)}
                                    style={styles.dateButton}
                                >
                                    Done
                                </Button>
                            </View>
                        </TouchableOpacity>
                    </Modal>
                </Portal>
            );
        }

        if (showDatePicker) {
            return (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            );
        }

        return null;
    };

    return (
        <Card style={styles.card} key={key}>
            <Card.Content>
                <Text variant="titleLarge" style={styles.title}>Add Transaction</Text>
                
                <View style={styles.segmentContainer}>
                    <SegmentedButtons
                        value={type}
                        onValueChange={value => setType(value as TransactionType)}
                        buttons={[
                            { 
                                value: 'income',
                                label: 'Income',
                                style: [
                                    styles.segment,
                                    type === 'income' && styles.activeSegment,
                                    type === 'income' && styles.incomeSegment
                                ]
                            },
                            { 
                                value: 'expense',
                                label: 'Expense',
                                style: [
                                    styles.segment,
                                    type === 'expense' && styles.activeSegment,
                                    type === 'expense' && styles.expenseSegment
                                ]
                            }
                        ]}
                        style={styles.segmentedButton}
                    />
                </View>

                <TextInput
                    ref={amountRef}
                    label="Amount (฿)"
                    keyboardType="decimal-pad"
                    style={styles.input}
                    mode="outlined"
                    error={!!error}
                    value={amount}
                    onChangeText={(text) => {
                        if (text === '' || /^\d*\.?\d{0,2}$/.test(text)) {
                            setAmount(text);
                            error && setError('');
                        }
                    }}
                    right={<TextInput.Affix text="฿" />}
                />

                <TextInput
                    ref={descriptionRef}
                    label="Description"
                    style={styles.input}
                    mode="outlined"
                    error={!!error}
                    value={description}
                    onChangeText={(text) => {
                        setDescription(text);
                        error && setError('');
                    }}
                />

                <View style={styles.dateContainer}>
                    <TextInput
                        label="Date"
                        value={formatDate(date.toISOString())}
                        editable={false}
                        mode="outlined"
                        style={styles.dateInput}
                        right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                    />
                </View>

                <DatePickerContent />

                <View style={styles.recurrenceContainer}>
                    <Text variant="bodyMedium" style={styles.recurrenceLabel}>Recurrence</Text>
                    <SegmentedButtons
                        value={recurrence}
                        onValueChange={value => setRecurrence(value as RecurrenceType)}
                        buttons={[
                            {
                                value: 'none',
                                label: 'Once',
                                icon: 'calendar-blank',
                            },
                            {
                                value: 'monthly',
                                label: 'Monthly',
                                icon: 'calendar-month',
                            },
                            {
                                value: 'yearly',
                                label: 'Yearly',
                                icon: 'calendar-clock',
                            },
                        ]}
                        style={styles.recurrenceButtons}
                    />
                </View>

                {error ? <HelperText type="error" visible={!!error}>{error}</HelperText> : null}

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    style={styles.submitButton}
                >
                    Add Transaction
                </Button>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        elevation: 4,
        marginBottom: 16,
        borderRadius: 12,
    },
    title: {
        textAlign: 'center',
        marginBottom: 24,
    },
    segmentContainer: {
        marginBottom: 16,
    },
    segmentedButton: {
        backgroundColor: 'transparent',
    },
    segment: {
        flex: 1,
    },
    activeSegment: {
        borderWidth: 0,
    },
    incomeSegment: {
        backgroundColor: '#4caf50',
    },
    expenseSegment: {
        backgroundColor: '#f44336',
    },
    input: {
        marginBottom: 16,
    },
    dateContainer: {
        marginBottom: 16,
    },
    dateInput: {
        flex: 1,
    },
    recurrenceContainer: {
        marginBottom: 16,
    },
    recurrenceLabel: {
        marginBottom: 8,
    },
    recurrenceButtons: {
        marginBottom: 8,
    },
    submitButton: {
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    datePicker: {
        height: 200,
        marginVertical: 8,
    },
    dateButton: {
        marginTop: 8,
    },
});
