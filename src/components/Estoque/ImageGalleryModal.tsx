import React, { useEffect, useState, useRef } from 'react';
import { EstoqueImagemService, ImagemDTO } from 'services/EstoqueImagemService';
import './ImageGalleryModal.css';

interface ImageGalleryModalProps {
  fab_est: string;
  codprod_est: string;
  onClose: () => void;
  readOnly?: boolean;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({ fab_est, codprod_est, onClose, readOnly = false }) => {
  const [images, setImages] = useState<ImagemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await EstoqueImagemService.listar(fab_est, codprod_est);
      setImages(data);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar imagens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [fab_est, codprod_est]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await EstoqueImagemService.upload(fab_est, codprod_est, file);
      await loadImages();
    } catch (e: any) {
      setError(e.message || 'Erro ao fazer upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Deseja excluir esta imagem?')) return;
    try {
      await EstoqueImagemService.excluir(id);
      setImages(prev => prev.filter(img => img.id !== id));
    } catch (e: any) {
      setError(e.message || 'Erro ao excluir imagem');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (previewUrl) { setPreviewUrl(null); return; }
      onClose();
    }
  };

  return (
    <div className="imagem-modal-overlay" onKeyDown={handleKeyDown} tabIndex={-1}>
      {previewUrl && (
        <div className="imagem-modal__preview" onClick={() => setPreviewUrl(null)}>
          <img src={previewUrl} alt="Preview" className="imagem-modal__preview-img" />
          <button className="imagem-modal__preview-close" onClick={() => setPreviewUrl(null)}>×</button>
        </div>
      )}
      <div className="imagem-modal">
        <div className="imagem-modal__header">
          <h3>Imagens do Produto</h3>
          <div className="imagem-modal__header-actions">
            {!readOnly && (
              <>
                <button
                  type="button"
                  className="sp-btn sp-btn--primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Enviando...' : '+ Adicionar Imagem'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleUpload}
                />
              </>
            )}
            <button type="button" className="sp-btn sp-btn--secondary" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
        <div className="imagem-modal__body">
          {!fab_est || !codprod_est ? (
            <div className="imagem-modal__empty">
              Preencha os campos <strong>Código</strong> e <strong>Produto</strong> primeiro para gerenciar imagens.
            </div>
          ) : (
            <>
              <div className="imagem-modal__info">
                Produto: <strong>{fab_est}/{codprod_est}</strong>
              </div>

              {error && <div className="imagem-modal__error">{error}</div>}

              {loading ? (
                <div className="imagem-modal__loading">Carregando imagens...</div>
              ) : images.length === 0 ? (
                <div className="imagem-modal__empty">Nenhuma imagem cadastrada para este produto.</div>
              ) : (
                <div className="imagem-modal__grid">
                  {images.map(img => (
                    <div key={img.id} className="imagem-modal__item">
                      <div className="imagem-modal__item-img-wrapper" style={{ cursor: 'pointer' }} onClick={() => setPreviewUrl(EstoqueImagemService.getDownloadUrl(img.id))}>
                        <img
                          src={EstoqueImagemService.getDownloadUrl(img.id)}
                          alt={img.nome_arquivo}
                          className="imagem-modal__item-img"
                        />
                      </div>
                      <div className="imagem-modal__item-info">
                        <span className="imagem-modal__item-name" title={img.nome_arquivo}>
                          {img.nome_arquivo}
                        </span>
                        {!readOnly && (
                          <button
                            type="button"
                            className="sp-btn sp-btn--danger"
                            onClick={() => handleDelete(img.id)}
                            title="Excluir"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGalleryModal;
