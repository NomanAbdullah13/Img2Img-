import React, { useState, useCallback } from 'react';
import { Upload, Wand2, RefreshCw, Download, AlertCircle, Image as ImageIcon, X } from 'lucide-react';

interface ImageGeneratorProps {
  apiKey: string;
  onLogout: () => void;
}

export default function ImageGenerator({ apiKey, onLogout }: ImageGeneratorProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        handleFileUpload(file);
      }
    });
  }, []);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload image files only');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const newImage = e.target?.result as string;
      setUploadedImages(prev => [...prev, newImage]);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const generateImage = async () => {
    if (uploadedImages.length === 0 || !prompt.trim()) {
      setError('Please upload at least one image and enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Create content array with text and all images
      const content = [
        {
          type: 'text',
          text: `Based on these ${uploadedImages.length} image(s) and the user's request: "${prompt}", create a detailed and specific prompt for DALL-E 3 image generation. The prompt should be descriptive, artistic, and suitable for creating a high-quality image. Focus on visual elements, style, composition, and artistic details. Consider all the images provided as reference or inspiration.`
        },
        ...uploadedImages.map(image => ({
          type: 'image_url',
          image_url: {
            url: image
          }
        }))
      ];

      // First, use GPT-4o to analyze the images and create a refined prompt
      const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: content
            }
          ],
          max_tokens: 1000
        })
      });

      if (!visionResponse.ok) {
        const visionErrorData = await visionResponse.json();
        const visionErrorMessage = visionErrorData.error?.message || `Vision API error: ${visionResponse.status} ${visionResponse.statusText}`;
        throw new Error(visionErrorMessage);
      }

      const visionData = await visionResponse.json();
      const refinedPrompt = visionData.choices[0].message.content;

      // Now use the refined prompt for DALL-E 3 image generation
      const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: refinedPrompt,
          n: 1,
          size: '1024x1024'
        })
      });

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json();
        throw new Error(errorData.error?.message || 'Failed to generate image');
      }

      const imageData = await imageResponse.json();
      setGeneratedImage(imageData.data[0].url);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate image. Please try again.';
      setError(errorMessage);
      console.error('Error generating image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const refreshGeneration = () => {
    setUploadedImages([]);
    setPrompt('');
    setGeneratedImage(null);
    setError('');
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = 'generated-image.png';
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-8 h-8 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">AI Image Generator</h1>
            </div>
            <button
              onClick={onLogout}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Change API Key
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Upload Images ({uploadedImages.length})
              </h2>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : uploadedImages.length > 0
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-600">Drop your images here or</p>
                    <label className="text-blue-500 hover:text-blue-600 cursor-pointer font-medium">
                      browse files
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            Array.from(e.target.files).forEach(file => handleFileUpload(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">You can upload multiple images</p>
                </div>
              </div>

              {/* Display uploaded images */}
              {uploadedImages.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Uploaded Images:</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Uploaded ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg shadow-md"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Input */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Enter Prompt</h2>
              <div className="space-y-4">
                <div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to generate based on your images..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors duration-200"
                    rows={4}
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">
                      {prompt.length}/1000 characters
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {error}
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={generateImage}
                    disabled={isGenerating || uploadedImages.length === 0 || !prompt.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  >
                    {isGenerating ? (
                      <>
                        <Wand2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5 mr-2" />
                        Generate
                      </>
                    )}
                  </button>

                  <button
                    onClick={refreshGeneration}
                    className="bg-gray-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Output */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Generated Image</h2>
              {generatedImage && (
                <button
                  onClick={downloadImage}
                  className="bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors duration-200 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              )}
            </div>

            <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center border-2 border-gray-200">
              {isGenerating ? (
                <div className="text-center">
                  <Wand2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">Generating your image...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                </div>
              ) : generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Your generated image will appear here</p>
                  <p className="text-sm text-gray-500 mt-2">Upload images and enter a prompt to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}