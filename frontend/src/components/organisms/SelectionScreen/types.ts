export interface SelectionOption {
    id: string;
    titleKey: string; // i18n translation key
    iconName: string; // MaterialCommunityIcons name
}

export interface SelectionScreenProps {
    onBack?: () => void;
    onContinue: (selectedId: string) => void;
}
