module.exports = {
  lockAsync: jest.fn(async () => {}),
  unlockAsync: jest.fn(async () => {}),
  OrientationLock: {
    DEFAULT: 0, ALL: 1, PORTRAIT: 2, PORTRAIT_UP: 3, PORTRAIT_DOWN: 4,
    LANDSCAPE: 5, LANDSCAPE_LEFT: 6, LANDSCAPE_RIGHT: 7,
  },
};
