declare module 'react-native-wheel-scrollview-picker' {
    import { Component } from 'react';
    import { StyleProp, ViewStyle, TextStyle } from 'react-native';

    export interface ScrollPickerProps {
        dataSource: Array<string | number>;
        selectedIndex?: number;
        onValueChange?: (data: any, selectedIndex: number) => void;
        renderItem?: (data: any, index: number, isSelected: boolean) => JSX.Element;
        highlightColor?: string;
        highlightBorderWidth?: number;
        wrapperHeight?: number;
        wrapperWidth?: number;
        wrapperColor?: string;
        itemHeight?: number;
        style?: StyleProp<ViewStyle>;
    }

    export default class ScrollPicker extends Component<ScrollPickerProps> { }
}
