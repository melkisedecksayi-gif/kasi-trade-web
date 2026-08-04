import logger from './logger';

beforeEach(() => {
  jest.clearAllMocks();
  logger.setUISideEffect = null;
});

describe('logger', () => {
  it('has all required methods', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.toast).toBe('function');
    expect(typeof logger.registerUI).toBe('function');
  });

  it('debug logs to console.debug', () => {
    const spy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    logger.debug('Test', 'hello');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('info logs to console.info', () => {
    const spy = jest.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('Test', 'hello');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('warn logs to console.warn', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('Test', 'hello');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('error logs to console.error and calls UI callback', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const uiFn = jest.fn();
    logger.registerUI(uiFn);
    logger.error('Test', 'hello');
    expect(spy).toHaveBeenCalled();
    expect(uiFn).toHaveBeenCalledWith('error', 'hello');
    spy.mockRestore();
  });

  it('registerUI works and sets the callback', () => {
    const fn = jest.fn();
    logger.registerUI(fn);
    expect(logger.setUISideEffect).toBe(fn);
  });

  it('toast calls the UI callback', () => {
    const uiFn = jest.fn();
    logger.registerUI(uiFn);
    logger.toast('Test', 'success', 'Item saved');
    expect(uiFn).toHaveBeenCalledWith('success', 'Item saved');
  });
});
