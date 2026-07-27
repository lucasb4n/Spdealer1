"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var react_1 = require("react");
var Localizar_1 = require("components/Localizar");
var ClienteForm_1 = require("../Forms/ClienteForm");
var FornecedorForm_1 = require("../Forms/FornecedorForm");
var ClientesService_1 = require("services/ClientesService");
var FornecedoresService_1 = require("services/FornecedoresService");
var formatters_1 = require("utils/formatters");
var ClientesManager = function (_a) {
    var tipo = _a.tipo;
    var _b = (0, react_1.useState)([]), dados = _b[0], setDados = _b[1];
    var _c = (0, react_1.useState)(false), _loading = _c[0], setLoading = _c[1];
    // evitar warning de variável atribuída e não usada
    void _loading;
    var _d = (0, react_1.useState)(false), showForm = _d[0], setShowForm = _d[1];
    var _e = (0, react_1.useState)(null), formMode = _e[0], setFormMode = _e[1];
    var _f = (0, react_1.useState)(null), registroSelecionado = _f[0], setRegistroSelecionado = _f[1];
    // Busca dados conforme tipo
    (0, react_1.useEffect)(function () {
        setLoading(true);
        var fetch = function () { return __awaiter(void 0, void 0, void 0, function () {
            var res, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(tipo === 'C')) return [3 /*break*/, 2];
                        return [4 /*yield*/, ClientesService_1.ClientesService.getClientes()];
                    case 1:
                        res = _a.sent();
                        setDados(res);
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, FornecedoresService_1.FornecedoresService.getFornecedores()];
                    case 3:
                        res = _a.sent();
                        setDados(res);
                        _a.label = 4;
                    case 4:
                        setLoading(false);
                        return [2 /*return*/];
                }
            });
        }); };
        fetch();
    }, [tipo, showForm]);
    // Colunas padrão
    var columns = [
        { headerName: 'Código', field: 'codigo_cli', width: 100 },
        { headerName: 'Documento', field: 'cgccpf_cli', width: 150, valueFormatter: function (params) { return (0, formatters_1.formatarDocumento)(params.value, params.data.tipopessoa_cli); } },
        { headerName: 'Nome/Razão Social', field: 'nome_cli', flex: 1 },
        { headerName: 'UF', field: 'uf_cli', width: 60 },
        { headerName: 'Inscrição Estadual', field: 'inscest_cli', width: 140 },
        { headerName: 'Telefone', field: 'fone_cli', width: 120, valueFormatter: function (params) { return (0, formatters_1.formatarTelefone)(params.value); } },
        { headerName: 'Celular', field: 'celular_cli', width: 120, valueFormatter: function (params) { return (0, formatters_1.formatarTelefone)(params.value); } },
        {
            headerName: 'Ações',
            field: 'acoes',
            width: 120,
            cellRenderer: function (params) { return (<button onClick={function () { return handleEditar(params.data); }} style={{ marginRight: 8 }}>Editar</button>); }
        }
    ];
    // Editar registro
    var handleEditar = function (registro) {
        // debug: inspecionar registro passado para o formulário
        // Remover/ajustar este log após diagnóstico
        // eslint-disable-next-line no-console
        console.debug('DEBUG: handleEditar registro:', registro);
        setRegistroSelecionado(registro);
        setFormMode('edit');
        setShowForm(true);
    };
    // Incluir novo
    var handleIncluir = function () {
        setRegistroSelecionado(null);
        setFormMode('add');
        setShowForm(true);
    };
    // Excluir registro (com regra de bloqueio)
    var handleExcluir = function (registro) { return __awaiter(void 0, void 0, void 0, function () {
        var podeExcluir;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    podeExcluir = false;
                    if (!(tipo === 'C')) return [3 /*break*/, 2];
                    return [4 /*yield*/, ClientesService_1.ClientesService.canDeleteCliente(registro.codigo_cli)];
                case 1:
                    podeExcluir = _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, FornecedoresService_1.FornecedoresService.canDeleteFornecedor(registro.codigo_cli)];
                case 3:
                    podeExcluir = _a.sent();
                    _a.label = 4;
                case 4:
                    if (!podeExcluir) {
                        alert('Não é possível excluir: existem registros vinculados em contas a receber/pagar.');
                        return [2 /*return*/];
                    }
                    if (!window.confirm('Confirma exclusão?')) return [3 /*break*/, 9];
                    if (!(tipo === 'C')) return [3 /*break*/, 6];
                    return [4 /*yield*/, ClientesService_1.ClientesService.deleteCliente(registro.codigo_cli)];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, FornecedoresService_1.FornecedoresService.deleteFornecedor(registro.codigo_cli)];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8:
                    setShowForm(false);
                    _a.label = 9;
                case 9: return [2 /*return*/];
            }
        });
    }); };
    // Salvar (após inclusão/edição)
    var handleSalvar = function () {
        setShowForm(false);
        setFormMode(null);
    };
    return (<div style={{ display: 'flex', position: 'relative', height: '100%', minHeight: 500 }}>
      {/* Grade principal */}
      <div style={{ flex: 1, padding: 24, transition: 'filter 0.2s', filter: showForm ? 'blur(0.5px)' : 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>{tipo === 'C' ? 'Clientes' : 'Fornecedores'}</h2>
          <button onClick={handleIncluir} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>+ Incluir Registro</button>
        </div>
        <Localizar_1["default"] title={tipo === 'C' ? 'Clientes' : 'Fornecedores'} columns={columns} data={dados} editable={false} onRowSelected={function (rows) {
            if (rows && rows.length === 1)
                handleEditar(rows[0]);
        }}/>
      </div>
      {/* Painel lateral do formulário */}
      {showForm && (<div style={{ width: 480, background: '#fff', boxShadow: '-2px 0 16px rgba(0,0,0,0.08)', height: '100%', position: 'absolute', right: 0, top: 0, zIndex: 10, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '18px 18px 0 18px' }}>
            {formMode === 'edit' && registroSelecionado && (<button onClick={function () { return handleExcluir(registroSelecionado); }} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Excluir</button>)}
            <button onClick={function () { return setShowForm(false); }} style={{ background: '#6b7280', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancelar</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 18px 18px' }}>
            {tipo === 'C' ? (<ClienteForm_1["default"] cliente={registroSelecionado || {}} onChange={function (campo, valor) {
                    setRegistroSelecionado(function (prev) {
                        var _a;
                        return (__assign(__assign({}, prev), (_a = {}, _a[campo] = valor, _a)));
                    });
                }} modo={registroSelecionado ? 'editar' : 'novo'}/>) : (<FornecedorForm_1.FornecedorForm fornecedor={registroSelecionado} onSave={handleSalvar} onCancel={function () { setShowForm(false); setFormMode(null); }} isEditing={!!registroSelecionado}/>)}
          </div>
        </div>)}
    </div>);
};
exports["default"] = ClientesManager;
