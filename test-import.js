// Test importing the testivai-visual-regression package
try {
  const testivai = require('testivai-visual-regression');
  console.log('Successfully imported testivai-visual-regression');
  console.log('Available exports:', Object.keys(testivai));
} catch (error) {
  console.error('Error importing testivai-visual-regression:', error.message);
}
