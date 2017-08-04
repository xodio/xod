
function Upload-Dist-To-GCS($tag) {
  $config = New-TemporaryFile
  echo $env:GOOGLE_CLOUD_STORAGE_CONFIG | node -e "console.log(new Buffer ('$env:GOOGLE_CLOUD_STORAGE_CONFIG', 'base64').toString('utf8').trim())" > $config
  (Get-Content -Path $config) | %{ $_.Replace("\xEF\xBB\xBF", "") } | Set-Content -Path $config
  foreach ($file in (Get-ChildItem -Path packages/xod-client-electron/dist -File)) {
    node tools/electron-upload.js --config=$config --file=$($file.FullName) --tag=$tag
  }
}

$tags=(git tag --points-at $env:APPVEYOR_REPO_COMMIT)

if ($tags) {
  yarn run electron-dist
  foreach ($tag in $tags) {
    Upload-Dist-To-GCS $tag
  }
}

if ($env:APPVEYOR_REPO_BRANCH.StartsWith("prerelease")) {
  Write-Host 'Building prerelease distributive...' -ForegroundColor Yellow
  yarn lerna -- publish --skip-git --skip-npm --cd-version=minor --yes
  yarn lerna -- publish --skip-git --skip-npm --canary --yes
  $tag=(node -e "console.log('v' + require('./packages/xod-client-electron/package.json').version)")
  yarn run electron-dist
  Upload-Dist-To-GCS $tag
}
