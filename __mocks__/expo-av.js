// Manual mock — audio playback is a no-op in tests.
const soundInstance = () => ({
  playAsync: jest.fn(async () => ({})),
  replayAsync: jest.fn(async () => ({})),
  stopAsync: jest.fn(async () => ({})),
  unloadAsync: jest.fn(async () => ({})),
  setPositionAsync: jest.fn(async () => ({})),
  setVolumeAsync: jest.fn(async () => ({})),
  setRateAsync: jest.fn(async () => ({})),
  setOnPlaybackStatusUpdate: jest.fn(),
});

const Audio = {
  setAudioModeAsync: jest.fn(async () => {}),
  Sound: {
    createAsync: jest.fn(async () => ({ sound: soundInstance(), status: { isLoaded: true } })),
  },
};

module.exports = { Audio, AVPlaybackSource: undefined };
