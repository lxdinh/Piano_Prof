import * as ImagePicker from 'expo-image-picker';

export interface PickedImage {
  uri: string;
  mimeType: string;
  fileName: string;
}

export async function pickFromLibrary(): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.9,
  });
  return toPicked(res);
}

export async function capturePhoto(): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchCameraAsync({ quality: 0.9 });
  return toPicked(res);
}

function toPicked(res: ImagePicker.ImagePickerResult): PickedImage | null {
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  return {
    uri: a.uri,
    mimeType: a.mimeType ?? 'image/jpeg',
    fileName: a.fileName ?? `sheet-${Date.now()}.jpg`,
  };
}
