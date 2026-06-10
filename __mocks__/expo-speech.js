// Manual mock — TTS resolves immediately so lesson narration never blocks tests.
module.exports = {
  speak: jest.fn((text, opts) => { opts?.onDone?.(); }),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn(async () => false),
};
