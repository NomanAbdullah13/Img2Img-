import React, { useState } from 'react';
import { Key, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface APIKeyInputProps {
  onAPIKeyValidated: (apiKey: string) => void;
}

export default function APIKeyInput({ onAPIKeyValidated }: APIKeyInputProps) {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateAPIKey = async () => {
    if (!apiKey.trim()) {
      setValidationError('Please enter your OpenAI API key');
      return;
    }

    setIsValidating(true);
    setValidationError('');

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        onAPIKeyValidated(apiKey);
      } else {
        setValidationError('Invalid API key. Please check and try again.');
      }
    } catch (error) {
      setValidationError('Network error. Please check your connection and try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateAPIKey();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md transform hover:scale-105 transition-transform duration-300">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Image Generator</h1>
          <p className="text-gray-600">Enter your OpenAI API key to get started</p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="sk-..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
            {validationError && (
              <div className="mt-2 flex items-center text-red-600 text-sm">
                <XCircle className="w-4 h-4 mr-1" />
                {validationError}
              </div>
            )}
          </div>

          <button
            onClick={validateAPIKey}
            disabled={isValidating || !apiKey.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Validate & Continue
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Don't have an API key?{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 transition-colors"
              >
                Get one here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
