require 'spec_helper'

RSpec.describe Testivai::Ruby::CapybaraIntegration do
  # Create a test class that includes the module
  let(:test_class) do
    Class.new do
      include Testivai::Ruby::CapybaraIntegration
    end
  end

  let(:instance) { test_class.new }

  describe '#match_visual_baseline' do
    it 'returns an RSpec matcher' do
      matcher = instance.match_visual_baseline('test-screenshot')
      expect(matcher).to be_a(RSpec::Matchers::Matcher)
    end

    it 'captures a screenshot when matching' do
      # Mock the capture_page method
      expect(Testivai::Ruby).to receive(:capture_page).with('test-screenshot', {})

      # Create a mock page object
      page = instance_double(Capybara::Session, current_url: 'http://example.com')

      # Create the matcher and execute it
      matcher = instance.match_visual_baseline('test-screenshot')
      result = matcher.matches?(page)

      # Verify the result
      expect(result).to be true
    end

    it 'passes options to capture_page' do
      # Mock the capture_page method with options
      expect(Testivai::Ruby).to receive(:capture_page).with(
        'test-screenshot',
        { full_page: true, viewport: [375, 667] }
      )

      # Create a mock page object
      page = instance_double(Capybara::Session, current_url: 'http://example.com')

      # Create the matcher with options and execute it
      matcher = instance.match_visual_baseline('test-screenshot', full_page: true, viewport: [375, 667])
      matcher.matches?(page)
    end
  end

  describe '#match_element_visual_baseline' do
    it 'returns an RSpec matcher' do
      matcher = instance.match_element_visual_baseline('test-element', '.selector')
      expect(matcher).to be_a(RSpec::Matchers::Matcher)
    end

    it 'captures an element screenshot when matching' do
      # Mock the capture_element method
      expect(Testivai::Ruby).to receive(:capture_element).with('test-element', '.selector', {})

      # Create a mock page object
      page = instance_double(Capybara::Session, current_url: 'http://example.com')

      # Create the matcher and execute it
      matcher = instance.match_element_visual_baseline('test-element', '.selector')
      result = matcher.matches?(page)

      # Verify the result
      expect(result).to be true
    end

    it 'passes options to capture_element' do
      # Mock the capture_element method with options
      expect(Testivai::Ruby).to receive(:capture_element).with(
        'test-element',
        '.selector',
        { viewport: [375, 667] }
      )

      # Create a mock page object
      page = instance_double(Capybara::Session, current_url: 'http://example.com')

      # Create the matcher with options and execute it
      matcher = instance.match_element_visual_baseline('test-element', '.selector', viewport: [375, 667])
      matcher.matches?(page)
    end
  end

  describe 'RSpec integration' do
    it 'is included in RSpec configuration' do
      # This test will only pass if RSpec is defined and the module is included
      if defined?(RSpec)
        # Get the list of modules included in RSpec.configuration
        included_modules = RSpec.configuration.instance_variable_get(:@include_modules) || []
        
        # Check if our module is included
        expect(included_modules).to include(Testivai::Ruby::CapybaraIntegration)
      else
        # Skip the test if RSpec is not defined
        skip "RSpec is not defined"
      end
    end
  end
end
