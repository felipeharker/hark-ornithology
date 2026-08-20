# Tools

Standalone utility scripts. Not part of the Next.js build.

## `convert_favicon.py`

Converts an image into a `.ico` favicon (64×64).

```bash
pip install Pillow
python tools/convert_favicon.py <input-image> <output.ico>
```

To update the site's favicon, run this against a source image and copy
the result to `web/src/app/favicon.ico`.
