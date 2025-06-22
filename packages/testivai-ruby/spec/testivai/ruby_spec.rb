RSpec.describe Testivai::Ruby do
  it "has a version number" do
    expect(Testivai::Ruby::VERSION).not_to be nil
  end

  describe ".capture_page" do
    it "captures a screenshot of the current page" do
      # Mock the Builder class to avoid actual HTTP requests
      builder = instance_double(Testivai::Ruby::Builder)
      allow(Testivai::Ruby::Builder).to receive(:new).and_return(builder)
      allow(builder).to receive(:capture_page).and_return('/path/to/screenshot.png')

      # Call the method
      result = Testivai::Ruby.capture_page('test-screenshot')

      # Verify the result
      expect(result).to eq('/path/to/screenshot.png')
      expect(builder).to have_received(:capture_page).with('test-screenshot', {})
    end
  end

  describe ".capture_element" do
    it "captures a screenshot of a specific element" do
      # Mock the Builder class to avoid actual HTTP requests
      builder = instance_double(Testivai::Ruby::Builder)
      allow(Testivai::Ruby::Builder).to receive(:new).and_return(builder)
      allow(builder).to receive(:capture_element).and_return('/path/to/element-screenshot.png')

      # Call the method
      result = Testivai::Ruby.capture_element('test-element', '.selector')

      # Verify the result
      expect(result).to eq('/path/to/element-screenshot.png')
      expect(builder).to have_received(:capture_element).with('test-element', '.selector', {})
    end
  end
end
