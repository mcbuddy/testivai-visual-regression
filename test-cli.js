// Test importing the testivai-cli package
try {
  const testivaiCLI = require('testivai-cli');
  console.log('Successfully imported testivai-cli');
  console.log('Available exports:', Object.keys(testivaiCLI));
} catch (error) {
  console.error('Error importing testivai-cli:', error.message);
}
