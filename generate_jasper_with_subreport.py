#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gerador de Templates Jasper Reports com Subrelatório de Cabeçalho
Cria um .jrxml completo com:
- Subrelatório de cabeçalho (BaseTemplate)
- Seção de detalhes
- Rodapé com paginação
"""

import sys
import os
from datetime import datetime


def gerar_template_jasper(
    nome_arquivo="RelatorioCustomizado",
    titulo_relatorio="Relatório Financeiro",
    campos_sql=None,
    sql_query="SELECT * FROM receber LIMIT 100",
    usar_subreport_cabecalho=True,
    largura_pagina=595,
    altura_pagina=842,
):
    """
    Gera um template Jasper completo com subrelatório de cabeçalho.
    
    Args:
        nome_arquivo: Nome do arquivo .jrxml sem extensão
        titulo_relatorio: Título que aparecerá no relatório
        campos_sql: Lista de tuplas (nome_campo, tipo_java, largura_coluna)
        sql_query: SQL SELECT para dados
        usar_subreport_cabecalho: Se True, inclui subreport BaseTemplate
        largura_pagina: Largura da página (padrão A4: 595pt)
        altura_pagina: Altura da página (padrão A4: 842pt)
    
    Returns:
        str: XML do template Jasper
    """
    
    if campos_sql is None:
        campos_sql = [
            ("codigo", "java.lang.Integer", 80),
            ("nome_cli", "java.lang.String", 200),
            ("vlrsal_rec", "java.math.BigDecimal", 100),
            ("dtvenci_rec", "java.sql.Date", 90),
        ]
    
    # Configurações padrão
    margem_esquerda = 20
    margem_direita = 20
    margem_topo = 100 if usar_subreport_cabecalho else 50
    margem_inferior = 50
    
    largura_coluna = largura_pagina - margem_esquerda - margem_direita
    altura_detalhe = 18
    
    # Gerar UUID para elementos
    import uuid
    
    def uuid_gen():
        return str(uuid.uuid4())
    
    # ===== INÍCIO DO XML =====
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" 
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
             xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports 
             http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" 
             name="{nome_arquivo}" 
             pageWidth="{largura_pagina}" 
             pageHeight="{altura_pagina}" 
             columnWidth="{largura_coluna}" 
             leftMargin="{margem_esquerda}" 
             rightMargin="{margem_direita}" 
             topMargin="{margem_topo}" 
             bottomMargin="{margem_inferior}">
  
  <!-- ===== PROPRIEDADES ===== -->
  <property name="com.jaspersoft.studio.data.defaultdataadapter" value="New Data Adapter"/>
  <property name="com.jaspersoft.studio.unit.pageHeight" value="pixel"/>
  <property name="com.jaspersoft.studio.unit.pageWidth" value="pixel"/>
  <property name="com.jaspersoft.studio.unit.topMargin" value="pixel"/>
  <property name="com.jaspersoft.studio.unit.bottomMargin" value="pixel"/>
  <property name="com.jaspersoft.studio.unit.leftMargin" value="pixel"/>
  <property name="com.jaspersoft.studio.unit.rightMargin" value="pixel"/>
  <property name="com.jaspersoft.studio.unit.columnWidth" value="pixel"/>
  
  <!-- ===== PARÂMETROS ===== -->
  <parameter name="EMPRESA_NOME" class="java.lang.String" isForPrompting="false">
    <defaultValueExpression><![CDATA["SPDEALER SISTEMA"]]></defaultValueExpression>
  </parameter>
  <parameter name="EMPRESA_CNPJ" class="java.lang.String" isForPrompting="false">
    <defaultValueExpression><![CDATA["00.000.000/0000-00"]]></defaultValueExpression>
  </parameter>
  <parameter name="USUARIO" class="java.lang.String" isForPrompting="false">
    <defaultValueExpression><![CDATA["Usuário"]]></defaultValueExpression>
  </parameter>
  <parameter name="DATA_RELATORIO" class="java.util.Date" isForPrompting="false">
    <defaultValueExpression><![CDATA[new java.util.Date()]]></defaultValueExpression>
  </parameter>
  <parameter name="SUBREPORT_DIR" class="java.lang.String" isForPrompting="false">
    <defaultValueExpression><![CDATA["reports/templates/"]]></defaultValueExpression>
  </parameter>
"""
    
    # ===== QUERY SQL =====
    xml += f"""
  <!-- ===== QUERY SQL ===== -->
  <queryString language="SQL"><![CDATA[
    {sql_query}
  ]]></queryString>
"""
    
    # ===== CAMPOS =====
    xml += "\n  <!-- ===== CAMPOS ===== -->\n"
    for nome_campo, tipo_java, _ in campos_sql:
        xml += f'  <field name="{nome_campo}" class="{tipo_java}"/>\n'
    
    # ===== ESTILOS =====
    xml += f"""
  <!-- ===== ESTILOS ===== -->
  <style name="TitleStyle" mode="Opaque" backcolor="#003366" forecolor="#FFFFFF" fontSize="16" isBold="true" vTextAlign="Middle"/>
  <style name="HeaderStyle" mode="Opaque" backcolor="#4472C4" forecolor="#FFFFFF" fontSize="11" isBold="true" hTextAlign="Center" vTextAlign="Middle"/>
  <style name="DetailStyle" fontSize="9" vTextAlign="Middle"/>
  <style name="TotalStyle" mode="Opaque" backcolor="#E7E6E6" fontSize="11" isBold="true" hTextAlign="Right"/>
  
  <!-- ===== BACKGROUND ===== -->
  <background>
    <band splitType="Stretch"/>
  </background>
"""
    
    # ===== PAGE HEADER com SUBREPORT =====
    if usar_subreport_cabecalho:
        xml += f"""
  <!-- ===== PAGE HEADER COM SUBREPORT ===== -->
  <pageHeader>
    <band height="80" splitType="Stretch">
      <!-- Subreport: BaseTemplate para cabeçalho -->
      <subreport>
        <reportElement x="0" y="0" width="{largura_coluna}" height="80" uuid="{uuid_gen()}"/>
        <subreportParameter name="EMPRESA_NOME">
          <subreportParameterExpression><![CDATA[$P{{EMPRESA_NOME}}]]></subreportParameterExpression>
        </subreportParameter>
        <subreportParameter name="EMPRESA_CNPJ">
          <subreportParameterExpression><![CDATA[$P{{EMPRESA_CNPJ}}]]></subreportParameterExpression>
        </subreportParameter>
        <subreportParameter name="USUARIO">
          <subreportParameterExpression><![CDATA[$P{{USUARIO}}]]></subreportParameterExpression>
        </subreportParameter>
        <subreportParameter name="DATA_RELATORIO">
          <subreportParameterExpression><![CDATA[$P{{DATA_RELATORIO}}]]></subreportParameterExpression>
        </subreportParameter>
        <connectionExpression><![CDATA[$P{{REPORT_CONNECTION}}]]></connectionExpression>
        <subreportExpression><![CDATA[$P{{SUBREPORT_DIR}} + "BaseTemplate.jasper"]]></subreportExpression>
      </subreport>
    </band>
  </pageHeader>

  <!-- ===== COLUMN HEADER ===== -->
  <columnHeader>
    <band height="25" splitType="Stretch">
"""
        
        # Cabeçalhos das colunas
        posicao_x = 0
        for nome_campo, _, largura in campos_sql:
            xml += f"""      <rectangle>
        <reportElement style="HeaderStyle" x="{posicao_x}" y="0" width="{largura}" height="25" uuid="{uuid_gen()}"/>
      </rectangle>
      <staticText>
        <reportElement style="HeaderStyle" x="{posicao_x}" y="0" width="{largura}" height="25" uuid="{uuid_gen()}"/>
        <textElement textAlignment="Center" verticalAlignment="Middle">
          <font size="10" isBold="true"/>
        </textElement>
        <text><![CDATA[{nome_campo.upper().replace('_', ' ')}]]></text>
      </staticText>
"""
            posicao_x += largura
        
        xml += "    </band>\n  </columnHeader>\n"
    
    # ===== DETAIL BAND =====
    xml += f"""
  <!-- ===== DETAIL BAND ===== -->
  <detail>
    <band height="{altura_detalhe}" splitType="Stretch">
"""
    
    posicao_x = 0
    for nome_campo, tipo_java, largura in campos_sql:
        # Determinar formato baseado no tipo
        if "BigDecimal" in tipo_java or "Double" in tipo_java:
            formato = 'pattern="#,##0.00"'
        elif "Date" in tipo_java:
            formato = 'pattern="dd/MM/yyyy"'
        else:
            formato = ""
        
        xml += f"""      <textField {formato}>
        <reportElement style="DetailStyle" x="{posicao_x}" y="0" width="{largura}" height="{altura_detalhe}" uuid="{uuid_gen()}"/>
        <textElement textAlignment="Right" verticalAlignment="Middle">
          <font size="9"/>
        </textElement>
        <textFieldExpression><![CDATA[$F{{{nome_campo}}}]]></textFieldExpression>
      </textField>
"""
        posicao_x += largura
    
    xml += """    </band>
  </detail>
"""
    
    # ===== PAGE FOOTER =====
    xml += f"""
  <!-- ===== PAGE FOOTER ===== -->
  <pageFooter>
    <band height="30" splitType="Stretch">
      <line>
        <reportElement x="0" y="0" width="{largura_coluna}" height="1" uuid="{uuid_gen()}"/>
      </line>
      <staticText>
        <reportElement x="0" y="5" width="300" height="10" uuid="{uuid_gen()}"/>
        <textElement>
          <font size="8"/>
        </textElement>
        <text><![CDATA[Relatório gerado automaticamente pelo SPDealer]]></text>
      </staticText>
      <textField>
        <reportElement x="{largura_coluna - 100}" y="5" width="80" height="10" uuid="{uuid_gen()}"/>
        <textElement textAlignment="Right">
          <font size="8"/>
        </textElement>
        <textFieldExpression><![CDATA["Página " + $V{{PAGE_NUMBER}}]]></textFieldExpression>
      </textField>
      <textField pattern="dd/MM/yyyy HH:mm:ss">
        <reportElement x="0" y="17" width="300" height="10" uuid="{uuid_gen()}"/>
        <textElement>
          <font size="8"/>
        </textElement>
        <textFieldExpression><![CDATA[new java.util.Date()]]></textFieldExpression>
      </textField>
    </band>
  </pageFooter>

  <!-- ===== SUMMARY ===== -->
  <summary>
    <band height="1" splitType="Stretch"/>
  </summary>

</jasperReport>
"""
    
    return xml


def main():
    """Função principal - gera templates padrão"""
    
    print("=" * 80)
    print("GERADOR DE TEMPLATES JASPER COM SUBRELATÓRIO")
    print("=" * 80)
    print()
    
    # ===== TEMPLATE 1: CONTAS A RECEBER =====
    print("[1/3] Gerando ContasReceberReport_Subreport.jrxml...")
    
    campos_receber = [
        ("codigo_rec", "java.lang.Integer", 60),
        ("numdup_rec", "java.lang.String", 80),
        ("nome_cli", "java.lang.String", 200),
        ("dtvenci_rec", "java.sql.Date", 90),
        ("vlrdup_rec", "java.math.BigDecimal", 100),
        ("vlrsal_rec", "java.math.BigDecimal", 105),
    ]
    
    sql_receber = """
        SELECT r.codigo_rec, r.numdup_rec, c.nome_cli, r.dtvenci_rec, 
               r.vlrdup_rec, r.vlrsal_rec
      FROM receber r
      LEFT JOIN clientes c ON c.cliforn_cli = 'C' AND r.codigo_rec = c.codigo_cli
        ORDER BY r.dtvenci_rec
    """
    
    template_receber = gerar_template_jasper(
        nome_arquivo="ContasReceberReport_Subreport",
        titulo_relatorio="Contas a Receber",
        campos_sql=campos_receber,
        sql_query=sql_receber,
        usar_subreport_cabecalho=True,
    )
    
    # Salvar arquivo
    caminho_receber = "src/main/resources/reports/ContasReceberReport_Subreport.jrxml"
    with open(caminho_receber, "w", encoding="utf-8") as f:
        f.write(template_receber)
    print(f"✅ Criado: {caminho_receber}")
    print()
    
    # ===== TEMPLATE 2: CONTAS A PAGAR =====
    print("[2/3] Gerando ContasPagarReport_Subreport.jrxml...")
    
    campos_pagar = [
        ("codigo_pag", "java.lang.Integer", 60),
        ("numdup_pag", "java.lang.String", 80),
        ("nome_forn", "java.lang.String", 200),
        ("dtvenci_pag", "java.sql.Date", 90),
        ("vlrdup_pag", "java.math.BigDecimal", 100),
        ("vlrsal_pag", "java.math.BigDecimal", 105),
    ]
    
    sql_pagar = """
        SELECT p.codigo_pag, p.numdup_pag, f.nome_forn, p.dtvenci_pag, 
               p.vlrdup_pag, p.vlrsal_pag
        FROM pagar p
        LEFT JOIN fornecedores f ON p.codigo_pag = f.codigo_forn
        ORDER BY p.dtvenci_pag
    """
    
    template_pagar = gerar_template_jasper(
        nome_arquivo="ContasPagarReport_Subreport",
        titulo_relatorio="Contas a Pagar",
        campos_sql=campos_pagar,
        sql_query=sql_pagar,
        usar_subreport_cabecalho=True,
    )
    
    caminho_pagar = "src/main/resources/reports/ContasPagarReport_Subreport.jrxml"
    with open(caminho_pagar, "w", encoding="utf-8") as f:
        f.write(template_pagar)
    print(f"✅ Criado: {caminho_pagar}")
    print()
    
    # ===== TEMPLATE 3: FLUXO DE CAIXA =====
    print("[3/3] Gerando FluxoCaixaReport_Subreport.jrxml...")
    
    campos_fluxo = [
        ("dtmovi_cai", "java.sql.Date", 90),
        ("tipo", "java.lang.String", 80),
        ("descricao", "java.lang.String", 250),
        ("valor_cai", "java.math.BigDecimal", 100),
    ]
    
    sql_fluxo = """
        SELECT c.dtmovi_cai, 
               CASE WHEN c.dc_cai = 'C' THEN 'CRÉDITO' ELSE 'DÉBITO' END as tipo,
               c.historico_cai as descricao,
               c.valor_cai
        FROM caixa c
        ORDER BY c.dtmovi_cai DESC
        LIMIT 100
    """
    
    template_fluxo = gerar_template_jasper(
        nome_arquivo="FluxoCaixaReport_Subreport",
        titulo_relatorio="Fluxo de Caixa",
        campos_sql=campos_fluxo,
        sql_query=sql_fluxo,
        usar_subreport_cabecalho=True,
    )
    
    caminho_fluxo = "src/main/resources/reports/FluxoCaixaReport_Subreport.jrxml"
    with open(caminho_fluxo, "w", encoding="utf-8") as f:
        f.write(template_fluxo)
    print(f"✅ Criado: {caminho_fluxo}")
    print()
    
    print("=" * 80)
    print("✅ TODOS OS TEMPLATES CRIADOS COM SUCESSO!")
    print("=" * 80)
    print()
    print("Próximos passos:")
    print("1. Compilar com Maven: mvn clean package -DskipTests")
    print("2. Testar os PDFs com o endpoint /api/relatorios/financeiro/export")
    print("3. Usar 'tipo': 'receber', 'pagar' ou 'fluxo' no payload")
    print()


if __name__ == "__main__":
    main()
