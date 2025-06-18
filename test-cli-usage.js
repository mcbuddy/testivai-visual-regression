// Test using the testivai-cli package
const { createCLICommandRegistry, HelpCommand, InitCommand, CompareCommand } = require('testivai-cli');

try {
  // Create a CLI command registry
  const registry = createCLICommandRegistry();
  
  console.log('Successfully created CLI command registry');
  
  // The default commands are already registered by createCLICommandRegistry()
  // Let's get all the registered commands
  try {
    const commands = registry.getAll();
    console.log('Successfully retrieved commands');
    console.log('Available commands:', commands.map(cmd => cmd.name));
    
    // Try to execute the help command
    try {
      registry.execute('help', [], {});
      console.log('Help command executed successfully');
    } catch (execError) {
      console.error('Error executing help command:', execError.message);
    }
  } catch (registerError) {
    console.error('Error retrieving commands:', registerError.message);
  }
} catch (error) {
  console.error('Error creating CLI command registry:', error.message);
}
