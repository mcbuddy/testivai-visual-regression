require 'spec_helper'

RSpec.describe Testivai do
  # Save the original values to restore after tests
  before(:all) do
    @original_testivai_sdk_host = Testivai::Preferences.testivai_sdk_host
    @original_testivai_sdk_port = Testivai::Preferences.testivai_sdk_port
    @original_remote_debugging_port = Testivai::Preferences.remote_debugging_port
    @original_baseline_dir = Testivai::Preferences.baseline_dir
    @original_compare_dir = Testivai::Preferences.compare_dir
    @original_diff_threshold = Testivai::Preferences.diff_threshold
  end

  # Restore the original values after tests
  after(:all) do
    Testivai::Preferences.testivai_sdk_host = @original_testivai_sdk_host
    Testivai::Preferences.testivai_sdk_port = @original_testivai_sdk_port
    Testivai::Preferences.remote_debugging_port = @original_remote_debugging_port
    Testivai::Preferences.baseline_dir = @original_baseline_dir
    Testivai::Preferences.compare_dir = @original_compare_dir
    Testivai::Preferences.diff_threshold = @original_diff_threshold
  end

  # Reset values before each test
  before(:each) do
    Testivai::Preferences.testivai_sdk_host = nil
    Testivai::Preferences.testivai_sdk_port = nil
    Testivai::Preferences.remote_debugging_port = nil
    Testivai::Preferences.baseline_dir = nil
    Testivai::Preferences.compare_dir = nil
    Testivai::Preferences.diff_threshold = nil
  end

  describe '.configure' do
    it 'yields the Preferences module to the block' do
      expect { |b| described_class.configure(&b) }.to yield_with_args(Testivai::Preferences)
    end

    it 'configures the Preferences module' do
      described_class.configure do |config|
        config.testivai_sdk_host = 'custom-host'
        config.testivai_sdk_port = 4000
        config.remote_debugging_port = 9222
        config.baseline_dir = 'custom/baseline/dir'
        config.compare_dir = 'custom/compare/dir'
        config.diff_threshold = 0.2
      end

      expect(Testivai::Preferences.testivai_sdk_host).to eq('custom-host')
      expect(Testivai::Preferences.testivai_sdk_port).to eq(4000)
      expect(Testivai::Preferences.remote_debugging_port).to eq(9222)
      expect(Testivai::Preferences.baseline_dir).to eq('custom/baseline/dir')
      expect(Testivai::Preferences.compare_dir).to eq('custom/compare/dir')
      expect(Testivai::Preferences.diff_threshold).to eq(0.2)
    end
  end

  describe '.capture_page' do
    it 'delegates to Ruby.capture_page' do
      expect(Testivai::Ruby).to receive(:capture_page).with('test-screenshot', { full_page: true })
      described_class.capture_page('test-screenshot', full_page: true)
    end
  end

  describe '.capture_element' do
    it 'delegates to Ruby.capture_element' do
      expect(Testivai::Ruby).to receive(:capture_element).with('test-element', '.selector', { viewport: [375, 667] })
      described_class.capture_element('test-element', '.selector', viewport: [375, 667])
    end
  end
end
