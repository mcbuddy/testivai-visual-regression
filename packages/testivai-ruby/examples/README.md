# TestivAI Ruby Examples

This directory contains examples of how to use the TestivAI Ruby gem with RSpec and Capybara.

## Prerequisites

Before running the examples, make sure you have:

1. Installed the TestivAI Ruby gem
2. Started the TestivAI Visual Regression SDK server
3. Installed Chrome and ChromeDriver

## Running the Examples

To run the examples, execute the following command from the root of the gem:

```bash
bundle exec rspec examples/rspec_example_spec.rb
```

## Example Explanation

The `rspec_example_spec.rb` file demonstrates:

1. How to configure Capybara with Chrome and remote debugging
2. How to configure TestivAI
3. How to capture screenshots of entire pages
4. How to capture screenshots of specific elements
5. How to use RSpec matchers for visual testing
6. How to pass options to customize screenshot capture

## TestivAI SDK Server

The examples assume that the TestivAI Visual Regression SDK server is running on `localhost:3000`. If your server is running on a different host or port, update the configuration in the example file:

```ruby
Testivai.configure do |config|
  config.testivai_sdk_host = 'your-host'
  config.testivai_sdk_port = your-port
  # ...
end
```

## Chrome Remote Debugging

The examples use Chrome with remote debugging enabled on port 9222. This allows the TestivAI SDK to connect to the browser and capture screenshots. If you need to use a different port, update the configuration in the example file:

```ruby
# In Capybara configuration
capabilities = Selenium::WebDriver::Remote::Capabilities.chrome(
  chromeOptions: { args: %w(headless remote-debugging-port=your-port) }
)

# In TestivAI configuration
Testivai.configure do |config|
  config.remote_debugging_port = your-port
  # ...
end
