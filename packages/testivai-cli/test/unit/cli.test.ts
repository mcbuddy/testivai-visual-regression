/**
 * Tests for CLI functionality
 */

import { CLICommand, CLICommandRegistry } from '../../src/interfaces';
import { BaseCLICommand, CLICommandRegistryImpl, createCLICommandRegistry } from '../../src/commands';

describe('CLI Command Registry', () => {
  let registry: CLICommandRegistry;
  
  beforeEach(() => {
    registry = new CLICommandRegistryImpl();
  });
  
  it('should register and retrieve commands', () => {
    const mockCommand: CLICommand = {
      name: 'test',
      description: 'Test command',
      execute: jest.fn()
    };
    
    registry.register(mockCommand);
    
    expect(registry.get('test')).toBe(mockCommand);
    expect(registry.getAll()).toContain(mockCommand);
  });
  
  it('should execute a registered command', async () => {
    const mockExecute = jest.fn();
    const mockCommand: CLICommand = {
      name: 'test',
      description: 'Test command',
      execute: mockExecute
    };
    
    registry.register(mockCommand);
    
    const args = ['arg1', 'arg2'];
    const options = { option1: 'value1' };
    
    await registry.execute('test', args, options);
    
    expect(mockExecute).toHaveBeenCalledWith(args, options);
  });
  
  it('should throw an error when executing an unregistered command', async () => {
    await expect(registry.execute('unknown', [], {})).rejects.toThrow("Command 'unknown' not found");
  });
});

describe('Base CLI Command', () => {
  class TestCommand extends BaseCLICommand {
    public name = 'test';
    public description = 'Test command';
    
    public execute = jest.fn();
  }
  
  it('should implement the CLICommand interface', () => {
    const command = new TestCommand();
    
    expect(command.name).toBe('test');
    expect(command.description).toBe('Test command');
    expect(typeof command.execute).toBe('function');
  });
});

describe('createCLICommandRegistry', () => {
  it('should create a registry with default commands', () => {
    const registry = createCLICommandRegistry();
    
    // Check for default commands
    expect(registry.get('help')).toBeDefined();
    expect(registry.get('init')).toBeDefined();
    expect(registry.get('compare')).toBeDefined();
  });
  
  it('should execute help command', async () => {
    // Mock console.log to prevent output during tests
    const originalConsoleLog = console.log;
    console.log = jest.fn();
    
    try {
      const registry = createCLICommandRegistry();
      const helpCommand = registry.get('help');
      
      expect(helpCommand).toBeDefined();
      
      // Execute help command
      await helpCommand!.execute([], {});
      
      // Verify console.log was called (help output)
      expect(console.log).toHaveBeenCalled();
    } finally {
      // Restore console.log
      console.log = originalConsoleLog;
    }
  });
  
  it('should execute init command', async () => {
    // Mock console.log to prevent output during tests
    const originalConsoleLog = console.log;
    console.log = jest.fn();
    
    try {
      const registry = createCLICommandRegistry();
      const initCommand = registry.get('init');
      
      expect(initCommand).toBeDefined();
      
      // Execute init command
      await initCommand!.execute([], {});
      
      // Verify console.log was called (init output)
      expect(console.log).toHaveBeenCalled();
    } finally {
      // Restore console.log
      console.log = originalConsoleLog;
    }
  });
  
  it('should execute compare command', async () => {
    // Mock console.log to prevent output during tests
    const originalConsoleLog = console.log;
    console.log = jest.fn();
    
    try {
      const registry = createCLICommandRegistry();
      const compareCommand = registry.get('compare');
      
      expect(compareCommand).toBeDefined();
      
      // Execute compare command
      await compareCommand!.execute([], {});
      
      // Verify console.log was called (compare output)
      expect(console.log).toHaveBeenCalled();
    } finally {
      // Restore console.log
      console.log = originalConsoleLog;
    }
  });
});
