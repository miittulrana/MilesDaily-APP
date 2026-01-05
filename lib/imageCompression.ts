import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export interface CompressedImage {
  uri: string;
  width: number;
  height: number;
  size: number;
}

const TARGET_SIZE_KB = 800;
const MAX_DIMENSION = 1920;

export async function compressImage(uri: string): Promise<CompressedImage> {
  let quality = 0.8;
  let compressed = await manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: quality, format: SaveFormat.JPEG }
  );

  const fileInfo = await fetch(compressed.uri);
  const blob = await fileInfo.blob();
  let currentSize = blob.size / 1024;

  while (currentSize > TARGET_SIZE_KB && quality > 0.3) {
    quality -= 0.1;
    compressed = await manipulateAsync(
      uri,
      [{ resize: { width: MAX_DIMENSION } }],
      { compress: quality, format: SaveFormat.JPEG }
    );

    const fileInfo = await fetch(compressed.uri);
    const blob = await fileInfo.blob();
    currentSize = blob.size / 1024;
  }

  return {
    uri: compressed.uri,
    width: compressed.width,
    height: compressed.height,
    size: currentSize,
  };
}

export async function compressMultipleImages(uris: string[]): Promise<CompressedImage[]> {
  const compressed: CompressedImage[] = [];
  
  for (const uri of uris) {
    const result = await compressImage(uri);
    compressed.push(result);
  }
  
  return compressed;
}