import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { Card, Text, Button, TextInput, Portal, Modal, IconButton, SegmentedButtons } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFinance } from '@/hooks/useFinance';
import { thbFormatter, formatDate } from '@/utils/finance';
import { LineChart } from 'react-native-chart-kit';

export default function ChartsScreen() {
    const { transactions, getProjectedBalance, targetDate, setTargetDate } = useFinance();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [timeRange, setTimeRange] = useState<'3M' | '6M' | '1Y' | 'ALL'>('3M');

    // Calculate statistics
    const stats = useMemo(() => {
        const now = new Date();
        const rangeInMonths = timeRange === '3M' ? 3 : timeRange === '6M' ? 6 : timeRange === '1Y' ? 12 : 999;
        const cutoffDate = new Date(now.setMonth(now.getMonth() - rangeInMonths));

        const filteredTransactions = transactions.filter(t => new Date(t.date) >= cutoffDate);
        
        const totalIncome = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpense = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        // Calculate monthly data
        const monthlyData = filteredTransactions.reduce((acc, t) => {
            const date = new Date(t.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!acc[monthKey]) {
                acc[monthKey] = { income: 0, expense: 0, balance: 0 };
            }
            
            if (t.type === 'income') {
                acc[monthKey].income += t.amount;
            } else {
                acc[monthKey].expense += t.amount;
            }
            
            acc[monthKey].balance = acc[monthKey].income - acc[monthKey].expense;
            return acc;
        }, {} as Record<string, { income: number; expense: number; balance: number }>);

        return {
            totalIncome,
            totalExpense,
            monthlyData,
            savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0
        };
    }, [transactions, timeRange]);

    // Prepare chart data
    const chartData = useMemo(() => {
        const sortedMonths = Object.entries(stats.monthlyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6); // Show last 6 months

        return {
            labels: sortedMonths.map(([monthKey]) => {
                const [year, month] = monthKey.split('-');
                return `${month}/${year.slice(2)}`;
            }),
            datasets: [
                {
                    data: sortedMonths.map(([_, data]) => data.balance),
                    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue
                    strokeWidth: 2
                },
                {
                    data: sortedMonths.map(([_, data]) => data.income),
                    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green
                    strokeWidth: 2
                },
                {
                    data: sortedMonths.map(([_, data]) => data.expense),
                    color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`, // Red
                    strokeWidth: 2
                }
            ],
            legend: ['Balance', 'Income', 'Expense']
        };
    }, [stats.monthlyData]);

    const onDateChange = (event: any, date?: Date) => {
        if (date) {
            setSelectedDate(date);
            setTargetDate(date.toISOString());
        }
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleLarge" style={styles.title}>Financial Overview</Text>
                    
                    <SegmentedButtons
                        value={timeRange}
                        onValueChange={value => setTimeRange(value as typeof timeRange)}
                        buttons={[
                            { value: '3M', label: '3M' },
                            { value: '6M', label: '6M' },
                            { value: '1Y', label: '1Y' },
                            { value: 'ALL', label: 'ALL' }
                        ]}
                        style={styles.segmentedButtons}
                    />

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Income</Text>
                            <Text style={[styles.statValue, styles.incomeText]}>
                                {thbFormatter.format(stats.totalIncome)}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Expenses</Text>
                            <Text style={[styles.statValue, styles.expenseText]}>
                                {thbFormatter.format(stats.totalExpense)}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Savings Rate</Text>
                            <Text style={[styles.statValue, styles.savingsText]}>
                                {stats.savingsRate.toFixed(1)}%
                            </Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleLarge" style={styles.title}>Financial Trends</Text>
                    {Object.keys(stats.monthlyData).length > 0 ? (
                        <LineChart
                            data={chartData}
                            width={Dimensions.get('window').width - 48}
                            height={220}
                            chartConfig={{
                                backgroundColor: '#ffffff',
                                backgroundGradientFrom: '#ffffff',
                                backgroundGradientTo: '#ffffff',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                style: {
                                    borderRadius: 16
                                },
                                propsForDots: {
                                    r: '4',
                                    strokeWidth: '2',
                                },
                                propsForLabels: {
                                    fontSize: 10
                                }
                            }}
                            bezier
                            style={styles.chart}
                            fromZero
                            yAxisInterval={1}
                        />
                    ) : (
                        <Text style={styles.noDataText}>No data available for the selected period</Text>
                    )}
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleLarge" style={styles.title}>Monthly Balance</Text>
                    {Object.entries(stats.monthlyData)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([monthKey, data]) => {
                            const balance = data.income - data.expense;
                            const [year, month] = monthKey.split('-');
                            const date = new Date(parseInt(year), parseInt(month) - 1);
                            
                            return (
                                <View key={monthKey} style={styles.monthItem}>
                                    <View style={styles.monthHeader}>
                                        <Text variant="titleMedium">
                                            {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                        </Text>
                                        <Text 
                                            variant="titleMedium" 
                                            style={[
                                                styles.monthBalance,
                                                balance >= 0 ? styles.positiveBalance : styles.negativeBalance
                                            ]}
                                        >
                                            {thbFormatter.format(balance)}
                                        </Text>
                                    </View>
                                    
                                    <View style={styles.monthDetails}>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Income</Text>
                                            <Text style={[styles.detailValue, styles.incomeText]}>
                                                {thbFormatter.format(data.income)}
                                            </Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Expense</Text>
                                            <Text style={[styles.detailValue, styles.expenseText]}>
                                                {thbFormatter.format(data.expense)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleLarge" style={styles.title}>Future Balance</Text>
                    
                    <View style={styles.targetDateContainer}>
                        <TextInput
                            label="Target Date"
                            value={targetDate ? formatDate(targetDate) : 'Select Date'}
                            onPressIn={() => setShowDatePicker(true)}
                            mode="outlined"
                            editable={false}
                            right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                            style={styles.targetDateInput}
                        />
                    </View>

                    {targetDate && (
                        <View style={styles.projectedBalanceContainer}>
                            <Text variant="headlineMedium" style={styles.projectedBalance}>
                                {thbFormatter.format(getProjectedBalance(new Date(targetDate)))}
                            </Text>
                            <Text variant="bodyMedium" style={styles.projectedBalanceLabel}>
                                Projected Balance at {formatDate(targetDate)}
                            </Text>
                        </View>
                    )}

                    {Platform.OS === 'ios' ? (
                        <Portal>
                            <Modal
                                visible={showDatePicker}
                                onDismiss={() => setShowDatePicker(false)}
                                contentContainerStyle={styles.modalContent}
                            >
                                <View style={styles.modalHeader}>
                                    <Text variant="titleMedium">Select Target Date</Text>
                                    <IconButton
                                        icon="close"
                                        size={24}
                                        onPress={() => setShowDatePicker(false)}
                                    />
                                </View>
                                <DateTimePicker
                                    value={selectedDate}
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
                            </Modal>
                        </Portal>
                    ) : showDatePicker ? (
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                        />
                    ) : null}
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    card: {
        marginBottom: 16,
        borderRadius: 12,
        elevation: 4,
    },
    title: {
        textAlign: 'center',
        marginBottom: 16,
    },
    segmentedButtons: {
        marginBottom: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    incomeText: {
        color: '#4caf50',
    },
    expenseText: {
        color: '#f44336',
    },
    savingsText: {
        color: '#2196f3',
    },
    monthItem: {
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
    },
    monthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    monthBalance: {
        fontWeight: 'bold',
    },
    positiveBalance: {
        color: '#4caf50',
    },
    negativeBalance: {
        color: '#f44336',
    },
    monthDetails: {
        backgroundColor: 'white',
        borderRadius: 6,
        padding: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    detailLabel: {
        color: '#666',
        fontSize: 14,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    targetDateContainer: {
        marginBottom: 16,
    },
    targetDateInput: {
        backgroundColor: 'white',
    },
    projectedBalanceContainer: {
        alignItems: 'center',
        marginVertical: 16,
    },
    projectedBalance: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2196f3',
    },
    projectedBalanceLabel: {
        color: '#666',
        marginTop: 8,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    datePicker: {
        height: 200,
    },
    dateButton: {
        marginTop: 16,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    noDataText: {
        textAlign: 'center',
        color: '#666',
        marginVertical: 32,
    },
});
