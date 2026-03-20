import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  ListRenderItem,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PieChart } from 'react-native-chart-kit';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

const ACTIVITY_STORAGE_KEY = 'timebudget_activities';
const THEME_STORAGE_KEY = 'timebudget_theme_preference';

type ThemeMode = 'light' | 'dark';
type ThemePreference = ThemeMode | 'system';
type ViewMode = 'table' | 'chart';

type Activity = {
  id: number;
  name: string;
  daysPerWeek: number;
  hoursPerSession: number;
  color: string;
};

type ThemePalette = {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  divider: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentShadow: string;
  successCard: string;
  successBorderRgb: string;
  remainingCardBackground: string;
  remainingCardText: string;
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;
  modalOverlay: string;
  shadow: string;
  dangerBackground: string;
  dangerText: string;
  unallocated: string;
  editButtonBackground: string;
  editButtonText: string;
  statusBarStyle: 'dark-content' | 'light-content';
};

const defaultActivities: Activity[] = [
  { id: 1, name: 'Sleep', daysPerWeek: 7, hoursPerSession: 8, color: '#6366F1' },
  { id: 2, name: 'Prepare Food', daysPerWeek: 7, hoursPerSession: 1, color: '#10B981' },
  { id: 3, name: 'Work', daysPerWeek: 5, hoursPerSession: 8, color: '#F59E0B' },
  { id: 4, name: 'Working Out', daysPerWeek: 3, hoursPerSession: 1.5, color: '#EF4444' },
];

const activityColors = [
  '#6366F1',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#EC4899',
  '#6B7280',
];

const themeOptions: { key: ThemePreference; label: string }[] = [
  { key: 'light', label: 'Light' },
  { key: 'system', label: 'System' },
  { key: 'dark', label: 'Dark' },
];

const palettes: Record<ThemeMode, ThemePalette> = {
  light: {
    background: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceMuted: '#E2E8F0',
    border: '#E2E8F0',
    divider: '#F1F5F9',
    textPrimary: '#1E293B',
    textSecondary: '#475569',
    textMuted: '#64748B',
    accent: '#057B96',
    accentShadow: '#03697F',
    successCard: '#059669',
    successBorderRgb: '6, 95, 70',
    remainingCardBackground: '#F1F5F9',
    remainingCardText: '#475569',
    inputBackground: '#F8FAFC',
    inputBorder: '#E2E8F0',
    inputPlaceholder: '#94A3B8',
    modalOverlay: 'rgba(30, 41, 59, 0.6)',
    shadow: '#000000',
    dangerBackground: '#FEF2F2',
    dangerText: '#DC2626',
    unallocated: '#E5E7EB',
    editButtonBackground: '#F1F5F9',
    editButtonText: '#475569',
    statusBarStyle: 'dark-content',
  },
  dark: {
    background: '#020617',
    surface: '#0F172A',
    surfaceMuted: '#1E293B',
    border: '#334155',
    divider: '#1E293B',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    accent: '#38BDF8',
    accentShadow: '#0EA5E9',
    successCard: '#047857',
    successBorderRgb: '52, 211, 153',
    remainingCardBackground: '#111827',
    remainingCardText: '#E2E8F0',
    inputBackground: '#0B1120',
    inputBorder: '#334155',
    inputPlaceholder: '#64748B',
    modalOverlay: 'rgba(2, 6, 23, 0.82)',
    shadow: '#000000',
    dangerBackground: '#3F1D1D',
    dangerText: '#FCA5A5',
    unallocated: '#475569',
    editButtonBackground: '#1E293B',
    editButtonText: '#E2E8F0',
    statusBarStyle: 'light-content',
  },
};

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: theme.surface,
      padding: 24,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: 24,
      marginTop: 40,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    summaryCard: {
      flex: 1,
      padding: 20,
      borderRadius: 16,
      marginHorizontal: 6,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
      elevation: 6,
    },
    totalCard: {
      backgroundColor: theme.successCard,
    },
    remainingCard: {
      backgroundColor: theme.remainingCardBackground,
    },
    remainingCardText: {
      color: theme.remainingCardText,
    },
    summaryLabel: {
      fontSize: 13,
      color: '#FFFFFF',
      fontWeight: '600',
      opacity: 0.92,
    },
    summaryValue: {
      fontSize: 24,
      fontWeight: '800',
      color: '#FFFFFF',
      marginTop: 2,
    },
    progressSubtext: {
      fontSize: 11,
      color: '#FFFFFF',
      fontWeight: '500',
      opacity: 0.82,
      marginTop: 2,
    },
    preferenceToggle: {
      flexDirection: 'row',
      backgroundColor: theme.surfaceMuted,
      borderRadius: 12,
      padding: 4,
    },
    preferenceButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    preferenceButtonActive: {
      backgroundColor: theme.accent,
      shadowColor: theme.accentShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 3,
    },
    preferenceButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    preferenceButtonTextActive: {
      color: '#FFFFFF',
    },
    viewToggle: {
      flexDirection: 'row',
      backgroundColor: theme.surfaceMuted,
      borderRadius: 12,
      padding: 4,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
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
      backgroundColor: theme.accent,
      shadowColor: theme.accentShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    toggleText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    activeToggleText: {
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    contentContainer: {
      paddingBottom: 96,
    },
    addButton: {
      backgroundColor: theme.accent,
      padding: 18,
      borderRadius: 16,
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: theme.accentShadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 12,
      elevation: 8,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
    },
    activityCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.14,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.border,
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
      shadowColor: theme.shadow,
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
      color: theme.textPrimary,
      marginBottom: 2,
    },
    activityDetails: {
      fontSize: 13,
      color: theme.textMuted,
      fontWeight: '500',
    },
    activityActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    editButton: {
      backgroundColor: theme.editButtonBackground,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      marginRight: 8,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    editButtonText: {
      color: theme.editButtonText,
      fontWeight: '600',
      fontSize: 14,
    },
    deleteButton: {
      backgroundColor: theme.dangerBackground,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    deleteButtonText: {
      color: theme.dangerText,
      fontWeight: '700',
      fontSize: 16,
    },
    chartTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: 24,
    },
    chartContainer: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
      marginBottom: 24,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
      elevation: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    pieChart: {
      borderRadius: 16,
      marginVertical: 8,
    },
    breakdown: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 24,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
      elevation: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    breakdownTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 20,
    },
    breakdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    breakdownLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    breakdownName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    breakdownDetails: {
      fontSize: 12,
      color: theme.textMuted,
      fontWeight: '500',
      marginTop: 1,
    },
    breakdownRight: {
      alignItems: 'flex-end',
    },
    breakdownHours: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    breakdownPercent: {
      fontSize: 13,
      color: theme.textMuted,
      fontWeight: '500',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      padding: 28,
      width: '100%',
      maxWidth: 400,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: 24,
    },
    inputLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 2,
      borderColor: theme.inputBorder,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      marginBottom: 20,
      backgroundColor: theme.inputBackground,
      color: theme.textPrimary,
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
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    cancelButton: {
      backgroundColor: theme.surfaceMuted,
      marginRight: 12,
    },
    cancelButtonText: {
      color: theme.textSecondary,
      fontWeight: '600',
      fontSize: 16,
    },
    saveButton: {
      backgroundColor: theme.accent,
      marginLeft: 12,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 16,
    },
    themeFab: {
      position: 'absolute',
      right: 20,
      bottom: 24,
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 10,
    },
    themeFabLabel: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.textPrimary,
      letterSpacing: -0.5,
    },
    themeSheetOverlay: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: 'flex-end',
    },
    modalDismissLayer: {
      ...StyleSheet.absoluteFillObject,
    },
    themeSheetContent: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 28,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.18,
      shadowRadius: 18,
      elevation: 18,
    },
    themeSheetHandle: {
      width: 42,
      height: 4,
      borderRadius: 999,
      backgroundColor: theme.border,
      alignSelf: 'center',
      marginBottom: 18,
    },
    themeSheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    themeSheetTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    themeSheetSubtitle: {
      marginTop: 4,
      fontSize: 13,
      fontWeight: '500',
      color: theme.textMuted,
    },
    themeSheetClose: {
      backgroundColor: theme.surfaceMuted,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
    },
    themeSheetCloseText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textSecondary,
    },
  });

const TimeBudgetApp = () => {
  const systemColorScheme = useColorScheme();
  const [activities, setActivities] = useState<Activity[]>(defaultActivities);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [tempEditValues, setTempEditValues] = useState({
    name: '',
    daysPerWeek: '',
    hoursPerSession: '',
  });
  const [newActivityValues, setNewActivityValues] = useState({
    name: '',
    daysPerWeek: '1',
    hoursPerSession: '1',
  });
  const [view, setView] = useState<ViewMode>('table');
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [hasLoadedData, setHasLoadedData] = useState(false);

  const resolvedTheme: ThemeMode =
    themePreference === 'system'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : themePreference;
  const isDarkMode = resolvedTheme === 'dark';
  const theme = palettes[resolvedTheme];
  const styles = createStyles(theme);
  const totalHours = activities.reduce(
    (total, activity) =>
      total +
      Math.round(activity.daysPerWeek * activity.hoursPerSession * 100) / 100,
    0,
  );
  const remainingHours = Math.max(0, Math.round((168 - totalHours) * 100) / 100);
  const totalCardHighlightStyle = {
    borderWidth: 4 as const,
    borderColor:
      totalHours >= 168
        ? `rgb(${theme.successBorderRgb})`
        : `rgba(${theme.successBorderRgb}, ${Math.max(0.18, totalHours / 168)})`,
    borderStyle: totalHours > 0 ? ('solid' as const) : ('dashed' as const),
  };

  useEffect(() => {
    if (editingActivity) {
      setTempEditValues({
        name: editingActivity.name,
        daysPerWeek: editingActivity.daysPerWeek.toString(),
        hoursPerSession: editingActivity.hoursPerSession.toString(),
      });
    }
  }, [editingActivity]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const storedValues = await AsyncStorage.multiGet([
          ACTIVITY_STORAGE_KEY,
          THEME_STORAGE_KEY,
        ]);

        const savedActivities = storedValues[0][1];
        const savedThemePreference = storedValues[1][1];

        if (savedActivities) {
          setActivities(JSON.parse(savedActivities));
        }

        if (
          savedThemePreference === 'light' ||
          savedThemePreference === 'dark' ||
          savedThemePreference === 'system'
        ) {
          setThemePreference(savedThemePreference);
        }
      } catch (error) {
        console.error('Error loading app data:', error);
      } finally {
        setHasLoadedData(true);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!hasLoadedData) {
      return;
    }

    const saveActivities = async () => {
      try {
        await AsyncStorage.setItem(
          ACTIVITY_STORAGE_KEY,
          JSON.stringify(activities),
        );
      } catch (error) {
        console.error('Error saving activities:', error);
      }
    };

    saveActivities();
  }, [activities, hasLoadedData]);

  useEffect(() => {
    if (!hasLoadedData) {
      return;
    }

    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, themePreference);
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    };

    saveThemePreference();
  }, [themePreference, hasLoadedData]);

  const calculateHoursPerWeek = (days: number, hours: number) =>
    Math.round(days * hours * 100) / 100;

  const closeAddModal = () => {
    setNewActivityValues({ name: '', daysPerWeek: '1', hoursPerSession: '1' });
    setShowAddModal(false);
  };

  const saveEditedActivity = () => {
    if (!editingActivity) {
      return;
    }

    const sanitizedName = tempEditValues.name.trim() || editingActivity.name;
    const sanitizedDays = Math.max(
      1,
      Math.min(7, parseFloat(tempEditValues.daysPerWeek) || 1),
    );
    const sanitizedHours = Math.max(
      0.25,
      parseFloat(tempEditValues.hoursPerSession) || 1,
    );

    setActivities(current =>
      current.map(activity =>
        activity.id === editingActivity.id
          ? {
              ...activity,
              name: sanitizedName,
              daysPerWeek: sanitizedDays,
              hoursPerSession: sanitizedHours,
            }
          : activity,
      ),
    );
    setEditingActivity(null);
  };

  const addActivity = () => {
    const trimmedName = newActivityValues.name.trim();

    if (!trimmedName) {
      return;
    }

    setActivities(current => {
      const newId = Math.max(...current.map(activity => activity.id), 0) + 1;

      return [
        ...current,
        {
          id: newId,
          name: trimmedName,
          daysPerWeek: parseFloat(newActivityValues.daysPerWeek) || 1,
          hoursPerSession: parseFloat(newActivityValues.hoursPerSession) || 1,
          color: activityColors[current.length % activityColors.length],
        },
      ];
    });
    closeAddModal();
  };

  const deleteActivity = (id: number) => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            setActivities(current =>
              current.filter(activity => activity.id !== id),
            ),
        },
      ],
    );
  };

  const getPieChartData = () => {
    const data = activities.map(activity => {
      const hours = calculateHoursPerWeek(
        activity.daysPerWeek,
        activity.hoursPerSession,
      );

      return {
        name: activity.name,
        hours,
        color: activity.color,
        legendFontColor: theme.textSecondary,
        legendFontSize: 13,
        legendFontWeight: '600',
      };
    });

    if (remainingHours > 0) {
      data.push({
        name: 'Unallocated',
        hours: remainingHours,
        color: theme.unallocated,
        legendFontColor: theme.textMuted,
        legendFontSize: 13,
        legendFontWeight: '600',
      });
    }

    return data;
  };

  const renderActivityItem: ListRenderItem<Activity> = ({ item }) => (
    <View style={styles.activityCard}>
      <View style={styles.activityContent}>
        <View style={styles.activityLeft}>
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <View style={styles.activityInfo}>
            <Text style={styles.activityName}>{item.name}</Text>
            <Text style={styles.activityDetails}>
              {item.daysPerWeek}d/week × {item.hoursPerSession}h ={' '}
              {calculateHoursPerWeek(item.daysPerWeek, item.hoursPerSession)}h/week
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
      <SafeAreaView
        style={styles.container}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <StatusBar
          barStyle={theme.statusBarStyle}
          backgroundColor={theme.background}
        />

        <View style={styles.header}>
          <Text style={styles.title}>Weekly Time Budget</Text>

          <View style={styles.summaryRow}>
            <View
              style={[
                styles.summaryCard,
                styles.totalCard,
                totalCardHighlightStyle,
              ]}
            >
              <Text style={styles.summaryLabel}>Allocated</Text>
              <Text style={styles.summaryValue}>{totalHours}h</Text>
              <Text style={styles.progressSubtext}>of 168h total</Text>
            </View>

            <View style={[styles.summaryCard, styles.remainingCard]}>
              <Text style={[styles.summaryLabel, styles.remainingCardText]}>
                Unallocated
              </Text>
              <Text style={[styles.summaryValue, styles.remainingCardText]}>
                {remainingHours}h
              </Text>
              <Text style={[styles.progressSubtext, styles.remainingCardText]}>
                remaining
              </Text>
            </View>
          </View>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, view === 'table' && styles.activeToggle]}
              onPress={() => setView('table')}
            >
              <Text
                style={[styles.toggleText, view === 'table' && styles.activeToggleText]}
              >
                Table
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, view === 'chart' && styles.activeToggle]}
              onPress={() => setView('chart')}
            >
              <Text
                style={[styles.toggleText, view === 'chart' && styles.activeToggleText]}
              >
                Chart
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {view === 'table' ? (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
          >
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add New Activity</Text>
            </TouchableOpacity>

            <FlatList
              data={activities}
              renderItem={renderActivityItem}
              keyExtractor={item => item.id.toString()}
              scrollEnabled={false}
            />
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
          >
            <Text style={styles.chartTitle}>Time Distribution</Text>

            {activities.length > 0 && (
              <View style={styles.chartContainer}>
                <PieChart
                  data={getPieChartData()}
                  width={screenWidth - 40}
                  height={240}
                  chartConfig={{
                    backgroundColor: 'transparent',
                    backgroundGradientFrom: theme.surface,
                    backgroundGradientTo: theme.surface,
                    color: (opacity = 1) => {
                      const rgb =
                        resolvedTheme === 'dark' ? '56, 189, 248' : '5, 123, 150';

                      return `rgba(${rgb}, ${opacity})`;
                    },
                    labelColor: (opacity = 1) => {
                      const rgb =
                        resolvedTheme === 'dark' ? '248, 250, 252' : '31, 41, 55';

                      return `rgba(${rgb}, ${opacity})`;
                    },
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
                  style={styles.pieChart}
                />
              </View>
            )}

            <View style={styles.breakdown}>
              <Text style={styles.breakdownTitle}>Activity Breakdown</Text>
              {activities.map(activity => (
                <View key={activity.id} style={styles.breakdownItem}>
                  <View style={styles.breakdownLeft}>
                    <View
                      style={[styles.colorDot, { backgroundColor: activity.color }]}
                    />
                    <View style={styles.activityInfo}>
                      <Text style={styles.breakdownName}>{activity.name}</Text>
                      <Text style={styles.breakdownDetails}>
                        {activity.hoursPerSession}h × {activity.daysPerWeek} days
                      </Text>
                    </View>
                  </View>
                  <View style={styles.breakdownRight}>
                    <Text style={styles.breakdownHours}>
                      {calculateHoursPerWeek(
                        activity.daysPerWeek,
                        activity.hoursPerSession,
                      )}
                      h
                    </Text>
                    <Text style={styles.breakdownPercent}>
                      {(
                        (calculateHoursPerWeek(
                          activity.daysPerWeek,
                          activity.hoursPerSession,
                        ) /
                          168) *
                        100
                      ).toFixed(1)}
                      %
                    </Text>
                  </View>
                </View>
              ))}
              {remainingHours > 0 && (
                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownLeft}>
                    <View
                      style={[styles.colorDot, { backgroundColor: theme.unallocated }]}
                    />
                    <View style={styles.activityInfo}>
                      <Text style={styles.breakdownName}>Unallocated</Text>
                      <Text style={styles.breakdownDetails}>Remaining time</Text>
                    </View>
                  </View>
                  <View style={styles.breakdownRight}>
                    <Text style={styles.breakdownHours}>{remainingHours}h</Text>
                    <Text style={styles.breakdownPercent}>
                      {((remainingHours / 168) * 100).toFixed(1)}%
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        <TouchableOpacity
          style={styles.themeFab}
          onPress={() => setShowThemeModal(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.themeFabLabel}>Aa</Text>
        </TouchableOpacity>

        <Modal
          visible={showThemeModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowThemeModal(false)}
        >
          <View style={styles.themeSheetOverlay}>
            <TouchableOpacity
              style={styles.modalDismissLayer}
              activeOpacity={1}
              onPress={() => setShowThemeModal(false)}
            />
            <View style={styles.themeSheetContent}>
              <View style={styles.themeSheetHandle} />
              <View style={styles.themeSheetHeader}>
                <View>
                  <Text style={styles.themeSheetTitle}>Appearance</Text>
                  <Text style={styles.themeSheetSubtitle}>
                    Light, system, or dark.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.themeSheetClose}
                  onPress={() => setShowThemeModal(false)}
                >
                  <Text style={styles.themeSheetCloseText}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.preferenceToggle}>
                {themeOptions.map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.preferenceButton,
                      themePreference === option.key &&
                        styles.preferenceButtonActive,
                    ]}
                    onPress={() => setThemePreference(option.key)}
                  >
                    <Text
                      style={[
                        styles.preferenceButtonText,
                        themePreference === option.key &&
                          styles.preferenceButtonTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showAddModal} transparent={true} animationType="none">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Activity</Text>

              <Text style={styles.inputLabel}>Activity Name</Text>
              <TextInput
                style={styles.textInput}
                value={newActivityValues.name}
                onChangeText={text =>
                  setNewActivityValues(prev => ({ ...prev, name: text }))
                }
                placeholder="Activity name"
                placeholderTextColor={theme.inputPlaceholder}
                autoCorrect={false}
                autoCapitalize="words"
                keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                selectionColor={theme.accent}
              />

              <Text style={styles.inputLabel}>Days per Week</Text>
              <TextInput
                style={styles.textInput}
                value={newActivityValues.daysPerWeek}
                onChangeText={text =>
                  setNewActivityValues(prev => ({ ...prev, daysPerWeek: text }))
                }
                placeholder="Days per week"
                placeholderTextColor={theme.inputPlaceholder}
                keyboardType="numeric"
                autoCorrect={false}
                keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                selectionColor={theme.accent}
              />

              <Text style={styles.inputLabel}>Hours per Session</Text>
              <TextInput
                style={styles.textInput}
                value={newActivityValues.hoursPerSession}
                onChangeText={text =>
                  setNewActivityValues(prev => ({
                    ...prev,
                    hoursPerSession: text,
                  }))
                }
                placeholder="Hours per session"
                placeholderTextColor={theme.inputPlaceholder}
                keyboardType="numeric"
                autoCorrect={false}
                keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                selectionColor={theme.accent}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={closeAddModal}
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
                onChangeText={text =>
                  setTempEditValues(prev => ({ ...prev, name: text }))
                }
                placeholder="Activity name"
                placeholderTextColor={theme.inputPlaceholder}
                autoCorrect={false}
                autoCapitalize="words"
                keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                selectionColor={theme.accent}
              />

              <Text style={styles.inputLabel}>Days per Week</Text>
              <TextInput
                style={styles.textInput}
                value={tempEditValues.daysPerWeek}
                onChangeText={text =>
                  setTempEditValues(prev => ({ ...prev, daysPerWeek: text }))
                }
                placeholder="Days per week"
                placeholderTextColor={theme.inputPlaceholder}
                keyboardType="numeric"
                autoCorrect={false}
                keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                selectionColor={theme.accent}
              />

              <Text style={styles.inputLabel}>Hours per Session</Text>
              <TextInput
                style={styles.textInput}
                value={tempEditValues.hoursPerSession}
                onChangeText={text =>
                  setTempEditValues(prev => ({
                    ...prev,
                    hoursPerSession: text,
                  }))
                }
                placeholder="Hours per session"
                placeholderTextColor={theme.inputPlaceholder}
                keyboardType="numeric"
                autoCorrect={false}
                keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                selectionColor={theme.accent}
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
                  onPress={saveEditedActivity}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default TimeBudgetApp;
