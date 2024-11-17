import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TransactionType = 'income' | 'expense';
export type RecurrenceType = 'none' | 'monthly' | 'yearly';

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    date: string;
    description: string;
    recurrence: RecurrenceType;
}

interface FinanceState {
    initialBalance: number;
    initialDate: string | null;
    transactions: Transaction[];
    targetDate: string | null;
}

const STORAGE_KEY = '@finance_data';

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const isSameMonth = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
};

const isSameYear = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear();
};

const isDateBefore = (date1: Date, date2: Date) => {
    return date1.getTime() <= date2.getTime();
};

const getMonthsBetween = (start: Date, end: Date): number => {
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
};

const getYearsBetween = (start: Date, end: Date): number => {
    return end.getFullYear() - start.getFullYear();
};

export function useFinance() {
    const [state, setState] = useState<FinanceState>({
        initialBalance: 0,
        initialDate: null,
        transactions: [],
        targetDate: null
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (data) {
                setState(JSON.parse(data));
            }
        } catch (error) {
            console.error('Error loading finance data:', error);
        }
    };

    const saveData = async (newState: FinanceState) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        } catch (error) {
            console.error('Error saving finance data:', error);
        }
    };

    const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        const newTransaction = { ...transaction, id: generateId() };
        const newState = {
            ...state,
            transactions: [...state.transactions, newTransaction]
        };
        setState(newState);
        await saveData(newState);
    };

    const deleteTransaction = async (id: string) => {
        const newState = {
            ...state,
            transactions: state.transactions.filter(t => t.id !== id)
        };
        setState(newState);
        await saveData(newState);
    };

    const setInitialBalance = async (balance: number, date: string) => {
        const newState = {
            ...state,
            initialBalance: balance,
            initialDate: date
        };
        setState(newState);
        await saveData(newState);
    };

    const setTargetDate = async (date: string | null) => {
        const newState = {
            ...state,
            targetDate: date
        };
        setState(newState);
        await saveData(newState);
    };

    const calculateRecurringAmount = (
        transaction: Transaction,
        startDate: Date,
        endDate: Date
    ): number => {
        const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;

        if (transaction.recurrence === 'none') {
            return amount;
        }

        if (transaction.recurrence === 'monthly') {
            const months = getMonthsBetween(startDate, endDate);
            return amount * (months + 1); // Include the start month
        }

        if (transaction.recurrence === 'yearly') {
            const years = getYearsBetween(startDate, endDate);
            return amount * (years + 1); // Include the start year
        }

        return amount;
    };

    const getBalanceAtDate = (targetDate: Date): number => {
        if (!state.initialDate) {
            return 0;
        }

        const initialDate = new Date(state.initialDate);
        let balance = state.initialBalance;

        state.transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);

            if (transaction.recurrence === 'none' && transactionDate > targetDate) {
                return;
            }

            if (transaction.recurrence !== 'none') {
                if (transactionDate <= targetDate) {
                    balance += calculateRecurringAmount(
                        transaction,
                        transactionDate,
                        targetDate
                    );
                }
            } else {
                if (transactionDate <= targetDate) {
                    balance += transaction.type === 'income' ? 
                        transaction.amount : -transaction.amount;
                }
            }
        });

        return balance;
    };

    const getCurrentBalance = (): number => {
        return getBalanceAtDate(new Date());
    };

    const getProjectedBalance = (date: Date): number => {
        return getBalanceAtDate(date);
    };

    const clearAllData = async () => {
        const newState = {
            initialBalance: 0,
            initialDate: null,
            transactions: [],
            targetDate: null
        };
        setState(newState);
        await saveData(newState);
    };

    return {
        initialBalance: state.initialBalance,
        initialDate: state.initialDate,
        targetDate: state.targetDate,
        transactions: state.transactions,
        currentBalance: getCurrentBalance(),
        getProjectedBalance,
        addTransaction,
        deleteTransaction,
        setInitialBalance,
        setTargetDate,
        clearAllData,
    };
}
