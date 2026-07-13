import React, { useEffect, useState } from 'react';
import { Image, ImageProps } from 'react-native';
import { getCachedImageUri } from '../../../utils/imageCache';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  fallbackUri?: string;
}

/**
 * Drop-in replacement for <Image source={{ uri: '...' }} /> that
 * caches images to disk via expo-file-system.
 *
 * - First open: downloads + caches → shows image
 * - Subsequent opens: reads from disk → shows image instantly (no network)
 */
export const CachedImage: React.FC<CachedImageProps> = ({
  uri,
  fallbackUri,
  ...imageProps
}) => {
  const [resolvedUri, setResolvedUri] = useState<string>(uri);

  useEffect(() => {
    if (!uri) return;

    let cancelled = false;

    getCachedImageUri(uri).then((cachedUri) => {
      if (!cancelled) {
        setResolvedUri(cachedUri);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [uri]);

  return (
    <Image
      {...imageProps}
      source={{ uri: resolvedUri }}
      onError={() => {
        // If cached file is corrupt / missing, fall back to remote URL
        if (resolvedUri !== uri) {
          setResolvedUri(fallbackUri ?? uri);
        }
      }}
    />
  );
};
