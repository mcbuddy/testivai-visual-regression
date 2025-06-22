# TestivAI Ruby

A Ruby gem for TestivAI Visual Regression testing that integrates with RSpec and Capybara.

## Installation

Add this line to your application's Gemfile:

```ruby
group :test do
  gem 'testivai-ruby'
end
```

And then execute:

```bash
$ bundle install
```

Or install it yourself as:

```bash
$ gem install testivai-ruby
```

## Prerequisites

This gem requires:

1. A running instance of the TestivAI Visual Regression SDK
2. Chrome browser with remote debugging enabled
3. Capybara for browser automation

## Setup

### Configure Capybara with Chrome Remote Debugging

To use TestivAI Ruby with Capybara, you need to configure Chrome with remote debugging enabled:

```ruby
Capybara.register_driver :chrome do |app|
  capabilities = Selenium::WebDriver::Remote::Capabilities.chrome(
    chromeOptions: { args: %w(headless remote-debugging-port=9222) }
  )

  Capybara::Selenium::Driver.new app,
    browser: :chrome,
    desired_capabilities: capabilities
end

Capybara.javascript_driver = :chrome
```

### Configure TestivAI

Configure TestivAI in your test setup:

```ruby
# spec/spec_helper.rb or spec/rails_helper.rb
require 'testivai'

Testivai.configure do |config|
  config.testivai_sdk_host = 'localhost'
  config.testivai_sdk_port = 3000
  config.remote_debugging_port = 9222
  config.baseline_dir = '.testivai/visual-regression/baseline'
  config.compare_dir = '.testivai/visual-regression/compare'
  config.diff_threshold = 0.1
end
```

## Usage

### Basic Usage

Capture screenshots in your RSpec tests:

```ruby
describe 'Homepage' do
  it 'matches visual baseline' do
    visit '/'
    
    # Capture the entire page
    Testivai.capture_page('homepage')
    
    # Capture a specific element
    Testivai.capture_element('header', '.site-header')
    
    # Capture with options
    Testivai.capture_page('homepage-mobile', viewport: [375, 667], full_page: true)
  end
end
```

### RSpec Matchers

TestivAI Ruby provides custom RSpec matchers for visual testing:

```ruby
describe 'Homepage' do
  it 'matches visual baseline' do
    visit '/'
    
    # Match the entire page
    expect(page).to match_visual_baseline('homepage')
    
    # Match a specific element
    expect(page).to match_element_visual_baseline('header', '.site-header')
    
    # Match with options
    expect(page).to match_visual_baseline('homepage-mobile', viewport: [375, 667], full_page: true)
  end
end
```

## Configuration Options

- `testivai_sdk_host`: Host where the TestivAI SDK is running (default: 'localhost')
- `testivai_sdk_port`: Port where the TestivAI SDK is running (default: 3000)
- `remote_debugging_port`: Chrome remote debugging port (default: nil)
- `baseline_dir`: Directory to store baseline screenshots (default: '.testivai/visual-regression/baseline')
- `compare_dir`: Directory to store comparison screenshots (default: '.testivai/visual-regression/compare')
- `diff_threshold`: Threshold for acceptable difference between screenshots (default: 0.1)

## How It Works

1. TestivAI Ruby connects to the TestivAI SDK via HTTP
2. It captures screenshots using Capybara and Chrome's remote debugging protocol
3. The TestivAI SDK compares the screenshots against baselines
4. Results are returned to the Ruby gem

## Development

After checking out the repo, run `bin/setup` to install dependencies. Then, run `rake spec` to run the tests. You can also run `bin/console` for an interactive prompt that will allow you to experiment.

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/testivai/testivai-visual-regression.

## License

The gem is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
