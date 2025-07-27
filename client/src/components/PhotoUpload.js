// client/src/components/PhotoUpload.js
import React, {
  useState,
  useRef,
  useContext,
  useEffect
} from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './PhotoUpload.css';

export default function PhotoUpload({ onUploaded }) {
  const { user } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  // 1) Generate & clean up preview URL
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // 2) When user picks a file
  const handleSelect = e => {
    if (e.target.files && e.target.files.length) {
      setFile(e.target.files[0]);
    }
  };

  // 3) Clear selection & reset input
  const clearSelection = () => {
    setFile(null);
    inputRef.current.value = '';
  };

  // 4) Upload handler
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    const data = new FormData();
    data.append('photo', file);
    data.append('isProfilePhoto', 'true'); // Indicate this is a profile photo

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/photo/upload`,
        data,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      onUploaded(res.data.user);
      clearSelection();
    } catch (err) {
      console.error('Upload failed:', err);
      alert(
        'Upload failed: ' +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="photo-upload">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleSelect}
        style={{ display: 'none' }}
        disabled={uploading}
      />

      {/* Choose / Change button */}
      <button
        type="button"
        className="photo-upload-picker"
        onClick={() => inputRef.current.click()}
        disabled={uploading}
      >
        {file ? 'Change Photo' : 'Choose Photo'}
      </button>

      {/* Preview + clear */}
      {preview && (
        <div className="photo-preview">
          <img src={preview} alt="preview" />
          <button
            type="button"
            className="photo-clear"
            onClick={clearSelection}
            disabled={uploading}
          >
            ×
          </button>
        </div>
      )}

      {/* Upload button */}
      <button
        type="button"
        className="photo-upload-button"
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading…' : 'Upload Photo'}
      </button>
    </div>
  );
}