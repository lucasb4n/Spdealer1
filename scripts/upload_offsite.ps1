Param(
    [Parameter(Mandatory=$true)] [string]$LocalFile,
    [Parameter(Mandatory=$true)] [string]$RemoteDir,
    [Parameter(Mandatory=$true)] [string]$Server,
    [Parameter(Mandatory=$true)] [string]$Username,
    [Parameter(Mandatory=$true)] [string]$Password
)

function Ensure-FtpDirectory {
    param(
        [string]$Server,
        [string]$RemotePath,
        [string]$User,
        [string]$Pass
    )

    # Remove starting slash
    $trimmed = $RemotePath.Trim('/').Trim('\')
    if ([string]::IsNullOrEmpty($trimmed)) { return }

    $parts = $trimmed -split '/'
    $acc = ''
    foreach ($p in $parts) {
        $acc = if ($acc -eq '') { $p } else { "$acc/$p" }
        try {
            $uri = [Uri]("ftp://$Server/$acc")
            $req = [System.Net.FtpWebRequest]::Create($uri)
            $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
            $req.Credentials = New-Object System.Net.NetworkCredential($User,$Pass)
            $req.UsePassive = $true
            $req.UseBinary = $true
            $req.KeepAlive = $false
            $resp = $req.GetResponse()
            $resp.Close()
            Write-Host "Criada: /$acc"
        } catch {
            # Se a pasta já existir o servidor pode retornar erro; ignoramos erros 550 (exists)
            if ($_.Exception.Response -and ($_.Exception.Response.StatusCode -eq 550)) {
                Write-Host "Ja existe: /$acc" -ForegroundColor Yellow
            } else {
                Write-Host ("Aviso ao criar /{0}: {1}" -f $acc, $_.Exception.Message) -ForegroundColor Yellow
            }
        }
    }
}

Write-Host "Enviando $LocalFile para ftp://$Server$RemoteDir"

if (-not (Test-Path $LocalFile)) {
    Write-Host "Arquivo local nao encontrado: $LocalFile" -ForegroundColor Red
    exit 1
}

Ensure-FtpDirectory -Server $Server -RemotePath $RemoteDir -User $Username -Pass $Password

# Upload file
$remoteFileName = [System.IO.Path]::GetFileName($LocalFile)
$uploadUri = "ftp://$Server/$($RemoteDir.Trim('/'))/$remoteFileName"

try {
    $wc = New-Object System.Net.WebClient
    $wc.Credentials = New-Object System.Net.NetworkCredential($Username,$Password)
    $wc.UploadFile($uploadUri, 'STOR', $LocalFile)
    Write-Host "Upload concluido: $uploadUri" -ForegroundColor Green
} catch {
    Write-Host "Falha no upload: $($_.Exception.Message)" -ForegroundColor Red
    exit 2
}
