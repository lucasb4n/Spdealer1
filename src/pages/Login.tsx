/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaShieldHalved as FaShieldAlt, FaChartLine, FaPlug } from 'react-icons/fa6';

import { useAuth } from '../contexts/AuthContext';
import '../pages/Login.css';
import { AssetService, type LogoKey } from 'services/AssetService';
import { useNotification } from '../contexts/NotificationContext';
import { sanitizeInput, getCsrfHeaders } from 'utils/security';
import { API_BASE_URL } from 'services/apiConfig';

const EyeIcon = FaEye as any;
const EyeSlashIcon = FaEyeSlash as any;
const ShieldAltIcon = FaShieldAlt as any;
const ChartLineIcon = FaChartLine as any;
const PlugIcon = FaPlug as any;

const useLoginLogoUrl = () => useMemo(() => AssetService.getLogoUrl('login'), []);

interface Filial {
  codigo: string;
  descricao: string;
}

interface EmpresaOpt {
  codigo: string;
  descricao: string;
}

const Login: React.FC = () => {
  const { login, user } = useAuth();
  const [username, setUsername] = useState('');
  const [empresas, setEmpresas] = useState<EmpresaOpt[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>('');
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [codigoFilSelecionado, setCodigoFilSelecionado] = useState<string>('');
  const loginLogoUrl = useLoginLogoUrl();
  const isAdmin = !!user?.role && user.role.toLowerCase() === 'admin';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
  const auxPath = `${baseUrl}/api/tabelas-auxiliares`;
  const { notify } = useNotification();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const carregarEmpresas = async () => {
      try {
        const response = await fetch(`${auxPath}/empresas`, {
          method: 'GET',
          credentials: 'include',
          signal: abortController.signal
        });
        if (!isMounted) return;
        if (response.ok) {
          const data: EmpresaOpt[] = await response.json();
          setEmpresas(data);
          if (data.length > 0) {
            setEmpresaSelecionada(data[0].codigo);
          }
        } else {
          notify('error', 'Erro ao carregar empresas');
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        if (isMounted) notify('error', 'Erro ao conectar ao servidor');
      }
    };

    const carregarFiliais = async () => {
      try {
        const response = await fetch(`${auxPath}/filiais`, {
          method: 'GET',
          credentials: 'include',
          signal: abortController.signal
        });
        if (!isMounted) return;
        if (response.ok) {
          const data: Filial[] = await response.json();
          setFiliais(data);
          if (data.length > 0) {
            setCodigoFilSelecionado(data[0].codigo);
          }
        } else {
          notify('error', 'Erro ao carregar filiais');
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        if (isMounted) notify('error', 'Erro ao conectar ao servidor');
      }
    };

    carregarEmpresas().then(() => carregarFiliais());
    return () => { isMounted = false; abortController.abort(); };
  }, []);

  const handleAdminAction = async (action: 'download-login' | 'upload-login' | 'download-sidebar' | 'upload-sidebar' | 'download-system' | 'upload-system') => {
    try {
      const [op, key] = action.split('-') as ['download' | 'upload', LogoKey];
      if (op === 'download') {
        await AssetService.downloadLogo(key);
        notify('success', `Logo ${key} baixada com sucesso!`);
      } else {
        if (fileInputRef.current) {
          (fileInputRef.current as any).dataset.key = key;
          fileInputRef.current.click();
        }
      }
    } catch (e) {
      notify('error', 'Falha na ação de logo.');
    }
  };

  const onFileSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = e.target.files;
    const key = (e.target as any).dataset.key as LogoKey | undefined;
    if (!files || files.length === 0 || !key) return;
    const file = files[0];
    try {
      await AssetService.uploadLogo(key, file);
      notify('success', 'Logo atualizada com sucesso.');
      setAdminMenuOpen(false);
    } catch (err) {
      notify('error', 'Erro ao enviar a logo.');
    } finally {
      e.currentTarget.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!codigoFilSelecionado) {
      setError('Selecione uma filial para continuar');
      setIsLoading(false);
      return;
    }

    // Sanitize inputs before sending
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedPassword = password; // Don't sanitize password (may contain special chars)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeaders()
        },
        body: JSON.stringify({
          login: sanitizedUsername,
          senha: sanitizedPassword,
          codigoFilSelecionado,
          empresaSelecionada
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.userData ? { ...data.userData } : {
          userId: String(data.userId),
          username: data.username,
          name: data.name,
          dashboardConfig: data.dashboardConfig,
          defaultDashboardId: data.defaultDashboardId ?? data.default_dashboard_id
        };
        if (codigoFilSelecionado) {
          localStorage.setItem('filialId', codigoFilSelecionado);
        }
        login(userData);
        navigate('/');
      } else {
        let errorMsg = 'Usuário ou senha inválidos';
        try {
          const errorData = await response.json();
          if (errorData?.message) errorMsg = errorData.message;
        } catch (err) { /* ignore parse error */ }
        setError(errorMsg);
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* === BRANDED PANEL (Left) === */}
      <div className="login-branded-panel">
        <div className="login-branded-content">
          <div className="login-branded-logo-wrapper">
             <img 
               src={`${process.env.PUBLIC_URL || ''}/logo-premium.png`} 
               alt="SpDealer Logo" 
               className="premium-brand-logo-img"
               style={{ 
                 width: '180px', 
                 height: 'auto', 
                 filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.5))',
                 borderRadius: '24px'
               }} 
             />
          </div>
          <p className="login-branded-subtitle">
            Sistema completo de gestão empresarial.
            Controle financeiro, operacional e estratégico em uma única plataforma.
          </p>
          <div className="login-branded-features">
            <div className="login-branded-feature">
              <span className="login-branded-feature-icon"><ChartLineIcon /></span>
              <span>Dashboards dinâmicos e personalizáveis</span>
            </div>
            <div className="login-branded-feature">
              <span className="login-branded-feature-icon"><ShieldAltIcon /></span>
              <span>Controle de acesso por usuário e grupo</span>
            </div>
            <div className="login-branded-feature">
              <span className="login-branded-feature-icon"><PlugIcon /></span>
              <span>Integração com sistemas fiscais e NF-e</span>
            </div>
          </div>
        </div>
      </div>

      {/* === FORM PANEL (Right) === */}
      <div className="login-form-panel">
        <div className="login-card">
          <h2 className="login-title">Bem-vindo</h2>
          <p className="login-subtitle">Faça login para acessar o sistema</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="empresa">Empresa</label>
              <select
                id="empresa"
                value={empresaSelecionada}
                onChange={e => setEmpresaSelecionada(e.target.value)}
                disabled={isLoading || empresas.length === 0}
                required
              >
                {empresas.length === 0 ? (
                  <option value="">Carregando empresas...</option>
                ) : (
                  <>
                    <option value="">Selecione uma empresa</option>
                    {empresas.map(emp => (
                      <option key={emp.codigo} value={emp.codigo}>
                        {emp.codigo} - {emp.descricao}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="filial">Filial</label>
              <select
                id="filial"
                value={codigoFilSelecionado}
                onChange={e => setCodigoFilSelecionado(e.target.value)}
                disabled={isLoading || filiais.length === 0}
                required
              >
                {filiais.length === 0 ? (
                  <option value="">Carregando filiais...</option>
                ) : (
                  <>
                    <option value="">Selecione uma filial</option>
                    {filiais.map(filial => (
                      <option key={filial.codigo} value={filial.codigo}>
                        {filial.descricao}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="username">Usuário</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Seu nome de usuário"
                disabled={isLoading}
                autoComplete="username"
                required
              />
            </div>

            <div className="input-group password-group">
              <label htmlFor="password">Senha</label>
              <div className="password-input-container">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeIcon /> : <EyeSlashIcon />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <button
                type="button"
                className="forgot-password-link"
                tabIndex={0}
                onClick={() => alert('Funcionalidade de recuperação de senha ainda não implementada.')}
              >
                Esqueceu a senha?
              </button>
            </div>

            <button
              type="submit"
              className={`login-button${isLoading ? ' login-button-loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Conectando...' : 'Entrar'}
            </button>
          </form>

          <footer className="signup-text">
            <hr />
            <div>
              @Seprocom Software e Serviços<br />
              Curitiba - Paraná<br />
              <a href="https://www.seprocom.com.br/" rel="noopener noreferrer">
                www.seprocom.com.br
              </a><br />
              (41) 3122-2028<br />
              <a href="mailto:seprocom@seprocom.com.br">seprocom@seprocom.com.br</a>
            </div>
          </footer>

          {/* Admin-only logo tools */}
          {isAdmin && (
            <div className="login-admin-logo-tools">
              <button type="button" className="admin-fab" onClick={() => setAdminMenuOpen(v => !v)} aria-label="Gerenciar logos">
                ⋮
              </button>
              {adminMenuOpen && (
                <div className="admin-menu">
                  <div className="admin-menu-title">Logos</div>
                  <button type="button" onClick={() => handleAdminAction('download-login')}>Baixar logo (Login)</button>
                  <button type="button" onClick={() => handleAdminAction('upload-login')}>Enviar logo (Login)</button>
                  <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '4px 0' }} />
                  <button type="button" onClick={() => handleAdminAction('download-sidebar')}>Baixar logo (Sidebar)</button>
                  <button type="button" onClick={() => handleAdminAction('upload-sidebar')}>Enviar logo (Sidebar)</button>
                  <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '4px 0' }} />
                  <button type="button" onClick={() => handleAdminAction('download-system')}>Baixar logo (Sistema)</button>
                  <button type="button" onClick={() => handleAdminAction('upload-system')}>Enviar logo (Sistema)</button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={onFileSelected} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;













