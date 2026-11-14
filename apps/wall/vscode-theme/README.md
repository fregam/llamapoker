# Wall VFD — the wall's look in VS Code

A colour theme built from the palette in `../src/styles.css`, on true black: cyan carries code,
orange accents the chrome (active tab, activity bar, section titles) and marks what waits on you
(modified files, search hits, warnings, numbers), red is failure. Change the two together, and
bump `version` in `package.json` so VS Code picks the change up.

Only tints of those three colours are used, never a fourth hue: lighter cyans for strings,
properties and parameters, `#ffb070` (light orange) for regex, escapes and the bright
yellow/magenta terminal slots, `#ff7a7a` (light red) for bright red. Terminal magenta maps to
the orange, since a terminal needs eight distinct slots.

Install or update (font: Share Tech Mono, from Google Fonts, installed per user on Windows):

```bash
cd apps/wall/vscode-theme
npx -y @vscode/vsce@3.2.1 package --allow-missing-repository --skip-license -o wall-vfd.vsix
code --install-extension wall-vfd.vsix --force && rm wall-vfd.vsix
```

User settings: `"workbench.colorTheme": "Wall VFD"`, `"editor.fontFamily": "\"Share Tech Mono\", Consolas, monospace"`.
