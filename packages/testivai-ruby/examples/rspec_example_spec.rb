require 'capybara/rspec'
require 'selenium-webdriver'
require 'testivai'

# Configure Capybara
Capybara.register_driver :chrome do |app|
  capabilities = Selenium::WebDriver::Remote::Capabilities.chrome(
    chromeOptions: { args: %w(headless remote-debugging-port=9222) }
  )

  Capybara::Selenium::Driver.new app,
    browser: :chrome,
    desired_capabilities: capabilities
end

Capybara.javascript_driver = :chrome
Capybara.default_driver = :chrome

# Configure TestivAI
Testivai.configure do |config|
  config.testivai_sdk_host = 'localhost'
  config.testivai_sdk_port = 3000
  config.remote_debugging_port = 9222
  config.baseline_dir = '.testivai/visual-regression/baseline'
  config.compare_dir = '.testivai/visual-regression/compare'
  config.diff_threshold = 0.1
end

# Example test
RSpec.describe 'Example Website', type: :feature do
  it 'matches visual baseline for homepage' do
    visit 'https://example.com'
    
    # Basic usage - capture the entire page
    Testivai.capture_page('homepage')
    
    # Using RSpec matcher
    expect(page).to match_visual_baseline('homepage-matcher')
  end
  
  it 'matches visual baseline for specific elements' do
    visit 'https://example.com'
    
    # Capture a specific element
    Testivai.capture_element('header', 'h1')
    
    # Using RSpec matcher for element
    expect(page).to match_element_visual_baseline('header-matcher', 'h1')
  end
  
  it 'captures screenshots with options' do
    visit 'https://example.com'
    
    # Capture with options
    Testivai.capture_page('homepage-mobile', 
      full_page: true,
      viewport: [375, 667]
    )
    
    # Using RSpec matcher with options
    expect(page).to match_visual_baseline('homepage-mobile-matcher',
      full_page: true,
      viewport: [375, 667]
    )
  end
end
