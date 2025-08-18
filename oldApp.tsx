// App.js - Main React Native Time Budget App
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PieChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');

const TimeBudgetApp = () => {
  const [activities, setActivities] = useState([
    { id: 1, name: 'Sleep', daysPerWeek: 7, hoursPerSession: 8, color: '#8B5CF6' },
    { id: 2, name: 'Prepare Food', daysPerWeek: 7, hoursPerSession: 1, color: '#10B981' },
    { id: 3, name: 'Work', daysPerWeek: 5, hoursPerSession: 8, color: '#F59E0B' },
    { id: 4, name: 'Working Out', daysPerWeek: 3, hoursPerSession: 1.5, color: '#EF4444' }
  ]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [newActivity, setNewActivity] = useState({
    name: '',
    daysPerWeek: '1',
    hoursPerSession: '1'
  });
  
  const [view, setView] = useState('table'); // 'table' or 'chart'

  const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#F97316', '#06B6D4', '#84CC16', '#8B5CF6'];

  // Load data from AsyncStorage on app start
  useEffect(() => {
    loadActivities();
  }, []);

  // Save data whenever activities change
  useEffect(() => {
    saveActivities();
  }, [activities]);

  const loadActivities = async () => {
    try {
      const savedActivities = await AsyncStorage.getItem('timebudget_activities');
      if (savedActivities) {
        setActivities(JSON.parse(savedActivities));
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const saveActivities = async () => {
    try {
      await AsyncStorage.setItem('timebudget_activities', JSON.stringify(activities));
    } catch (error) {
      console.error('Error saving activities:', error);
    }
  };

  const calculateHoursPerWeek = (days, hours) => {
    return Math.round((days * hours) * 100) / 100;
  };

  const getTotalHours = () => {
    return activities.reduce((total, activity) => 
      total + calculateHoursPerWeek(activity.daysPerWeek, activity.hoursPerSession), 0
    );
  };

  const getRemainingHours = () => {
    return Math.max(0, 168 - getTotalHours());
  };

  const addActivity = () => {
    if (newActivity.name.trim()) {
      const newId = Math.max(...activities.map(a => a.id), 0) + 1;
      setActivities([...activities, {
        ...newActivity,
        id: newId,
        daysPerWeek: parseFloat(newActivity.daysPerWeek) || 1,
        hoursPerSession: parseFloat(newActivity.hoursPerSession) || 1,
        color: colors[activities.length % colors.length]
      }]);
      setNewActivity({ name: '', daysPerWeek: '1', hoursPerSession: '1' });
      setShowAddModal(false);
    }
  };

  const updateActivity = (id, field, value) => {
    setActivities(activities.map(activity =>
      activity.id === id ? { ...activity, [field]: value } : activity
    ));
  };

  const deleteActivity = (id) => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setActivities(activities.filter(activity => activity.id !== id))
        }
      ]
    );
  };

  const getPieChartData = () => {
    const data = activities.map(activity => ({
      name: activity.name,
      hours: calculateHoursPerWeek(activity.daysPerWeek, activity.hoursPerSession),
      color: activity.color,
      legendFontColor: '#333',
      legendFontSize: 12,
    }));
    
    const remaining = getRemainingHours();
    if (remaining > 0) {
      data.push({
        name: 'Unallocated',
        hours: remaining,
        color: '#E5E7EB',
        legendFontColor: '#666',
        legendFontSize: 12,
      });
    }
    
    return data;
  };

  const EditActivityModal = () => (
    <Modal
      visible={editingActivity !== null}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Activity</Text>
          
          <Text style={styles.inputLabel}>Activity Name</Text>
          <TextInput
            style={styles.textInput}
            value={editingActivity?.name || ''}
            onChangeText={(text) => setEditingActivity({...editingActivity, name: text})}
            placeholder="Activity name"
          />
          
          <Text style={styles.inputLabel}>Days per Week</Text>
          <TextInput
            style={styles.textInput}
            value={editingActivity?.daysPerWeek?.toString() || ''}
            onChangeText={(text) => setEditingActivity({...editingActivity, daysPerWeek: Math.max(1, Math.min(7, parseFloat(text) || 1))})}
            placeholder="Days per week"
            keyboardType="numeric"
          />
          
          <Text style={styles.inputLabel}>Hours per Session</Text>
          <TextInput
            style={styles.textInput}
            value={editingActivity?.hoursPerSession?.toString() || ''}
            onChangeText={(text) => setEditingActivity({...editingActivity, hoursPerSession: Math.max(0.25, parseFloat(text) || 1)})}
            placeholder="Hours per session"
            keyboardType="numeric"
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setEditingActivity(null)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={() => {
                updateActivity(editingActivity.id, 'name', editingActivity.name);
                updateActivity(editingActivity.id, 'daysPerWeek', editingActivity.daysPerWeek);
                updateActivity(editingActivity.id, 'hoursPerSession', editingActivity.hoursPerSession);
                setEditingActivity(null);
              }}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const AddActivityModal = () => (
    <Modal
      visible={showAddModal}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Activity</Text>
          
          <Text style={styles.inputLabel}>Activity Name</Text>
          <TextInput
            style={styles.textInput}
            value={newActivity.name}
            onChangeText={(text) => setNewActivity({...newActivity, name: text})}
            placeholder="Activity name"
          />
          
          <Text style={styles.inputLabel}>Days per Week</Text>
          <TextInput
            style={styles.textInput}
            value={newActivity.daysPerWeek}
            onChangeText={(text) => setNewActivity({...newActivity, daysPerWeek: text})}
            placeholder="Days per week"
            keyboardType="numeric"
          />
          
          <Text style={styles.inputLabel}>Hours per Session</Text>
          <TextInput
            style={styles.textInput}
            value={newActivity.hoursPerSession}
            onChangeText={(text) => setNewActivity({...newActivity, hoursPerSession: text})}
            placeholder="Hours per session"
            keyboardType="numeric"
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setShowAddModal(false);
                setNewActivity({ name: '', daysPerWeek: '1', hoursPerSession: '1' });
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={addActivity}
            >
              <Text style={styles.saveButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderActivityItem = ({ item }) => (
    <View style={styles.activityRow}>
      <View style={styles.activityInfo}>
        <View style={styles.activityHeader}>
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <Text style={styles.activityName}>{item.name}</Text>
        </View>
        <Text style={styles.activityDetails}>
          {item.daysPerWeek} days/week × {item.hoursPerSession} hrs = {calculateHoursPerWeek(item.daysPerWeek, item.hoursPerSession)} hrs/week
        </Text>
      </View>
      <View style={styles.activityActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditingActivity(item)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteActivity(item.id)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Time Budget</Text>
        
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.totalCard]}>
            <Text style={styles.summaryLabel}>Total Allocated</Text>
            <Text style={styles.summaryValue}>{getTotalHours()}h</Text>
          </View>
          <View style={[styles.summaryCard, styles.remainingCard]}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={styles.summaryValue}>{getRemainingHours()}h</Text>
          </View>
          <View style={[styles.summaryCard, styles.weekCard]}>
            <Text style={styles.summaryLabel}>Total Week</Text>
            <Text style={styles.summaryValue}>168h</Text>
          </View>
        </View>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, view === 'table' && styles.activeToggle]}
            onPress={() => setView('table')}
          >
            <Text style={[styles.toggleText, view === 'table' && styles.activeToggleText]}>
              Table
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, view === 'chart' && styles.activeToggle]}
            onPress={() => setView('chart')}
          >
            <Text style={[styles.toggleText, view === 'chart' && styles.activeToggleText]}>
              Chart
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {view === 'table' ? (
        <ScrollView style={styles.content}>
          {/* Add Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add New Activity</Text>
          </TouchableOpacity>

          {/* Activities List */}
          <FlatList
            data={activities}
            renderItem={renderActivityItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
          <Text style={styles.chartTitle}>Time Distribution</Text>
          
          {activities.length > 0 && (
            <View style={styles.chartContainer}>
              <PieChart
                data={getPieChartData()}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="hours"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          )}

          {/* Activity Breakdown */}
          <View style={styles.breakdown}>
            <Text style={styles.breakdownTitle}>Activity Breakdown</Text>
            {getPieChartData().map((item, index) => (
              <View key={index} style={styles.breakdownItem}>
                <View style={styles.breakdownLeft}>
                  <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                  <Text style={styles.breakdownName}>{item.name}</Text>
                </View>
                <View style={styles.breakdownRight}>
                  <Text style={styles.breakdownHours}>{item.hours}h</Text>
                  <Text style={styles.breakdownPercent}>
                    {((item.hours / 168) * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <AddActivityModal />
      <EditActivityModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
      marginTop: 35,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  totalCard: {
    backgroundColor: '#dbeafe',
  },
  remainingCard: {
    backgroundColor: '#d1fae5',
  },
  weekCard: {
    backgroundColor: '#f3f4f6',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#3b82f6',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeToggleText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  activityRow: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activityInfo: {
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  activityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  activityDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  activityActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  editButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#dc2626',
    fontWeight: '500',
  },
  chartTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  breakdown: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownHours: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  breakdownPercent: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
});

export default TimeBudgetApp;