describe('Configuration Loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default path mocks
    mockPath.resolve.mockImplementation((...args) => args.join('/'));
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockReturnValue('/mock/dir');
    mockPath.extname.mockImplementation((filePath: string) => {
      const lastDot = filePath.lastIndexOf('.');
      return lastDot === -1 ? '' : filePath.substring(lastDot);
    });
  });
