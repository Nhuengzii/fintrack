import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Card, List, Switch, Text, Button, Portal, Dialog, TextInput, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useFinance } from '@/hooks/useFinance';
import { thbFormatter } from '@/utils/finance';

export default function SettingsScreen() {
    const { transactions, clearTransactions } = useFinance();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [currency, setCurrency] = useState('THB');
    const [backupEmail, setBackupEmail] = useState('');

    // Handle clearing all data
    const handleClearData = async () => {
        try {
            await clearTransactions();
            setShowClearDialog(false);
            Alert.alert('Success', 'All data has been cleared.');
        } catch (error) {
            Alert.alert('Error', 'Failed to clear data. Please try again.');
        }
    };

    // Handle data export
    const handleExportData = async () => {
        try {
            // Format the data nicely with proper date handling
            const exportData = {
                transactions: transactions.map(t => ({
                    ...t,
                    date: new Date(t.date).toISOString(),
                    createdAt: new Date().toISOString()
                })),
                exportDate: new Date().toISOString(),
                appVersion: '1.0.0'
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const fileName = `finance_tracker_export_${new Date().toISOString().split('T')[0]}.json`;
            
            // Save to app's documents directory
            const filePath = `${FileSystem.documentDirectory}${fileName}`;
            await FileSystem.writeAsStringAsync(filePath, dataStr, {
                encoding: FileSystem.EncodingType.UTF8
            });

            Alert.alert(
                'Export Successful',
                `Data has been exported to:\n${filePath}\n\nYou can find this file in your device's Documents folder.`,
                [
                    { 
                        text: 'OK',
                        onPress: () => setShowExportDialog(false)
                    }
                ]
            );

        } catch (error) {
            console.error('Export error:', error);
            Alert.alert(
                'Export Failed',
                'There was an error exporting your data. Please try again.'
            );
        }
    };

    // Toggle notifications
    const toggleNotifications = () => {
        setNotificationsEnabled(!notificationsEnabled);
        // In a real app, this would handle notification permissions
    };

    // Toggle dark mode
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        // In a real app, this would update the app theme
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleLarge" style={styles.title}>App Settings</Text>
                    
                    <List.Section>
                        <List.Item
                            title="Notifications"
                            description="Get alerts for recurring transactions"
                            left={props => <List.Icon {...props} icon="bell" />}
                            right={props => (
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={toggleNotifications}
                                />
                            )}
                        />
                        <Divider />
                        <List.Item
                            title="Dark Mode"
                            description="Toggle dark theme"
                            left={props => <List.Icon {...props} icon="theme-light-dark" />}
                            right={props => (
                                <Switch
                                    value={darkMode}
                                    onValueChange={toggleDarkMode}
                                />
                            )}
                        />
                        <Divider />
                        <List.Item
                            title="Currency"
                            description="Set your preferred currency"
                            left={props => <List.Icon {...props} icon="currency-usd" />}
                            right={() => (
                                <Text style={styles.rightText}>{currency}</Text>
                            )}
                            onPress={() => {
                                Alert.alert('Coming Soon', 'Currency selection will be available in a future update.');
                            }}
                        />
                    </List.Section>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleLarge" style={styles.title}>Data Management</Text>
                    
                    <List.Section>
                        <List.Item
                            title="Export Data"
                            description="Save transactions to Documents"
                            left={props => <List.Icon {...props} icon="export" />}
                            onPress={() => setShowExportDialog(true)}
                        />
                        <Divider />
                        <List.Item
                            title="Backup Email"
                            description="Set email for automatic backups"
                            left={props => <List.Icon {...props} icon="email" />}
                            right={() => (
                                <Text style={styles.rightText}>
                                    {backupEmail || 'Not set'}
                                </Text>
                            )}
                            onPress={() => {
                                Alert.alert('Coming Soon', 'Email backup will be available in a future update.');
                            }}
                        />
                        <Divider />
                        <List.Item
                            title="Clear All Data"
                            description="Remove all transactions"
                            left={props => <List.Icon {...props} icon="delete" color="#f44336" />}
                            onPress={() => setShowClearDialog(true)}
                        />
                    </List.Section>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleLarge" style={styles.title}>About</Text>
                    
                    <List.Section>
                        <List.Item
                            title="Version"
                            description="1.0.0"
                            left={props => <List.Icon {...props} icon="information" />}
                        />
                        <Divider />
                        <List.Item
                            title="Rate App"
                            description="Love the app? Rate us!"
                            left={props => <List.Icon {...props} icon="star" />}
                            onPress={() => {
                                Alert.alert('Coming Soon', 'App rating will be available once published.');
                            }}
                        />
                        <Divider />
                        <List.Item
                            title="Send Feedback"
                            description="Help us improve"
                            left={props => <List.Icon {...props} icon="message" />}
                            onPress={() => {
                                Alert.alert('Coming Soon', 'Feedback form will be available in a future update.');
                            }}
                        />
                    </List.Section>
                </Card.Content>
            </Card>

            {/* Export Data Dialog */}
            <Portal>
                <Dialog visible={showExportDialog} onDismiss={() => setShowExportDialog(false)}>
                    <Dialog.Title>Export Data</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">
                            This will export your transaction data as a JSON file to your device's Documents folder.
                        </Text>
                        <View style={styles.bulletPoints}>
                            <Text>• File will be named: finance_tracker_export_[date].json</Text>
                            <Text>• Contains all your transactions</Text>
                            <Text>• Perfect for backup purposes</Text>
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowExportDialog(false)}>Cancel</Button>
                        <Button onPress={handleExportData}>Export</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Clear Data Dialog */}
            <Portal>
                <Dialog visible={showClearDialog} onDismiss={() => setShowClearDialog(false)}>
                    <Dialog.Title>Clear All Data</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium" style={styles.warningText}>
                            This action cannot be undone. All your transactions will be permanently deleted.
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowClearDialog(false)}>Cancel</Button>
                        <Button onPress={handleClearData} textColor="#f44336">Clear</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    card: {
        margin: 16,
        elevation: 4,
    },
    title: {
        marginBottom: 16,
        fontWeight: 'bold',
    },
    rightText: {
        alignSelf: 'center',
        marginRight: 8,
        color: '#666',
    },
    warningText: {
        color: '#f44336',
    },
    bulletPoints: {
        marginTop: 8,
        marginLeft: 8,
    },
});
