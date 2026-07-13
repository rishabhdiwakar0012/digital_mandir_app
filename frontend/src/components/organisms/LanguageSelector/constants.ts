/**
 * Language Selector Configuration Constants
 * Follows DRY principle - all configurable values in one place
 */
export const LANGUAGE_CONFIG = {
    title: 'Select Language',
    subtitle: 'भाषा चुनें',
    languages: [
        {
            id: 'hi',
            name: 'Hindi',
            iconText: 'ह', // Using text as icon placeholder
            iconColor: '#F48E2F', // Saffron color
        },
        {
            id: 'en',
            name: 'English',
            iconText: 'En',
            iconColor: '#F48E2F',
        }
    ],
    buttonText: 'CONTINUE',
    illustrationWidth: 150,
    illustrationHeight: 200,
} as const;
