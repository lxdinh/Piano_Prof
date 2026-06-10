module.exports = {
  cacheDirectory: '/tmp/',
  documentDirectory: '/tmp/',
  writeAsStringAsync: jest.fn(async () => {}),
  readAsStringAsync: jest.fn(async () => ''),
  getInfoAsync: jest.fn(async () => ({ exists: false })),
  deleteAsync: jest.fn(async () => {}),
  EncodingType: { Base64: 'base64', UTF8: 'utf8' },
};
