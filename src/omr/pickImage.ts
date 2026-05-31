import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export interface PickedImage {
  uri: string;
  mimeType: string;
  fileName: string;
  /** 'pdf' when the source is a PDF document, else 'image'. */
  kind: 'image' | 'pdf';
}

export async function pickFromLibrary(): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.9,
  });
  return firstPicked(res);
}

export async function capturePhoto(): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchCameraAsync({ quality: 0.9 });
  return firstPicked(res);
}

/** Pick several photos/screenshots at once (for a multi-page song). */
export async function pickMultiple(): Promise<PickedImage[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.9,
  });
  if (res.canceled) return [];
  return (res.assets ?? []).map(fromImageAsset);
}

/** Pick one or more PDF (or image) documents via the system file picker. */
export async function pickDocuments(): Promise<PickedImage[]> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (res.canceled) return [];
  return (res.assets ?? []).map((a) => ({
    uri: a.uri,
    mimeType: a.mimeType ?? 'application/octet-stream',
    fileName: a.name ?? `page-${Date.now()}`,
    kind: (a.mimeType === 'application/pdf' || a.name?.toLowerCase().endsWith('.pdf'))
      ? 'pdf'
      : 'image',
  }));
}

function fromImageAsset(a: ImagePicker.ImagePickerAsset): PickedImage {
  return {
    uri: a.uri,
    mimeType: a.mimeType ?? 'image/jpeg',
    fileName: a.fileName ?? `sheet-${Date.now()}.jpg`,
    kind: 'image',
  };
}

function firstPicked(res: ImagePicker.ImagePickerResult): PickedImage | null {
  if (res.canceled || !res.assets?.length) return null;
  return fromImageAsset(res.assets[0]);
}
