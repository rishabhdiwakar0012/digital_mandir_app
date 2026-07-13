import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, shadows } from '../../../theme/tokens';
import { useTranslation } from 'react-i18next';

export type NavTab = 'home' | 'leaderboard' | 'streak' | 'level' | 'profile';

interface NavItem {
    id: NavTab;
    labelKey: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconActive: keyof typeof Ionicons.glyphMap;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'home',        labelKey: 'navigation.home',        icon: 'home-outline',   iconActive: 'home'   },
    { id: 'leaderboard', labelKey: 'navigation.leaderboard', icon: 'trophy-outline', iconActive: 'trophy' },
    { id: 'streak',      labelKey: 'navigation.streak',      icon: 'flame-outline',  iconActive: 'flame'  },
    { id: 'level',       labelKey: 'navigation.level',       icon: 'star-outline',   iconActive: 'star'   },
    { id: 'profile',     labelKey: 'navigation.profile',     icon: 'person-outline', iconActive: 'person' },
];

const ACTIVE_COLOR = colors.secondary[600];   // #FB8C00
const INACTIVE_COLOR = colors.neutral[500];     // #9E9E9E
const GRADIENT: [string, string] = ['#FF9933', '#E65100'];

interface BottomNavBarProps {
    activeTab: NavTab;
    onTabPress: (tab: NavTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onTabPress }) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    return (
        <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            {/* Top border glow line */}
            <LinearGradient
                colors={['#FF993355', '#E6510055']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.topBorder}
            />

            <View style={styles.container}>
                {NAV_ITEMS.map((item) => {
                    const isActive = activeTab === item.id;
                    const label = t(item.labelKey);

                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.tab}
                            onPress={() => onTabPress(item.id)}
                            activeOpacity={0.75}
                            accessibilityRole="button"
                            accessibilityLabel={label}
                            accessibilityState={{ selected: isActive }}
                        >
                            {/* Active gradient pill behind icon */}
                            {isActive && (
                                <LinearGradient
                                    colors={GRADIENT}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.activePill}
                                />
                            )}

                            <Ionicons
                                name={isActive ? item.iconActive : item.icon}
                                size={22}
                                color={isActive ? '#FFFFFF' : INACTIVE_COLOR}
                                style={styles.icon}
                            />

                            <Text
                                style={[
                                    styles.label,
                                    isActive ? styles.labelActive : styles.labelInactive,
                                ]}
                                numberOfLines={1}
                            >
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: colors.neutral[0],
        ...shadows.lg,
        // Stronger shadow for nav bar
        shadowColor: '#FF9933',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 12,
    },
    topBorder: {
        height: 1.5,
        width: '100%',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingTop: 8,
        paddingHorizontal: 8,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        minHeight: 52,
        position: 'relative',
    },
    activePill: {
        position: 'absolute',
        top: 2,
        width: 44,
        height: 32,
        borderRadius: 16,
        zIndex: 0,
    },
    icon: {
        zIndex: 1,
        marginBottom: 3,
    },
    label: {
        fontSize: typography.fontSizes.xs,   // 10px — compact under the icon
        fontFamily: 'Poppins_600SemiBold',
        letterSpacing: 0.2,
        zIndex: 1,
    },
    labelActive: {
        color: ACTIVE_COLOR,
    },
    labelInactive: {
        color: INACTIVE_COLOR,
    },
});
