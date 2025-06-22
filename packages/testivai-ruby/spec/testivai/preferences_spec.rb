require 'spec_helper'

RSpec.describe Testivai::Preferences do
  # Save the original values to restore after tests
  before(:all) do
    @original_testivai_sdk_host = described_class.testivai_sdk_host
    @original_testivai_sdk_port = described_class.testivai_sdk_port
    @original_remote_debugging_port = described_class.remote_debugging_port
    @original_baseline_dir = described_class.baseline_dir
    @original_compare_dir = described_class.compare_dir
    @original_diff_threshold = described_class.diff_threshold
    @original_runner = described_class.runner
  end

  # Restore the original values after tests
  after(:all) do
    described_class.testivai_sdk_host = @original_testivai_sdk_host
    described_class.testivai_sdk_port = @original_testivai_sdk_port
    described_class.remote_debugging_port = @original_remote_debugging_port
    described_class.baseline_dir = @original_baseline_dir
    described_class.compare_dir = @original_compare_dir
    described_class.diff_threshold = @original_diff_threshold
    described_class.runner = @original_runner
  end

  # Reset values before each test
  before(:each) do
    described_class.testivai_sdk_host = nil
    described_class.testivai_sdk_port = nil
    described_class.remote_debugging_port = nil
    described_class.baseline_dir = nil
    described_class.compare_dir = nil
    described_class.diff_threshold = nil
    described_class.runner = nil
  end

  describe '.testivai_sdk_host' do
    it 'returns the default value when not set' do
      expect(described_class.testivai_sdk_host).to eq('localhost')
    end

    it 'returns the custom value when set' do
      described_class.testivai_sdk_host = 'custom-host'
      expect(described_class.testivai_sdk_host).to eq('custom-host')
    end
  end

  describe '.testivai_sdk_port' do
    it 'returns the default value when not set' do
      expect(described_class.testivai_sdk_port).to eq(3000)
    end

    it 'returns the custom value when set' do
      described_class.testivai_sdk_port = 4000
      expect(described_class.testivai_sdk_port).to eq(4000)
    end
  end

  describe '.remote_debugging_port' do
    it 'returns nil when not set' do
      expect(described_class.remote_debugging_port).to be_nil
    end

    it 'returns the custom value when set' do
      described_class.remote_debugging_port = 9222
      expect(described_class.remote_debugging_port).to eq(9222)
    end
  end

  describe '.baseline_dir' do
    it 'returns the default value when not set' do
      expect(described_class.baseline_dir).to eq('.testivai/visual-regression/baseline')
    end

    it 'returns the custom value when set' do
      described_class.baseline_dir = 'custom/baseline/dir'
      expect(described_class.baseline_dir).to eq('custom/baseline/dir')
    end
  end

  describe '.compare_dir' do
    it 'returns the default value when not set' do
      expect(described_class.compare_dir).to eq('.testivai/visual-regression/compare')
    end

    it 'returns the custom value when set' do
      described_class.compare_dir = 'custom/compare/dir'
      expect(described_class.compare_dir).to eq('custom/compare/dir')
    end
  end

  describe '.diff_threshold' do
    it 'returns the default value when not set' do
      expect(described_class.diff_threshold).to eq(0.1)
    end

    it 'returns the custom value when set' do
      described_class.diff_threshold = 0.2
      expect(described_class.diff_threshold).to eq(0.2)
    end
  end

  describe '.runner' do
    it 'returns a proc when not set' do
      expect(described_class.runner).to be_a(Proc)
    end

    it 'returns the custom value when set' do
      custom_runner = proc { |cmd| "Custom: #{cmd}" }
      described_class.runner = custom_runner
      expect(described_class.runner).to eq(custom_runner)
    end
  end
end
