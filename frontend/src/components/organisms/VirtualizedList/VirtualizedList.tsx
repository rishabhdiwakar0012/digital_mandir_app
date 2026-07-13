import React, { useCallback } from 'react';
import { FlatList, View, StyleSheet, ViewStyle, ListRenderItemInfo } from 'react-native';
import { Loading } from '../../atoms/Loading';
import { EmptyState } from '../../molecules/EmptyState';
import { useColors } from '../../../theme';

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  estimateSize?: number;
  overscan?: number;
  isLoading?: boolean;
  isError?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  ListHeaderComponent?: React.ReactNode;
  ListFooterComponent?: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export function VirtualizedList<T>({
  data,
  renderItem,
  keyExtractor,
  estimateSize = 80,
  isLoading = false,
  isError = false,
  emptyTitle = 'No items',
  emptyDescription,
  onEndReached,
  onEndReachedThreshold = 0.8,
  ListHeaderComponent,
  ListFooterComponent,
  style,
  contentContainerStyle,
}: VirtualizedListProps<T>) {
  const colors = useColors();

  const handleRenderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<T>) => {
      return <>{renderItem(item, index)}</>;
    },
    [renderItem]
  );

  const handleKeyExtractor = useCallback(
    (item: T, index: number) => keyExtractor(item, index),
    [keyExtractor]
  );

  const handleEndReached = useCallback(() => {
    if (onEndReached) {
      onEndReached();
    }
  }, [onEndReached]);

  const getItemLayout = useCallback(
    (_data: ArrayLike<T> | null | undefined, index: number) => ({
      length: estimateSize,
      offset: estimateSize * index,
      index,
    }),
    [estimateSize]
  );

  if (isLoading && data.length === 0) {
    return <Loading fullScreen />;
  }

  if (!isLoading && data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        style={style}
      />
    );
  }

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={data}
        renderItem={handleRenderItem}
        keyExtractor={handleKeyExtractor}
        onEndReached={handleEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        ListHeaderComponent={ListHeaderComponent ? () => <>{ListHeaderComponent}</> : undefined}
        ListFooterComponent={
          isLoading ? (
            <Loading />
          ) : ListFooterComponent ? (
            () => <>{ListFooterComponent}</>
          ) : undefined
        }
        contentContainerStyle={contentContainerStyle}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
