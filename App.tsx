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
  StatusBar,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PieChart } from 'react-native-chart-kit';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

const TimeBudgetApp = () => {
  const [activities, setActivities] = useState([
    { id: 1, name: 'Sleep', daysPerWeek: 7, hoursPerSession: 8, color: '#6366F1' },
    { id: 2, name: 'Prepare Food', daysPerWeek: 7, hoursPerSession: 1, color: '#10B981' },
    { id: 3, name: 'Work', daysPerWeek: 5, hoursPerSession: 8, color: '#F59E0B' },
    { id: 4, name: 'Working Out', daysPerWeek: 3, hoursPerSession: 1.5, color: '#EF4444' }
  ]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [tempEditValues, setTempEditValues] = useState({
    name: '',
    daysPerWeek: '',
    hoursPerSession: ''
  });

  // Initialize temp values when editing activity changes
  useEffect(() => {
    if (editingActivity) {
      setTempEditValues({
        name: editingActivity.name,
        daysPerWeek: editingActivity.daysPerWeek.toString(),
        hoursPerSession: editingActivity.hoursPerSession.toString()
      });
    }
  }, [editingActivity]);
  
  const [view, setView] = useState('table'); // 'table' or 'chart'

  const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'];

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
    const data = activities.map(activity => {
      const hours = calculateHoursPerWeek(activity.daysPerWeek, activity.hoursPerSession);
      return {
        name: activity.name,
        hours: hours,
        color: activity.color,
        legendFontColor: '#1f2937',
        legendFontSize: 13,
        legendFontWeight: '600',
      };
    });
    
    const remaining = getRemainingHours();
    if (remaining > 0) {
      data.push({
        name: 'Unallocated',
        hours: remaining,
        color: '#E5E7EB',
        legendFontColor: '#6b7280',
        legendFontSize: 13,
        legendFontWeight: '600',
      });
    }
    
    return data;
  };

  const EditActivityModal = () => {
    const handleSave = () => {
      if (editingActivity) {
        updateActivity(editingActivity.id, 'name', tempEditValues.name);
        updateActivity(editingActivity.id, 'daysPerWeek', Math.max(1, Math.min(7, parseFloat(tempEditValues.daysPerWeek) || 1)));
        updateActivity(editingActivity.id, 'hoursPerSession', Math.max(0.25, parseFloat(tempEditValues.hoursPerSession) || 1));
        setEditingActivity(null);
      }
    };

    return (
      <Modal
        visible={editingActivity !== null}
        transparent={true}
        animationType="none"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Activity</Text>
            
            <Text style={styles.inputLabel}>Activity Name</Text>
            <TextInput
              style={styles.textInput}
              value={tempEditValues.name}
              onChangeText={(text) => setTempEditValues(prev => ({...prev, name: text}))}
              placeholder="Activity name"
              autoCorrect={false}
              autoCapitalize="words"
            />
            
            <Text style={styles.inputLabel}>Days per Week</Text>
            <TextInput
              style={styles.textInput}
              value={tempEditValues.daysPerWeek}
              onChangeText={(text) => setTempEditValues(prev => ({...prev, daysPerWeek: text}))}
              placeholder="Days per week"
              keyboardType="numeric"
              autoCorrect={false}
            />
            
            <Text style={styles.inputLabel}>Hours per Session</Text>
            <TextInput
              style={styles.textInput}
              value={tempEditValues.hoursPerSession}
              onChangeText={(text) => setTempEditValues(prev => ({...prev, hoursPerSession: text}))}
              placeholder="Hours per session"
              keyboardType="numeric"
              autoCorrect={false}
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
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const AddActivityModal = () => {
    const [localValues, setLocalValues] = useState({
      name: '',
      daysPerWeek: '1',
      hoursPerSession: '1'
    });

    const handleAdd = () => {
      if (localValues.name.trim()) {
        const newId = Math.max(...activities.map(a => a.id), 0) + 1;
        setActivities([...activities, {
          name: localValues.name,
          daysPerWeek: parseFloat(localValues.daysPerWeek) || 1,
          hoursPerSession: parseFloat(localValues.hoursPerSession) || 1,
          id: newId,
          color: colors[activities.length % colors.length]
        }]);
        setLocalValues({ name: '', daysPerWeek: '1', hoursPerSession: '1' });
        setShowAddModal(false);
      }
    };

    const handleCancel = () => {
      setLocalValues({ name: '', daysPerWeek: '1', hoursPerSession: '1' });
      setShowAddModal(false);
    };

    return (
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="none"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Activity</Text>
            
            <Text style={styles.inputLabel}>Activity Name</Text>
            <TextInput
              style={styles.textInput}
              value={localValues.name}
              onChangeText={(text) => setLocalValues(prev => ({...prev, name: text}))}
              placeholder="Activity name"
              autoCorrect={false}
              autoCapitalize="words"
            />
            
            <Text style={styles.inputLabel}>Days per Week</Text>
            <TextInput
              style={styles.textInput}
              value={localValues.daysPerWeek}
              onChangeText={(text) => setLocalValues(prev => ({...prev, daysPerWeek: text}))}
              placeholder="Days per week"
              keyboardType="numeric"
              autoCorrect={false}
            />
            
            <Text style={styles.inputLabel}>Hours per Session</Text>
            <TextInput
              style={styles.textInput}
              value={localValues.hoursPerSession}
              onChangeText={(text) => setLocalValues(prev => ({...prev, hoursPerSession: text}))}
              placeholder="Hours per session"
              keyboardType="numeric"
              autoCorrect={false}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleAdd}
              >
                <Text style={styles.saveButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderActivityItem = ({ item }) => (
    <View style={styles.activityCard}>
      <View style={styles.activityContent}>
        <View style={styles.activityLeft}>
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <View style={styles.activityInfo}>
            <Text style={styles.activityName}>{item.name}</Text>
            <Text style={styles.activityDetails}>
              {item.daysPerWeek}d/week × {item.hoursPerSession}h = {calculateHoursPerWeek(item.daysPerWeek, item.hoursPerSession)}h/week
            </Text>
          </View>
        </View>
        <View style={styles.activityActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditingActivity(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteActivity(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Time Budget</Text>
          
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={[
              styles.summaryCard, 
              styles.totalCard, 
              { 
                borderWidth: 4,
                borderColor: getTotalHours() >= 168 ? '#065F46' : `rgba(6, 95, 70, ${getTotalHours() / 168})`,
                borderStyle: getTotalHours() > 0 ? 'solid' : 'dashed'
              }
            ]}>
              <Text style={styles.summaryLabel}>Allocated</Text>
              <Text style={styles.summaryValue}>{getTotalHours()}h</Text>
              <Text style={styles.progressSubtext}>of 168h total</Text>
            </View>
            
            <View style={[styles.summaryCard, styles.remainingCard]}>
              <Text style={[styles.summaryLabel, styles.remainingCardText]}>Unallocated</Text>
              <Text style={[styles.summaryValue, styles.remainingCardText]}>{getRemainingHours()}h</Text>
              <Text style={[styles.progressSubtext, styles.remainingCardText]}>remaining</Text>
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
                  height={240}
                  chartConfig={{
                    backgroundColor: 'transparent',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    color: (opacity = 1) => `rgba(167, 139, 250, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    decimalPlaces: 0,
                  }}
                  accessor="hours"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  center={[10, 0]}
                  absolute={false}
                  hasLegend={true}
                  style={{
                    borderRadius: 16,
                    marginVertical: 8,
                  }}
                />
              </View>
            )}

            {/* Activity Breakdown */}
            <View style={styles.breakdown}>
              <Text style={styles.breakdownTitle}>Activity Breakdown</Text>
              {activities.map((activity, index) => (
                <View key={index} style={styles.breakdownItem}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.colorDot, { backgroundColor: activity.color }]} />
                    <View style={styles.activityInfo}>
                      <Text style={styles.breakdownName}>{activity.name}</Text>
                      <Text style={styles.breakdownDetails}>
                        {activity.hoursPerSession}h × {activity.daysPerWeek} days
                      </Text>
                    </View>
                  </View>
                  <View style={styles.breakdownRight}>
                    <Text style={styles.breakdownHours}>
                      {calculateHoursPerWeek(activity.daysPerWeek, activity.hoursPerSession)}h
                    </Text>
                    <Text style={styles.breakdownPercent}>
                      {(((calculateHoursPerWeek(activity.daysPerWeek, activity.hoursPerSession)) / 168) * 100).toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
              {getRemainingHours() > 0 && (
                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.colorDot, { backgroundColor: '#E5E7EB' }]} />
                    <View style={styles.activityInfo}>
                      <Text style={styles.breakdownName}>Unallocated</Text>
                      <Text style={styles.breakdownDetails}>Remaining time</Text>
                    </View>
                  </View>
                  <View style={styles.breakdownRight}>
                    <Text style={styles.breakdownHours}>{getRemainingHours()}h</Text>
                    <Text style={styles.breakdownPercent}>
                      {((getRemainingHours() / 168) * 100).toFixed(1)}%
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        <AddActivityModal />
        <EditActivityModal />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  totalCard: {
    backgroundColor: '#059669',
  },
  remainingCard: {
    backgroundColor: '#F1F5F9',
  },
  remainingCardText: {
    color: '#475569',
  },
  progressRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressRingContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
    opacity: 0.9,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  progressSubtext: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '500',
    opacity: 0.8,
    marginTop: 2,
  },
  breakdownDetails: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#057b96',
    shadowColor: '#057b96',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  activeToggleText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addButton: {
    backgroundColor: '#057b96',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#057b96',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  activityDetails: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  activityActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButtonText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 16,
  },
  chartTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 24,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  breakdown: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  breakdownTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownHours: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  breakdownPercent: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    fontWeight: '500',
    height: 52,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#057b96',
    marginLeft: 12,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default TimeBudgetApp;
