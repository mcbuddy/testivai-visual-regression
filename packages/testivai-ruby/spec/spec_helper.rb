require "bundler/setup"
require "testivai"
require "capybara/rspec"

RSpec.configure do |config|
  # Enable flags like --only-failures and --next-failure
  config.example_status_persistence_file_path = ".rspec_status"

  # Disable RSpec exposing methods globally on `Module` and `main`
  config.disable_monkey_patching!

  config.expect_with :rspec do |c|
    c.syntax = :expect
  end
end

# Configure Capybara with Chrome and remote debugging
Capybara.register_driver :chrome do |app|
  capabilities = Selenium::WebDriver::Remote::Capabilities.chrome(
    chromeOptions: { args: %w(headless remote-debugging-port=9222) }
  )

  Capybara::Selenium::Driver.new app,
    browser: :chrome,
    desired_capabilities: capabilities
end

Capybara.javascript_driver = :chrome

# Configure TestivAI
Testivai.configure do |config|
  config.testivai_sdk_host = 'localhost'
  config.testivai_sdk_port = 3000
  config.remote_debugging_port = 9222
  config.baseline_dir = '.testivai/visual-regression/baseline'
  config.compare_dir = '.testivai/visual-regression/compare'
  config.diff_threshold = 0.1
end
