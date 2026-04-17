param(
  [string]$Input = "docs/images/betcopilot-architecture.mmd",
  [string]$SvgOutput = "docs/images/betcopilot-architecture-export.svg",
  [string]$PngOutput = "docs/images/betcopilot-architecture.png"
)

Write-Host "Exporting Mermaid diagram from $Input"
npx @mermaid-js/mermaid-cli -i $Input -o $SvgOutput
npx @mermaid-js/mermaid-cli -i $Input -o $PngOutput
Write-Host "Done."
