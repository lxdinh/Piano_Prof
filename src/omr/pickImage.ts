import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

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

/** Pick several pages at once (multi-page scores). Order = selection order. */
export async function pickPagesFromLibrary(): Promise<PickedImage[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.9,
    allowsMultipleSelection: true,
    selectionLimit: 20,
    orderedSelection: true,
  });
  if (res.canceled || !res.assets?.length) return [];
  return res.assets.map((a, i) => ({
    uri: a.uri,
    mimeType: a.mimeType ?? 'image/jpeg',
    fileName: a.fileName ?? `sheet-${Date.now()}-${i + 1}.jpg`,
  }));
}

/** Pick a PDF — the OMR server renders every page and returns one merged score. */
export async function pickPdf(): Promise<PickedImage | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  return {
    uri: a.uri,
    mimeType: a.mimeType ?? 'application/pdf',
    fileName: a.name ?? `score-${Date.now()}.pdf`,
  };
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

// MIME types a score file may arrive under; the wildcard goes last, since pickers
// often report octet-stream (or nothing) for MusicXML and MIDI.
const SCORE_FILE_TYPES = [
  'application/vnd.recordare.musicxml+xml',
  'application/vnd.recordare.musicxml',
  'application/xml',
  'text/xml',
  'audio/midi',
  'audio/x-midi',
  'application/x-midi',
  'application/octet-stream',
  '*/*',
];

/** Pick a MusicXML (.musicxml/.xml/.mxl) or MIDI (.mid/.midi) file to import without scanning. */
export async function pickScoreFile(): Promise<PickedImage | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: SCORE_FILE_TYPES,
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  return {
    uri: a.uri,
    mimeType: a.mimeType ?? 'application/octet-stream',
    fileName: a.name ?? `score-${Date.now()}`,
  };
}
