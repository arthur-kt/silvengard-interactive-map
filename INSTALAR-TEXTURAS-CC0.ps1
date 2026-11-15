# Silvengard Atlas v10 - Baixa materiais CC0 oficiais (ambientCG) e instala localmente.
# Executar com PowerShell 5.1+ no Windows, conectado a internet.
# Os arquivos originais ambientCG sao CC0 1.0: https://docs.ambientcg.com/license/
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = Join-Path $root 'app\dist\textures\cc0'
New-Item -ItemType Directory -Force -Path $target | Out-Null
$assets = [ordered]@{
 'paving' = 'PavingStones036'  # paralelepipedos e pisos
 'stone' = 'Bricks001'         # alvenaria
 'rock' = 'Rocks001'           # rochas
 'wood' = 'Planks001'          # madeira
 'roofing' = 'RoofingTiles001' # telhas
 'ground' = 'Ground103'       # terra
 'mud' = 'Ground051'          # lama
}
$work = Join-Path $env:TEMP ('silvengard-cc0-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $work | Out-Null
try {
  $success = 0
  foreach ($name in $assets.Keys) {
    $id = $assets[$name]
    $dest = Join-Path $target "$name.jpg"
    if (Test-Path $dest) {
      Write-Host "[OK] $name ja instalado ($id)" -ForegroundColor Green
      $success++
      continue
    }
    $zip = Join-Path $work "$id.zip"
    $expanded = Join-Path $work $id
    New-Item -ItemType Directory -Force -Path $expanded | Out-Null
    $url = "https://ambientcg.com/get?file=${id}_1K-JPG.zip"
    Write-Host "[DOWNLOAD] $id (1K-JPG)"
    try {
      Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing -MaximumRedirection 8 -TimeoutSec 100
      if ((Get-Item $zip).Length -lt 30000) { throw 'Arquivo incompleto' }
      Expand-Archive -Path $zip -DestinationPath $expanded -Force
      # Nomes ambientCG: XXX_1K-JPG_Color.jpg
      $color = Get-ChildItem -Path $expanded -Recurse -File | Where-Object {
        $_.Extension -match '^\.(jpg|jpeg|png)$' -and $_.BaseName -match '(^|_)Color($|_)|(^|_)Diffuse($|_)|(^|_)Albedo($|_)|(^|_)BaseColor($|_)'
      } | Select-Object -First 1
      if ($null -eq $color) { throw 'Mapa Color/BaseColor nao encontrado no arquivo oficial' }
      if ($color.Extension -match '^\.(jpg|jpeg)$') {
        Copy-Item -LiteralPath $color.FullName -Destination $dest -Force
      } else {
        # Os packs JPG oficiais devem ter mapas Color JPG. Nunca renomear PNG como JPG.
        throw 'O mapa de cor encontrado nao e JPEG; verifique a versao do pacote'
      }
      Write-Host "[OK] $id -> app/dist/textures/cc0/$name.jpg" -ForegroundColor Green
      $success++
    } catch {
      Write-Warning "Nao foi possivel instalar ${id}: $($_.Exception.Message)"
    }
  }
  Write-Host ''
  Write-Host "Instalados: $success / $($assets.Count) materiais. A ausencia de alguma textura usa o material antigo automaticamente."
  Write-Host 'Abra o Atlas depois de instalar as texturas.'
} finally {
  if (Test-Path $work) { Remove-Item -Path $work -Recurse -Force -ErrorAction SilentlyContinue }
}
