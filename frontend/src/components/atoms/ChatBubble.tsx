import React from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, borderRadius, shadows } from '../../theme/tokens';

interface ChatBubbleProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    arrowPosition?: 'left'; // Extensible for right later if needed
}

const ARROW_WIDTH = 12;
const ARROW_HEIGHT = 20;
const BORDER_COLOR = '#EEEEEE'; // Matching existing borderColor
const BG_COLOR = '#FFFFFF';

export const ChatBubble: React.FC<ChatBubbleProps> = ({
    children,
    style,
    arrowPosition = 'left'
}) => {
    return (
        <View style={[styles.container, style]}>
            {/* Main Bubble Content */}
            <View style={styles.bubble}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        marginLeft: 0, // Removed arrow space
    },
    bubble: {
        backgroundColor: BG_COLOR,
        borderRadius: 12, // Standardized radius
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        padding: 8,
        paddingHorizontal: 12,
        ...shadows.sm, // Standard shadow
    },
    arrowContainer: {
        position: 'absolute',
        left: -ARROW_WIDTH, // Position outside to the left
        top: '30%', // Vertically centered roughly where text line 1 is
        width: ARROW_WIDTH,
        height: ARROW_HEIGHT,
        zIndex: 10,
    },
    arrow: {
        zIndex: 2,
    },
    borderPatch: {
        position: 'absolute',
        right: -1, // Overlap the bubble border
        top: 0,
        bottom: 0, // Cover height of arrow
        width: 2,
        backgroundColor: BG_COLOR,
        zIndex: 3, // On top of bubble border but below arrow stroke ends? 
        // Actually arrow stroke ends at x=12. 
        // We want to hide the bubbling border vertical line behind the arrow base.
    }
});
