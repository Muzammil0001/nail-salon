
$zipName = "deployment.zip"
$destinationUser = "root"
$destinationIP = "165.232.138.13"
$destinationPath = "./jt-nails"
$pscpPath = "pscp"
$password = "JulietNails2025a"

if (Test-Path $zipName) {
    Remove-Item $zipName
}

$excludeDirs = @(".git", ".next", "node_modules")
$filesToZip = Get-ChildItem -Recurse -File | Where-Object {
    foreach ($exDir in $excludeDirs) {
        if ($_.FullName -like "*\$exDir\*") { return $false }
    }
    return $true
}

$tempDir = New-Item -ItemType Directory -Path "./__deploy_tmp__" -Force

foreach ($file in $filesToZip) {
    $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
    $targetPath = Join-Path $tempDir.FullName $relativePath

    $null = New-Item -ItemType Directory -Path (Split-Path $targetPath) -Force
    Copy-Item $file.FullName -Destination $targetPath
}

Compress-Archive -Path "$tempDir\*" -DestinationPath $zipName -Force

Remove-Item $tempDir -Recurse -Force

$scpDestination = $destinationUser + "@" + $destinationIP + ":" + $destinationPath + "/" + $zipName
& $pscpPath -pw $password -scp -v $zipName $scpDestination


$plinkPath = "plink"
$sshDestination = $destinationUser + "@" + $destinationIP
$commands = @(
    "cd $destinationPath",
    "unzip -o $zipName",
    "rm $zipName",
    "chmod +x build.sh",
    "./build.sh",
    "echo 'Deployment completed successfully!'"
)

$commandString = $commands -join "; "
& $plinkPath -pw $password $sshDestination $commandString

Remove-Item $zipName
