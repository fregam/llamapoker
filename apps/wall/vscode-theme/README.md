# Wall VFD — the wall's look in VS Code

A colour theme built from the palette in `../src/styles.css`: cyan carries code, amber marks what
waits on you (modified files, search hits, warnings, numbers), red is failure. Change the two together.

Install or update (font: Share Tech Mono, from Google Fonts, installed per user on Windows):

```bash
cd apps/wall/vscode-theme
npx -y @vscode/vsce@3.2.1 package --allow-missing-repository --skip-license -o wall-vfd.vsix
code --install-extension wall-vfd.vsix --force && rm wall-vfd.vsix
```

User settings: `"workbench.colorTheme": "Wall VFD"`, `"editor.fontFamily": "\"Share Tech Mono\", Consolas, monospace"`.
