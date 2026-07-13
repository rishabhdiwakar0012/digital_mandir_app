import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Animated, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows } from '../../../../theme/tokens';

// ─── Constants ────────────────────────────────────────────────────
const MONTHS_FULL = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTHS_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ACCENT = colors.secondary[500];
const ACCENT_DARK = colors.secondary[700];
const ACCENT_LIGHT = colors.secondary[50];
const ACCENT_BORDER = colors.secondary[200];

// ─── Utility Functions ───────────────────────────────────────────
const getDaysInMonth = (year: number, month: number): number =>
    new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number): number =>
    new Date(year, month, 1).getDay();
const formatDateString = (year: number, month: number, day: number): string =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

// ─── Interfaces ──────────────────────────────────────────────────
interface CalendarProps {
    selectedDate: string;
    onDateSelect: (dateString: string) => void;
    maxDate?: string;
    accentColor?: string;
}

interface MonthYear {
    month: number;
    year: number;
}

// ─── Year Selector ──────────────────────────────────────────────
const YearSelector: React.FC<{
    currentYear: number;
    onYearSelect: (year: number) => void;
    onClose: () => void;
    accentColor: string;
}> = ({ currentYear, onYearSelect, onClose, accentColor }) => {
    const { t } = useTranslation();
    const currentActualYear = new Date().getFullYear();
    const years = useMemo(() => {
        const list = [];
        for (let y = currentActualYear; y >= 1920; y--) list.push(y);
        return list;
    }, [currentActualYear]);

    return (
        <View style={yearStyles.container}>
            <View style={yearStyles.header}>
                <View style={yearStyles.titleRow}>
                    <Ionicons name="calendar-outline" size={20} color={accentColor} />
                    <Text style={yearStyles.title}>{t('registerScreen.selectYear')}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={yearStyles.closeBtn}>
                    <View style={yearStyles.closeBtnBg}>
                        <Ionicons name="close" size={18} color={colors.neutral[600]} />
                    </View>
                </TouchableOpacity>
            </View>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={yearStyles.list}
                nestedScrollEnabled={true}
            >
                <View style={yearStyles.yearsGrid}>
                    {years.map((item) => {
                        const isSelected = item === currentYear;
                        return (
                            <TouchableOpacity
                                key={item}
                                style={[
                                    yearStyles.yearItem,
                                    isSelected && { backgroundColor: accentColor, ...shadows.md }
                                ]}
                                onPress={() => onYearSelect(item)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    yearStyles.yearText,
                                    isSelected && yearStyles.yearTextSelected,
                                ]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
};

// ─── Scrollable Month Chips ─────────────────────────────────────
const MonthSelector: React.FC<{
    currentMonth: number;
    onMonthSelect: (month: number) => void;
    accentColor: string;
}> = ({ currentMonth, onMonthSelect, accentColor }) => {
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        setTimeout(() => {
            flatListRef.current?.scrollToIndex({
                index: Math.max(0, currentMonth - 1),
                animated: true,
                viewPosition: 0.3,
            });
        }, 150);
    }, [currentMonth]);

    return (
        <View style={monthStyles.wrapper}>
            <FlatList
                ref={flatListRef}
                data={MONTHS_SHORT}
                keyExtractor={(_, idx) => idx.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={monthStyles.listContent}
                getItemLayout={(_, index) => ({
                    length: 62,
                    offset: 62 * index,
                    index,
                })}
                renderItem={({ item, index }) => {
                    const isActive = index === currentMonth;
                    return (
                        <TouchableOpacity
                            style={[
                                monthStyles.chip,
                                isActive && {
                                    backgroundColor: accentColor,
                                    borderColor: accentColor,
                                    ...shadows.sm,
                                }
                            ]}
                            onPress={() => onMonthSelect(index)}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                monthStyles.chipText,
                                isActive && monthStyles.chipTextActive
                            ]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
};

// ─── Day Cell ───────────────────────────────────────────────────
const DayCell: React.FC<{
    day: number | null;
    index: number;
    isSelected: boolean;
    isToday: boolean;
    isDisabled: boolean;
    accentColor: string;
    onPress: () => void;
}> = React.memo(({ day, index, isSelected, isToday, isDisabled, accentColor, onPress }) => {
    if (day === null) {
        return <View style={gridStyles.dayCell} />;
    }

    return (
        <TouchableOpacity
            style={[
                gridStyles.dayCell,
                isSelected && [gridStyles.daySelected, { backgroundColor: accentColor }],
                isToday && !isSelected && [gridStyles.dayToday, { borderColor: accentColor }],
            ]}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.5}
        >
            <Text style={[
                gridStyles.dayText,
                isDisabled && gridStyles.dayDisabled,
                isSelected && gridStyles.dayTextSelected,
                isToday && !isSelected && { color: accentColor, fontWeight: typography.fontWeights.bold as any },
            ]}>
                {day}
            </Text>
            {isSelected && <View style={[gridStyles.selectedDot, { backgroundColor: colors.neutral[0] }]} />}
        </TouchableOpacity>
    );
});

// ─── Month Grid ─────────────────────────────────────────────────
const MonthGrid: React.FC<{
    year: number;
    month: number;
    selectedDate: string;
    maxDate?: string;
    accentColor: string;
    onDayPress: (dateString: string) => void;
}> = ({ year, month, selectedDate, maxDate, accentColor, onDayPress }) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fadeAnim.setValue(0);
        Animated.spring(fadeAnim, {
            toValue: 1,
            tension: 80,
            friction: 12,
            useNativeDriver: true,
        }).start();
    }, [year, month]);

    const days = useMemo(() => {
        const cells: (number | null)[] = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        return cells;
    }, [firstDay, daysInMonth]);

    const checkDisabled = useCallback((day: number) => {
        if (!maxDate) return false;
        return formatDateString(year, month, day) > maxDate;
    }, [year, month, maxDate]);

    const checkSelected = useCallback((day: number) => {
        return formatDateString(year, month, day) === selectedDate;
    }, [year, month, selectedDate]);

    const checkToday = useCallback((day: number) => {
        const today = new Date();
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    }, [year, month]);

    return (
        <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }]
        }}>
            {/* Weekday Headers */}
            <View style={gridStyles.weekdayRow}>
                {WEEKDAYS.map((d, i) => (
                    <View key={d} style={gridStyles.weekdayCell}>
                        <Text style={[
                            gridStyles.weekdayText,
                            (i === 0 || i === 6) && { color: colors.secondary[400] }
                        ]}>{d}</Text>
                    </View>
                ))}
            </View>

            {/* Day Grid */}
            <View style={gridStyles.daysContainer}>
                {days.map((day, idx) => (
                    <DayCell
                        key={day === null ? `empty-${idx}` : `day-${day}`}
                        day={day}
                        index={idx}
                        isSelected={day !== null && checkSelected(day)}
                        isToday={day !== null && checkToday(day)}
                        isDisabled={day !== null && checkDisabled(day)}
                        accentColor={accentColor}
                        onPress={() => day !== null && onDayPress(formatDateString(year, month, day))}
                    />
                ))}
            </View>
        </Animated.View>
    );
};

// ─── Main Calendar Component ────────────────────────────────────
export const CustomCalendar: React.FC<CalendarProps> = ({
    selectedDate,
    onDateSelect,
    maxDate,
    accentColor = ACCENT
}) => {
    const { t } = useTranslation();
    const [current, setCurrent] = useState<MonthYear>(() => {
        if (selectedDate) {
            const d = new Date(selectedDate);
            return { month: d.getMonth(), year: d.getFullYear() };
        }
        return { month: new Date().getMonth(), year: new Date().getFullYear() };
    });
    const [showYearPicker, setShowYearPicker] = useState(false);

    const goToPreviousMonth = () => {
        setCurrent(prev => {
            if (prev.month === 0) return { month: 11, year: prev.year - 1 };
            return { ...prev, month: prev.month - 1 };
        });
    };

    const goToNextMonth = () => {
        setCurrent(prev => {
            if (prev.month === 11) return { month: 0, year: prev.year + 1 };
            return { ...prev, month: prev.month + 1 };
        });
    };

    const isNextDisabled = useMemo(() => {
        if (!maxDate) return false;
        const maxD = new Date(maxDate);
        return current.year >= maxD.getFullYear() && current.month >= maxD.getMonth();
    }, [current, maxDate]);

    if (showYearPicker) {
        return (
            <View style={calStyles.container}>
                <YearSelector
                    currentYear={current.year}
                    onYearSelect={(year) => {
                        setCurrent(prev => ({ ...prev, year }));
                        setShowYearPicker(false);
                    }}
                    onClose={() => setShowYearPicker(false)}
                    accentColor={accentColor}
                />
            </View>
        );
    }

    return (
        <View style={calStyles.container}>
            {/* Header with Month/Year and Arrows */}
            <View style={calStyles.header}>
                <TouchableOpacity
                    onPress={goToPreviousMonth}
                    style={calStyles.arrowBtn}
                    activeOpacity={0.6}
                >
                    <Ionicons name="chevron-back" size={20} color={accentColor} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setShowYearPicker(true)}
                    style={calStyles.monthYearBtn}
                    activeOpacity={0.7}
                >
                    <Text style={[calStyles.monthYearText, { color: ACCENT_DARK }]}>
                        {MONTHS_FULL[current.month]}
                    </Text>
                    <Text style={calStyles.yearText}>{current.year}</Text>
                    <Ionicons name="chevron-down" size={16} color={colors.neutral[400]} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={goToNextMonth}
                    style={calStyles.arrowBtn}
                    disabled={isNextDisabled}
                    activeOpacity={0.6}
                >
                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={isNextDisabled ? colors.neutral[300] : accentColor}
                    />
                </TouchableOpacity>
            </View>

            {/* Scrollable Month Chips */}
            <MonthSelector
                currentMonth={current.month}
                onMonthSelect={(month) => setCurrent(prev => ({ ...prev, month }))}
                accentColor={accentColor}
            />

            {/* Separator */}
            <View style={calStyles.separator} />

            {/* Day Grid */}
            <MonthGrid
                year={current.year}
                month={current.month}
                selectedDate={selectedDate}
                maxDate={maxDate}
                accentColor={accentColor}
                onDayPress={onDateSelect}
            />
        </View>
    );
};

// ═══════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════

const calStyles = StyleSheet.create({
    container: {
        backgroundColor: colors.neutral[0],
        borderRadius: borderRadius.xl + 4,
        padding: spacing.md + 2,
        ...shadows.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    arrowBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: ACCENT_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: ACCENT_BORDER,
    },
    monthYearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs + 2,
        paddingVertical: spacing.xs + 2,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        backgroundColor: ACCENT_LIGHT,
        borderWidth: 1,
        borderColor: ACCENT_BORDER,
    },
    monthYearText: {
        fontSize: typography.fontSizes.lg,
        fontWeight: typography.fontWeights.bold as any,
    },
    yearText: {
        fontSize: typography.fontSizes.lg,
        fontWeight: typography.fontWeights.medium as any,
        color: colors.neutral[500],
    },
    separator: {
        height: 1,
        backgroundColor: colors.neutral[100],
        marginVertical: spacing.sm,
        marginHorizontal: spacing.sm,
    },
});

const gridStyles = StyleSheet.create({
    weekdayRow: {
        flexDirection: 'row',
        marginBottom: spacing.xs + 2,
        paddingHorizontal: 2,
    },
    weekdayCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.xs + 2,
    },
    weekdayText: {
        fontSize: typography.fontSizes.xs + 1,
        fontWeight: typography.fontWeights.bold as any,
        color: colors.neutral[400],
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 2,
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 1,
    },
    daySelected: {
        borderRadius: 22,
        ...shadows.md,
    },
    dayToday: {
        borderRadius: 22,
        borderWidth: 2,
    },
    dayText: {
        fontSize: typography.fontSizes.md + 1,
        fontWeight: typography.fontWeights.medium as any,
        color: colors.neutral[700],
    },
    dayTextSelected: {
        color: colors.neutral[0],
        fontWeight: typography.fontWeights.bold as any,
        fontSize: typography.fontSizes.md + 1,
    },
    dayDisabled: {
        color: colors.neutral[300],
    },
    selectedDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        position: 'absolute',
        bottom: 6,
        opacity: 0.7,
    },
});

const monthStyles = StyleSheet.create({
    wrapper: {
        marginBottom: spacing.xs,
    },
    listContent: {
        paddingHorizontal: spacing.xs,
        gap: spacing.xs,
    },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        borderRadius: borderRadius.full,
        backgroundColor: colors.neutral[0],
        borderWidth: 1.5,
        borderColor: colors.neutral[200],
        minWidth: 54,
        alignItems: 'center',
    },
    chipText: {
        fontSize: typography.fontSizes.sm,
        fontWeight: typography.fontWeights.semibold as any,
        color: colors.neutral[500],
    },
    chipTextActive: {
        color: colors.neutral[0],
        fontWeight: typography.fontWeights.bold as any,
    },
});

const yearStyles = StyleSheet.create({
    container: {
        maxHeight: 340,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingHorizontal: spacing.xs,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    title: {
        fontSize: typography.fontSizes.lg,
        fontWeight: typography.fontWeights.bold as any,
        color: colors.neutral[800],
    },
    closeBtn: {
        padding: spacing.xs,
    },
    closeBtnBg: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: colors.neutral[100],
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: {
        paddingBottom: spacing.md,
    },
    yearsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xs,
    },
    yearItem: {
        width: '23%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        margin: 3,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.neutral[50],
        borderWidth: 1,
        borderColor: colors.neutral[100],
    },
    yearText: {
        fontSize: typography.fontSizes.md,
        color: colors.neutral[600],
        fontWeight: typography.fontWeights.medium as any,
    },
    yearTextSelected: {
        color: colors.neutral[0],
        fontWeight: typography.fontWeights.bold as any,
    },
});
