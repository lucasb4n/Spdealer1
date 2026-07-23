# Reproduz export de relatórios e salva respostas em test-results (compatível PS 5.1)
$resultsDir = Join-Path $PSScriptRoot '..\test-results'
New-Item -ItemType Directory -Force -Path $resultsDir | Out-Null

function PostAndCapture([string]$url, [string]$json, [System.Net.CookieContainer]$cookies) {
    $req = [System.Net.WebRequest]::Create($url)
    $req.Method = 'POST'
    $req.ContentType = 'application/json'
    if ($cookies -ne $null) { $req.CookieContainer = $cookies }

    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $req.ContentLength = $bytes.Length
    $reqStream = $req.GetRequestStream()
    $reqStream.Write($bytes, 0, $bytes.Length)
    $reqStream.Close()

    try {
        $resp = $req.GetResponse()
        $http = [System.Net.HttpWebResponse]$resp
        $status = [int]$http.StatusCode
        $ctype = $http.ContentType
        $respStream = $http.GetResponseStream()

        if ($ctype -and $ctype.ToLower().Contains('application/pdf')) {
            $ms = New-Object System.IO.MemoryStream
            $buffer = New-Object byte[](8192)
            while (($read = $respStream.Read($buffer, 0, $buffer.Length)) -gt 0) { $ms.Write($buffer, 0, $read) }
            $data = $ms.ToArray()
            $respStream.Close()
            $http.Close()
            return @{ Status = $status; Headers = $http.Headers; Bytes = $data; ContentType = $ctype }
        } else {
            $reader = New-Object System.IO.StreamReader($respStream)
            $text = $reader.ReadToEnd()
            $reader.Close()
            $http.Close()
            return @{ Status = $status; Headers = $http.Headers; Body = $text; ContentType = $ctype }
        }

    } catch [System.Net.WebException] {
        $we = $_.Exception
        $resp = $we.Response
        if ($resp -ne $null) {
            $http = [System.Net.HttpWebResponse]$resp
            $status = [int]$http.StatusCode
            $ctype = $http.ContentType
            $respStream = $http.GetResponseStream()

            if ($ctype -and $ctype.ToLower().Contains('application/pdf')) {
                $ms = New-Object System.IO.MemoryStream
                $buffer = New-Object byte[](8192)
                while (($read = $respStream.Read($buffer, 0, $buffer.Length)) -gt 0) { $ms.Write($buffer, 0, $read) }
                $data = $ms.ToArray()
                $respStream.Close()
                $http.Close()
                return @{ Status = $status; Headers = $http.Headers; Bytes = $data; ContentType = $ctype }
            } else {
                $reader = New-Object System.IO.StreamReader($respStream)
                $text = $reader.ReadToEnd()
                $reader.Close()
                $http.Close()
                return @{ Status = $status; Headers = $http.Headers; Body = $text; ContentType = $ctype }
            }
        } else {
            return @{ Status = 0; Headers = $null; Body = '' }
        }
    }
}

# Realiza login e preserva cookies
$cookieJar = New-Object System.Net.CookieContainer
$loginUrl = 'http://localhost:8080/api/auth/login'
$loginJson = @{ login = 'admin'; senha = 'admin' } | ConvertTo-Json
$loginRespObj = PostAndCapture $loginUrl $loginJson $cookieJar
$loginRespObj.Status | Out-File (Join-Path $resultsDir 'login-status.txt') -Encoding utf8
if ($loginRespObj.ContainsKey('Body')) { $loginRespObj.Body | Out-File (Join-Path $resultsDir 'login-response.txt') -Encoding utf8 }

function Invoke-Export([string]$tipo, [string]$outPrefix) {
    $payload = @{
        tipo = $tipo
        tipoDataFiltro = 'dtvenci_rec'
        dataFiltroInicial = '2025-12-17'
        dataFiltroFinal = '2025-12-17'
        pessoaTipo = $null
        tipoCobranca = $null
        tipoDocumento = $null
        departamento = $null
        centroCusto = $null
        faixaAtraso = $null
        soEmAberto = $false
        soPagos = $false
    } | ConvertTo-Json -Depth 10

    $uri = 'http://localhost:8080/api/relatorios/financeiro/export'
    $res = PostAndCapture $uri $payload $cookieJar

    if ($res.Status -eq 200 -and $res.ContainsKey('Bytes')) {
        [System.IO.File]::WriteAllBytes((Join-Path $resultsDir "$outPrefix.pdf"), $res.Bytes)
        $res.Status | Out-File (Join-Path $resultsDir "$outPrefix-status.txt") -Encoding utf8
        ($res.Headers.ToString()) | Out-File (Join-Path $resultsDir "$outPrefix-headers.txt") -Encoding utf8
        ("OK PDF saved: " + (Join-Path $resultsDir "$outPrefix.pdf") + " (" + $res.Bytes.Length + " bytes)") | Out-File (Join-Path $resultsDir "$outPrefix-result.txt") -Encoding utf8
    } else {
        $res.Status | Out-File (Join-Path $resultsDir "$outPrefix-status.txt") -Encoding utf8
        if ($res.ContainsKey('Headers')) { ($res.Headers.ToString()) | Out-File (Join-Path $resultsDir "$outPrefix-headers.txt") -Encoding utf8 }
        if ($res.ContainsKey('Body')) { $res.Body | Out-File (Join-Path $resultsDir "$outPrefix-content.txt") -Encoding utf8 }
    }
}

Invoke-Export 'receber' 'export-receber'
Invoke-Export 'pagar' 'export-pagar'
Invoke-Export 'fluxo' 'export-fluxo'

Write-Output 'Script finished.'
