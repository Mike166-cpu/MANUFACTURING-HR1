import React, { useState } from 'react';

const ExportModal = ({ isOpen, onClose, onExport }) => {
  const [fileType, setFileType] = useState('');

  if (!isOpen) return null;

  const handleExport = () => {
    if (fileType) {
      onExport(fileType);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs md:max-w-md lg:max-w-lg">
        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-center">Export Options</h2>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm mb-2">Choose file format:</label>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-gray-50 hover:bg-white transition"
          >
            <option value="" disabled className="text-gray-500">
              Select format...
            </option>
            <option value="excel" className="text-gray-800 hover:bg-gray-200">
              Excel
            </option>
            <option value="pdf" className="text-gray-800 hover:bg-gray-200">
              PDF
            </option>
          </select>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <button
            onClick={onClose}
            className="w-full md:w-1/2 bg-gray-300 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="w-full md:w-1/2 bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition"
            disabled={!fileType}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
