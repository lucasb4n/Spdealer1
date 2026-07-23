export interface ImagemDTO {
  id: number;
  fab_est: string;
  codprod_est: string;
  nome_arquivo: string;
  data_inclusao: string;
}

const BASE_URL = '/api/estoque/imagens';

export const EstoqueImagemService = {
  async listar(fab_est: string, codprod_est: string): Promise<ImagemDTO[]> {
    const resp = await fetch(
      `${BASE_URL}?fab_est=${encodeURIComponent(fab_est)}&codprod_est=${encodeURIComponent(codprod_est)}`,
      { credentials: 'include' }
    );
    if (!resp.ok) throw new Error('Erro ao listar imagens');
    return resp.json();
  },

  async upload(fab_est: string, codprod_est: string, file: File): Promise<ImagemDTO> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fab_est', fab_est);
    formData.append('codprod_est', codprod_est);
    const resp = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao fazer upload');
    }
    return resp.json();
  },

  async excluir(id: number): Promise<void> {
    const resp = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!resp.ok) throw new Error('Erro ao excluir imagem');
  },

  getDownloadUrl(id: number): string {
    return `${BASE_URL}/${id}/download`;
  },
};
