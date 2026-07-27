// src/services/AssetService.ts
// Serviço para obter, baixar e enviar logos (login, sidebar, system)

export type LogoKey = 'login' | 'sidebar' | 'system';

export class AssetService {
  static getLogoUrl(key: LogoKey): string {
    // Backend deve servir os arquivos estáticos destas rotas
    // Ex.: /api/assets/logo/login -> retorna URL da imagem atual
    return `/api/assets/logo/${key}`;
  }

  static async downloadLogo(key: LogoKey): Promise<void> {
    const url = this.getLogoUrl(key);
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Falha ao baixar logo');
    const blob = await res.blob();
    const a = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    a.href = objectUrl;
    a.download = `${key}-logo.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  }

  static async uploadLogo(key: LogoKey, file: File): Promise<void> {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`/api/assets/logo/${key}`, {
      method: 'POST',
      body: form,
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Falha ao enviar logo');
  }
}













