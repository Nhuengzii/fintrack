import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, List, Text, IconButton, Divider } from 'react-native-paper';
import { useFinance } from '../hooks/useFinance';
import { thbFormatter, formatDate } from '../utils/finance';

export default function TransactionList() {
    const { transactions, deleteTransaction } = useFinance();

    // Force re-render when transactions change
    useEffect(() => {
        console.log('Transactions updated:', transactions);
    }, [transactions]);

    const sortedTransactions = useMemo(() => {
        return [...transactions].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [transactions]);

    const getRecurrenceIcon = (recurrence: string) => {
        switch (recurrence) {
            case 'monthly':
                return 'calendar-month';
            case 'yearly':
                return 'calendar-clock'; 
            default:
                return 'calendar-blank';
        }
    };

    if (!transactions || transactions.length === 0) {
        return (
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleLarge" style={styles.title}>Transaction History</Text>
                    <Text variant="bodyLarge" style={styles.emptyText}>No transactions yet</Text>
                </Card.Content>
            </Card>
        );
    }

    return (
        <Card style={styles.card}>
            <Card.Content>
                <Text variant="titleLarge" style={styles.title}>Transaction History</Text>
                <ScrollView style={styles.scrollView}>
                    {sortedTransactions.map((transaction, index) => (
                        <React.Fragment key={`${transaction.id}-${index}`}>
                            {index > 0 && <Divider style={styles.divider} />}
                            <List.Item
                                title={transaction.description}
                                titleStyle={styles.transactionTitle}
                                description={formatDate(transaction.date)}
                                descriptionStyle={styles.transactionDate}
                                left={props => (
                                    <View style={styles.iconContainer}>
                                        <IconButton
                                            icon={getRecurrenceIcon(transaction.recurrence)}
                                            size={24}
                                            {...props}
                                        />
                                    </View>
                                )}
                                right={props => (
                                    <View style={styles.rightContainer}>
                                        <Text
                                            variant="bodyLarge"
                                            style={[
                                                styles.amount,
                                                transaction.type === 'income'
                                                    ? styles.incomeAmount
                                                    : styles.expenseAmount,
                                            ]}
                                        >
                                            {transaction.type === 'income' ? '+' : '-'}
                                            {thbFormatter.format(transaction.amount)}
                                        </Text>
                                        <IconButton
                                            icon="delete-outline"
                                            size={24}
                                            iconColor="#f44336"
                                            onPress={() => deleteTransaction(transaction.id)}
                                            {...props}
                                        />
                                    </View>
                                )}
                                style={styles.listItem}
                            />
                        </React.Fragment>
                    ))}
                </ScrollView>
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
    emptyText: {
        textAlign: 'center',
        padding: 16,
        color: '#666',
    },
    scrollView: {
        maxHeight: 400,
    },
    listItem: {
        paddingVertical: 8,
    },
    transactionTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    transactionDate: {
        fontSize: 14,
        color: '#666',
    },
    divider: {
        marginVertical: 4,
    },
    iconContainer: {
        justifyContent: 'center',
        marginRight: 8,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    amount: {
        fontSize: 16,
        fontWeight: '500',
        marginRight: 8,
    },
    incomeAmount: {
        color: '#4caf50',
    },
    expenseAmount: {
        color: '#f44336',
    },
});
