import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud, FileText, AlertCircle } from 'lucide-react';

export default function UploadZone({ onFileSelected, disabled, isLoggedIn = true, onRequireAuth }) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleZoneClick = (e) => {
    if (e) e.stopPropagation();
    if (!isLoggedIn) {
      if (onRequireAuth) {
        onRequireAuth('Please log in first to upload and analyze your insurance policy.');
      }
      return;
    }
    fileInputRef.current?.click();
  };

  const validateAndProcessFile = (file) => {
    setErrorMsg(null);
    if (!isLoggedIn) {
      if (onRequireAuth) {
        onRequireAuth('Please log in first to upload and analyze your insurance policy.');
      }
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMsg(t('upload.errorPdfOnly', 'Please upload a PDF file. Other document formats are not supported.'));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg(t('upload.errorFileSize', 'File size exceeds the 15 MB limit. Please upload a smaller document.'));
      return;
    }
    onFileSelected(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (!isLoggedIn) {
      if (onRequireAuth) {
        onRequireAuth('Please log in first to upload and analyze your insurance policy.');
      }
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="upload-wrapper">
      <div
        className={`modern-upload-card ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleZoneClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          style={{ display: 'none' }}
          onChange={handleInputChange}
          disabled={disabled}
        />
        <div className="upload-emblem">
          <UploadCloud size={30} strokeWidth={1.8} />
        </div>
        <h2 className="upload-card-title">{t('upload.dropzoneTitle')}</h2>
        <p className="upload-card-sub">
          {t('upload.dropzoneHint')}
        </p>

        <button
          type="button"
          className="pill-btn pill-btn-primary"
          style={{ marginTop: '12px' }}
          disabled={disabled}
          onClick={handleZoneClick}
        >
          <FileText size={16} style={{ marginRight: '8px' }} />
          {isLoggedIn ? t('upload.choosePdf', 'Choose PDF Document') : 'Log In to Upload Policy'}
        </button>
      </div>

      {errorMsg && (
        <div className="form-alert form-alert-error" style={{ marginTop: '14px' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
