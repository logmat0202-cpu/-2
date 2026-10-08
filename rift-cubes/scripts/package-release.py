#!/usr/bin/env python3
"""Package a clean committed 2.0 tree and its existing production build."""
import argparse
import pathlib
import subprocess
import zipfile

root = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--output', type=pathlib.Path, default=root / '.artifacts' / 'releases')
args = parser.parse_args()
if subprocess.check_output(['git', 'status', '--porcelain'], cwd=root).strip():
    raise SystemExit('Commit the verified source before packaging the release.')
commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode().split('\0')
files = [pathlib.PurePosixPath(p) for p in tracked if p and not p.startswith(('.openai/', '.sites-runtime/', '.env'))]
out = args.output.resolve()
out.mkdir(parents=True, exist_ok=True)
version = f'Кубы разлома · 2.0.0 · 30 островов\nSource commit: {commit}\n'

def archive(path):
    return zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED, compresslevel=9)

with archive(out / 'rift-cubes-30-source.zip') as z:
    for p in files:
        z.write(root / p, 'rift-cubes/' + str(p))
    z.writestr('rift-cubes/SOURCE_VERSION.txt', version)

update_roots = {'src', 'tests', 'docs', 'scripts', '.github'}
update_names = {'index.html', 'package.json', 'package-lock.json', 'vite.config.js', 'README.md', '.gitignore'}
with archive(out / 'rift-cubes-30-update.zip') as z:
    for p in files:
        if p.parts[0] in update_roots or str(p) in update_names:
            z.write(root / p, str(p))
    z.writestr('SOURCE_VERSION.txt', version)
    z.writestr('UPDATE.txt', 'Распакуйте и загрузите содержимое архива в корень существующего репозитория с заменой файлов.\nНе загружайте один ZIP вместо его содержимого.\nИнструкция: docs/UPDATE-30.md\nНужна существующая папка public/fonts; иначе используйте полный архив исходников.\n')

with archive(out / 'rift-cubes-30-public.zip') as z:
    for p in sorted((root / 'dist').rglob('*')):
        if p.is_file() and 'downloads' not in p.relative_to(root / 'dist').parts:
            z.write(p, 'rift-cubes-public/' + str(p.relative_to(root / 'dist')))
    z.writestr('rift-cubes-public/.nojekyll', '')
    z.writestr('rift-cubes-public/SOURCE_VERSION.txt', version)
for p in sorted(out.glob('rift-cubes-30-*.zip')):
    print(f'{p.name}: {p.stat().st_size:,} bytes')
