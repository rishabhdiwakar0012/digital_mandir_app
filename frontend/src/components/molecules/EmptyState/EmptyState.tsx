import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from '../../atoms/Typography';
import { Button } from '../../atoms/Button';
import { useColors } from '../../../theme';
import { spacing } from '../../../theme/tokens';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}

      <Typography variant="h4" align="center" style={styles.title}>
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body2"
          color="textSecondary"
          align="center"
          style={styles.description}
        >
          {description}
        </Typography>
      )}

      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
  },
  description: {
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.md,
  },
});
