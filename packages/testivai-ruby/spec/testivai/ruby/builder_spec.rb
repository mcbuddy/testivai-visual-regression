require 'spec_helper'

RSpec.describe Testivai::Ruby::Builder do
  let(:builder) { described_class.new }
  let(:http_response) { instance_double(Net::HTTPResponse, code: '200', body: '{"path": "/path/to/screenshot.png"}') }
  let(:http) { instance_double(Net::HTTP) }

  before do
    allow(Net::HTTP).to receive(:new).and_return(http)
    allow(http).to receive(:request).and_return(http_response)
  end

  describe '#capture_page' do
    let(:capybara_session) { instance_double(Capybara::Session, current_url: 'http://example.com') }

    before do
      allow(Capybara).to receive(:current_session).and_return(capybara_session)
    end

    it 'sends a request to the TestivAI SDK' do
      # Set up expectations for the HTTP request
      expect(Net::HTTP::Post).to receive(:new).with(
        anything,
        'Content-Type' => 'application/json'
      ).and_call_original

      # Call the method
      result = builder.capture_page('test-screenshot')

      # Verify the result
      expect(result).to eq('/path/to/screenshot.png')
      expect(http).to have_received(:request)
    end

    it 'includes the correct payload' do
      # Set up expectations for the HTTP request
      expect(Net::HTTP::Post).to receive(:new).with(
        anything,
        'Content-Type' => 'application/json'
      ).and_wrap_original do |original, *args|
        request = original.call(*args)
        
        # Parse the request body and verify it contains the expected data
        payload = JSON.parse(request.body)
        expect(payload['name']).to eq('test-screenshot')
        expect(payload['url']).to eq('http://example.com')
        expect(payload['framework']).to eq('capybara')
        expect(payload['baselineDir']).to eq(Testivai::Preferences.baseline_dir)
        expect(payload['compareDir']).to eq(Testivai::Preferences.compare_dir)
        expect(payload['diffThreshold']).to eq(Testivai::Preferences.diff_threshold)
        
        request
      end

      # Call the method
      builder.capture_page('test-screenshot')
    end

    it 'handles options correctly' do
      # Set up expectations for the HTTP request
      expect(Net::HTTP::Post).to receive(:new).with(
        anything,
        'Content-Type' => 'application/json'
      ).and_wrap_original do |original, *args|
        request = original.call(*args)
        
        # Parse the request body and verify it contains the expected options
        payload = JSON.parse(request.body)
        expect(payload['options']['fullPage']).to be true
        expect(payload['options']['viewport']).to eq([375, 667])
        
        request
      end

      # Call the method with options
      builder.capture_page('test-screenshot', full_page: true, viewport: [375, 667])
    end
  end

  describe '#capture_element' do
    let(:capybara_session) { instance_double(Capybara::Session, current_url: 'http://example.com') }

    before do
      allow(Capybara).to receive(:current_session).and_return(capybara_session)
    end

    it 'sends a request to the TestivAI SDK' do
      # Set up expectations for the HTTP request
      expect(Net::HTTP::Post).to receive(:new).with(
        anything,
        'Content-Type' => 'application/json'
      ).and_call_original

      # Call the method
      result = builder.capture_element('test-element', '.selector')

      # Verify the result
      expect(result).to eq('/path/to/screenshot.png')
      expect(http).to have_received(:request)
    end

    it 'includes the correct payload' do
      # Set up expectations for the HTTP request
      expect(Net::HTTP::Post).to receive(:new).with(
        anything,
        'Content-Type' => 'application/json'
      ).and_wrap_original do |original, *args|
        request = original.call(*args)
        
        # Parse the request body and verify it contains the expected data
        payload = JSON.parse(request.body)
        expect(payload['name']).to eq('test-element')
        expect(payload['url']).to eq('http://example.com')
        expect(payload['framework']).to eq('capybara')
        expect(payload['options']['selector']).to eq('.selector')
        
        request
      end

      # Call the method
      builder.capture_element('test-element', '.selector')
    end
  end

  context 'when the TestivAI SDK returns an error' do
    let(:http_response) { instance_double(Net::HTTPResponse, code: '500', message: 'Internal Server Error') }

    it 'raises an error' do
      allow(Capybara).to receive(:current_session).and_return(
        instance_double(Capybara::Session, current_url: 'http://example.com')
      )

      expect {
        builder.capture_page('test-screenshot')
      }.to raise_error(Testivai::Ruby::Error, "TestivAI SDK returned error: 500 Internal Server Error")
    end
  end
end
