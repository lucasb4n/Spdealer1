// src/components/TaskManagement/TaskUploadModal.tsx
import React, { useState } from 'react';
import styled from 'styled-components';

const Modal = styled.div<{ $isOpen: boolean }>`
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const UploadArea = styled.div`
  background: white;
  border-radius: 8px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  text-align: center;
`;

const UploadZone = styled.div`
  border: 2px dashed #0d6efd;
  border-radius: 8px;
  padding: 40px 20px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f8f9fa;
    border-color: #0b5ed7;
  }
`;

const FileInput = styled.input`
  display: none;
`;

interface TaskUploadModalProps {
  task_id: number;
  is_open: boolean;
  on_close: () => void;
  on_upload_complete?: () => void;
}

const TaskUploadModal: React.FC<TaskUploadModalProps> = ({ task_id, is_open, on_close, on_upload_complete }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/v1/tasks/${task_id}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        on_upload_complete?.();
      }
    } catch (error) {
      console.error('Erro ao upload:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal $isOpen={is_open} onClick={on_close}>
      <UploadArea onClick={(e) => e.stopPropagation()}>
        <h3>Upload de Imagem</h3>
        <UploadZone onClick={() => document.getElementById('file-input')?.click()}>
          <p>📸 Clique ou arraste uma imagem aqui</p>
          <small>PNG, JPG, GIF (máx 10MB)</small>
        </UploadZone>
        <FileInput
          id="file-input"
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          disabled={uploading}
        />
        {uploading && <p>Enviando...</p>}
      </UploadArea>
    </Modal>
  );
};

export default TaskUploadModal;













