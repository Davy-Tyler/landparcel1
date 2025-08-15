import React, { useState, useCallback } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { apiService } from '../../services/api';
import { useNotifications } from '../Notifications/NotificationService';

interface ShapefileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadedFile {
  file: File;
  type: 'shp' | 'dbf' | 'prj';
}

interface TaskStatus {
  task_id: string;
  status: string;
  progress?: number;
  message?: string;
  created_plots?: string[];
  total_processed?: number;
  error?: string;
}

export const ShapefileUploadModal: React.FC<ShapefileUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addNotification } = useNotifications();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [locationId, setLocationId] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      processFiles(selectedFiles);
    }
  };

  const processFiles = (fileList: File[]) => {
    const newFiles: UploadedFile[] = [];

    fileList.forEach(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'shp' || extension === 'dbf' || extension === 'prj') {
        newFiles.push({
          file,
          type: extension as 'shp' | 'dbf' | 'prj'
        });
      }
    });

    setFiles(prev => {
      const updated = [...prev];
      newFiles.forEach(newFile => {
        const existingIndex = updated.findIndex(f => f.type === newFile.type);
        if (existingIndex >= 0) {
          updated[existingIndex] = newFile;
        } else {
          updated.push(newFile);
        }
      });
      return updated;
    });
  };

  const removeFile = (type: 'shp' | 'dbf' | 'prj') => {
    setFiles(prev => prev.filter(f => f.type !== type));
  };

  const canUpload = () => {
    const hasShp = files.some(f => f.type === 'shp');
    const hasDbf = files.some(f => f.type === 'dbf');
    return hasShp && hasDbf && !uploading;
  };

  const handleUpload = async () => {
    if (!canUpload()) return;

    setUploading(true);
    setTaskStatus(null);

    try {
      const formData = new FormData();
      
      files.forEach(({ file, type }) => {
        formData.append(`${type}_file`, file);
      });

      if (locationId) {
        formData.append('location_id', locationId);
      }

      const response = await apiService.uploadShapefile(formData);
      
      setTaskStatus({
        task_id: response.task_id,
        status: 'PROCESSING',
        message: response.message
      });

      // Start polling for status
      pollTaskStatus(response.task_id);

      addNotification({
        type: 'info',
        title: 'Shapefile Upload Started',
        message: 'Your shapefile is being processed. This may take a few minutes.'
      });

    } catch (error: any) {
      console.error('Shapefile upload error:', error);
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Failed to upload shapefile'
      });
      setUploading(false);
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    try {
      const status = await apiService.getShapefileStatus(taskId);
      setTaskStatus(status);

      if (status.status === 'SUCCESS') {
        setUploading(false);
        addNotification({
          type: 'success',
          title: 'Shapefile Processed Successfully',
          message: `Created ${status.total_processed} plots from shapefile`
        });
        onSuccess();
        handleClose();
      } else if (status.status === 'FAILURE') {
        setUploading(false);
        addNotification({
          type: 'error',
          title: 'Processing Failed',
          message: status.error || 'Failed to process shapefile'
        });
      } else if (status.status === 'PROGRESS' || status.status === 'PROCESSING') {
        // Continue polling
        setTimeout(() => pollTaskStatus(taskId), 2000);
      }
    } catch (error) {
      console.error('Error polling task status:', error);
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFiles([]);
      setLocationId('');
      setTaskStatus(null);
      onClose();
    }
  };

  const getFileIcon = (type: string) => {
    return <FileText className="w-5 h-5 text-blue-500" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAILURE':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'PROGRESS':
      case 'PROCESSING':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Upload Shapefile</h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop shapefile components here
            </p>
            <p className="text-gray-600 mb-4">
              Upload .shp, .dbf, and .prj files (optional)
            </p>
            <input
              type="file"
              multiple
              accept=".shp,.dbf,.prj"
              onChange={handleFileInput}
              className="hidden"
              id="shapefile-input"
              disabled={uploading}
            />
            <label
              htmlFor="shapefile-input"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Select Files
            </label>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Uploaded Files:</h3>
              {files.map(({ file, type }) => (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(type)}
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {type.toUpperCase()} • {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(type)}
                    disabled={uploading}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Location Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location (Optional)
            </label>
            <input
              type="text"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              placeholder="Enter location ID to assign all plots"
              disabled={uploading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          {/* Task Status */}
          {taskStatus && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                {getStatusIcon(taskStatus.status)}
                <h3 className="font-medium text-gray-900">Processing Status</h3>
              </div>
              
              <p className="text-gray-600 mb-2">{taskStatus.message}</p>
              
              {taskStatus.progress !== undefined && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${taskStatus.progress}%` }}
                  />
                </div>
              )}
              
              {taskStatus.status === 'SUCCESS' && taskStatus.total_processed && (
                <p className="text-green-600 font-medium">
                  Successfully created {taskStatus.total_processed} plots
                </p>
              )}
              
              {taskStatus.error && (
                <p className="text-red-600">{taskStatus.error}</p>
              )}
            </div>
          )}

          {/* Requirements */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Requirements:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• .shp file (required) - contains geometry data</li>
              <li>• .dbf file (required) - contains attribute data</li>
              <li>• .prj file (optional) - contains projection information</li>
              <li>• Maximum file size: 50MB per file</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Processing...' : 'Cancel'}
            </button>
            <button
              onClick={handleUpload}
              disabled={!canUpload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Shapefile
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};