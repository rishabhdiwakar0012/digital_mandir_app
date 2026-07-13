import React, { useState, useEffect, useRef } from 'react';
import { Text, TextStyle } from 'react-native';

interface TypewriterTextProps {
    text: string;
    style?: TextStyle | TextStyle[];
    speed?: number; // milliseconds per character
    delay?: number; // initial delay before typing starts
    onComplete?: () => void;
}

/**
 * TypewriterText Component
 * 
 * Animates text character by character like a typewriter effect.
 * Restarts animation when the `text` prop changes.
 */
export const TypewriterText: React.FC<TypewriterTextProps> = ({
    text,
    style,
    speed = 40,
    delay = 300,
    onComplete,
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const indexRef = useRef(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Reset on text change
        setDisplayedText('');
        indexRef.current = 0;

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        const startTyping = () => {
            const type = () => {
                if (indexRef.current < text.length) {
                    indexRef.current++;
                    setDisplayedText(text.slice(0, indexRef.current));
                    timerRef.current = setTimeout(type, speed);
                } else {
                    onComplete?.();
                }
            };
            type();
        };

        // Initial delay
        timerRef.current = setTimeout(startTyping, delay);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [text]);

    return <Text style={style}>{displayedText}</Text>;
};
