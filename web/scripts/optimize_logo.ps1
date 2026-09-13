Add-Type -AssemblyName System.Drawing

function Resize-Png($srcPath, $destPath, $size) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $dest = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($src, 0, 0, $size, $size)
    $dest.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $dest.Dispose()
    $src.Dispose()
}

$root = (Get-Location).Path
$srcPath = Join-Path $root "web/images/isu_logo.png"
Resize-Png $srcPath (Join-Path $root "web/images/isu_logo_256.png") 256
Resize-Png $srcPath (Join-Path $root "web/images/isu_logo_512.png") 512

Write-Output "Original: $((Get-Item $srcPath).Length / 1024) KB"
Write-Output "256px:    $((Get-Item (Join-Path $root 'web/images/isu_logo_256.png')).Length / 1024) KB"
Write-Output "512px:    $((Get-Item (Join-Path $root 'web/images/isu_logo_512.png')).Length / 1024) KB"
