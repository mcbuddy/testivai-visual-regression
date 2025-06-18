// Test using the testivai-visual-regression package
const { testivAI, playwrightPlugin } = require('testivai-visual-regression');

// Initialize testivAI with configuration
try {
  // Create a simple configuration
  const visualTest = testivAI.init({
    framework: 'playwright',
    baselineDir: '.testivai/visual-regression/baseline',
    compareDir: '.testivai/visual-regression/compare',
    reportDir: '.testivai/visual-regression/reports',
    diffThreshold: 0.1
  });

  console.log('Successfully initialized testivAI with configuration');
  console.log('testivAI instance:', visualTest);
  
  // Try to use the plugin
  try {
    visualTest.use(playwrightPlugin());
    console.log('Successfully registered Playwright plugin');
  } catch (pluginError) {
    console.error('Error registering Playwright plugin:', pluginError.message);
  }
} catch (error) {
  console.error('Error initializing testivAI:', error.message);
}
