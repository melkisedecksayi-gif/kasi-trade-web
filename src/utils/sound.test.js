import { playSaleBeep, playErrorBeep, playAlertBeep, playClickBeep } from './sound';

jest.useFakeTimers();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('sound utils', () => {
  it('playSaleBeep is a function and does not throw', () => {
    expect(typeof playSaleBeep).toBe('function');
    expect(() => playSaleBeep()).not.toThrow();
    jest.runAllTimers();
  });

  it('playErrorBeep is a function and does not throw', () => {
    expect(typeof playErrorBeep).toBe('function');
    expect(() => playErrorBeep()).not.toThrow();
  });

  it('playAlertBeep is a function and does not throw', () => {
    expect(typeof playAlertBeep).toBe('function');
    expect(() => playAlertBeep()).not.toThrow();
    jest.runAllTimers();
  });

  it('playClickBeep is a function and does not throw', () => {
    expect(typeof playClickBeep).toBe('function');
    expect(() => playClickBeep()).not.toThrow();
  });
});
