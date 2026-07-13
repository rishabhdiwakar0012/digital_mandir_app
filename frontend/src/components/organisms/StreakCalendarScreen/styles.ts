import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        height: 60,
    },
    headerBack: {
        padding: 12,
        paddingLeft: 16,
        alignSelf: 'flex-start',
        zIndex: 10,
    },
    headerLogoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        left: 0,
        right: 0,
        height: 60,
    },
    headerIcon: {
        width: 32,
        height: 32,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Poppins_600SemiBold',
        color: '#0F172A',
        // If the logo includes text, we might not need this, but the user says DigitalMandir.in is text
        // assuming standard header text style
    },
    headerRightPlaceholder: {
        width: 40,
    },

    contentContent: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 8, // Reduced to save space
        justifyContent: 'flex-start',
    },

    // Text blocks
    textContainer: {
        alignItems: 'center',
        marginBottom: 16,
        width: '100%',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 4,
    },
    backButtonInline: {
        padding: 4,
    },
    titleRightPlaceholder: {
        width: 36, // To balance the back arrow (28px size + 8px padding)
    },
    title: {
        fontSize: 24,
        fontFamily: 'Poppins_700Bold',
        letterSpacing: 2,
        color:'#F89626', // Active brand color
        textTransform: 'uppercase',
        textShadowColor: 'rgba(248, 150, 38, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 13,
        fontFamily: 'Poppins_600SemiBold',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        width: '85%',
        letterSpacing: 0.5,
    },

    // Stats Card
    statsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Glass effect
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 10,
        width: '100%',
        marginBottom: 12,
        shadowColor: '#F89626',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 15,
        elevation: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.7)',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontFamily: 'Poppins_700Bold',
        color: '#333333',
        marginTop: 6,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: 'Poppins_500Medium',
        color: '#888888',
        textTransform: 'uppercase',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
    },

    // Calendar Card
    calendarCard: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Glass effect
        borderRadius: 24,
        padding: 12,
        paddingBottom: 12,
        marginBottom: 10, // Reduced from 20
        shadowColor: '#F89626', // Warm shadow
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        overflow: 'hidden', // Prevent grid from growing the card
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    monthText: {
        fontSize: 16,
        fontFamily: 'Poppins_500Medium',
        color: '#666666',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    navButton: {
        padding: 5,
    },
    daysHeaderRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginBottom: 6,
    },
    dayHeaderCell: {
        width: `${100 / 7}%`,
        textAlign: 'center',
        fontSize: 13,
        fontFamily: 'Poppins_600SemiBold',
        color: '#BDBDBD',
        marginBottom: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    dayCell: {
        width: `${100 / 7}%`,
        height: 40, // Further reduced to ensure it fits
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayText: {
        fontSize: 15,
        fontFamily: 'Poppins_600SemiBold',
        color: '#6B7280',
    },
    emptyCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    todayCircle: {
        backgroundColor: 'rgba(248, 150, 38, 0.15)',
        borderWidth: 1,
        borderColor: '#F89626',
    },
    todayText: {
        color: '#F89626',
        fontFamily: 'Poppins_700Bold',
    },
    checkedCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#F89626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
    },
    activeDayText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontFamily: 'Poppins_700Bold',
        lineHeight: 12,
    },

    // Footer
    footer: {
        paddingHorizontal: 40,
        paddingBottom: 12, // Reduced from 24
        paddingTop: 4, // Reduced from 16
        backgroundColor: 'transparent',
    },
    continueButton: {
        backgroundColor: '#F89626',
        borderRadius: 14,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#F89626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Poppins_700Bold',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
});
