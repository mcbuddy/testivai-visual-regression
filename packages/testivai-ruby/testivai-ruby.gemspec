require_relative 'lib/testivai/ruby/version'

Gem::Specification.new do |spec|
  spec.name          = "testivai-ruby"
  spec.version       = Testivai::Ruby::VERSION
  spec.authors       = ["TestivAI Team"]
  spec.email         = ["info@testivai.com"]

  spec.summary       = "Ruby gem for TestivAI Visual Regression testing"
  spec.description   = "A Ruby wrapper for TestivAI Visual Regression SDK that integrates with RSpec and Capybara"
  spec.homepage      = "https://github.com/testivai/testivai-visual-regression"
  spec.license       = "MIT"
  spec.required_ruby_version = Gem::Requirement.new(">= 2.5.0")

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = "https://github.com/testivai/testivai-visual-regression"
  spec.metadata["changelog_uri"] = "https://github.com/testivai/testivai-visual-regression/blob/master/packages/testivai-ruby/CHANGELOG.md"

  # Specify which files should be added to the gem when it is released.
  # The `git ls-files -z` loads the files in the RubyGem that have been added into git.
  spec.files         = Dir.chdir(File.expand_path('..', __FILE__)) do
    `git ls-files -z`.split("\x0").reject { |f| f.match(%r{^(test|spec|features)/}) }
  end
  spec.bindir        = "exe"
  spec.executables   = spec.files.grep(%r{^exe/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]

  spec.add_dependency "capybara", "~> 3.0"
  spec.add_dependency "json", "~> 2.0"

  spec.add_development_dependency "bundler", "~> 2.0"
  spec.add_development_dependency "rake", "~> 13.0"
  spec.add_development_dependency "rspec", "~> 3.0"
  spec.add_development_dependency "selenium-webdriver", "~> 4.0"
end
