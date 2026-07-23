#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate valid Jasper templates with proper UUID attributes"""

import uuid as uuid_lib

def generate_template(name, query, fields, supplier_field):
    """Generate a minimal but valid Jasper template"""
    
    # Generate unique UUIDs for each element
    title_uuid = str(uuid_lib.uuid4())
    line_uuid = str(uuid_lib.uuid4())
    textfield_uuid = str(uuid_lib.uuid4())
    
    # Build field definitions
    field_defs = ""
    for field_name, field_class in fields:
        field_defs += f'  <field name="{field_name}" class="{field_class}"/>\n'
    
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="{name}" pageWidth="595" pageHeight="842" columnWidth="555" leftMargin="20" rightMargin="20" topMargin="20" bottomMargin="20">
  <property name="com.jaspersoft.studio.data.defaultdataadapter" value="New Data Adapter"/>
  <queryString language="SQL"><![CDATA[{query}]]></queryString>
{field_defs}  <background><band splitType="Stretch"/></background>
  <title><band height="30"><staticText><reportElement x="0" y="0" width="555" height="30" uuid="{title_uuid}"/><textElement textAlignment="Center"><font size="14" isBold="true"/></textElement><text><![CDATA[{name}]]></text></staticText></band></title>
  <pageHeader><band height="10"><line><reportElement x="0" y="9" width="555" height="1" uuid="{line_uuid}"/></line></band></pageHeader>
  <detail><band height="12"><textField><reportElement x="0" y="0" width="555" height="12" uuid="{textfield_uuid}"/><textElement><font size="8"/></textElement><textFieldExpression><![CDATA[$F{{{supplier_field}}}]]></textFieldExpression></textField></band></detail>
  <pageFooter><band height="10"/>
  </pageFooter>
  <summary><band height="1"/>
  </summary>
</jasperReport>"""
    return xml

# Template for Receber
receber_template = generate_template(
    "ContasReceberReport",
    "SELECT codigo_rec, numdup_rec, parcela_rec, nome_cli, dtvenci_rec, vlrdup_rec, vlrsal_rec FROM receber LIMIT 100",
    [
        ("codigo_rec", "java.lang.Integer"),
        ("numdup_rec", "java.lang.String"),
        ("parcela_rec", "java.lang.String"),
        ("nome_cli", "java.lang.String"),
        ("dtvenci_rec", "java.sql.Date"),
        ("vlrdup_rec", "java.math.BigDecimal"),
        ("vlrsal_rec", "java.math.BigDecimal"),
    ],
    "nome_cli"
)

# Template for Pagar
pagar_template = generate_template(
    "ContasPagarReport",
    "SELECT codigo_pag, numpag_pag, parcela_pag, nome_forn, dtvenc_pag, vlrpag_pag, vlrsal_pag FROM pagar LIMIT 100",
    [
        ("codigo_pag", "java.lang.Integer"),
        ("numpag_pag", "java.lang.String"),
        ("parcela_pag", "java.lang.String"),
        ("nome_forn", "java.lang.String"),
        ("dtvenc_pag", "java.sql.Date"),
        ("vlrpag_pag", "java.math.BigDecimal"),
        ("vlrsal_pag", "java.math.BigDecimal"),
    ],
    "nome_forn"
)

# Template for Fluxo
fluxo_template = generate_template(
    "FluxoCaixaReport",
    "SELECT 'RECEBER' as tipo, codigo_rec as codigo, numdup_rec as documento, nome_cli as pessoa FROM receber UNION ALL SELECT 'PAGAR' as tipo, codigo_pag as codigo, numdup_pag as documento, nome_forn as pessoa FROM pagar LIMIT 100",
    [
        ("tipo", "java.lang.String"),
        ("codigo", "java.lang.Integer"),
        ("documento", "java.lang.String"),
        ("pessoa", "java.lang.String"),
    ],
    "tipo"
)

# Write files with proper UTF-8 encoding (NO BOM)
base_path = "h:\\DISCO_D\\Desenvolvimento\\Seprocom\\spdealer\\src\\main\\resources\\reports\\"

with open(base_path + "ContasReceberReport.jrxml", 'w', encoding='utf-8') as f:
    f.write(receber_template)
print("✅ ContasReceberReport.jrxml criado")

with open(base_path + "ContasPagarReport.jrxml", 'w', encoding='utf-8') as f:
    f.write(pagar_template)
print("✅ ContasPagarReport.jrxml criado")

with open(base_path + "FluxoCaixaReport.jrxml", 'w', encoding='utf-8') as f:
    f.write(fluxo_template)
print("✅ FluxoCaixaReport.jrxml criado")

print("\n✅ Todos os templates foram gerados com UUIDs válidos!")
