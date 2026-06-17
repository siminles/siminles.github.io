#!/usr/bin/env python3
"""图片批量压缩 — 目标 <500KB，用法: python3 _scripts/compress_images.py"""

import os, sys
from PIL import Image

TARGET_KB = 500
MIN_QUALITY = 40
MAX_SIZE = 3000

def compress_image(filepath):
    orig = os.path.getsize(filepath)
    if orig < TARGET_KB * 1024:
        return False, orig, orig

    img = Image.open(filepath)
    w, h = img.size
    if max(w, h) > MAX_SIZE:
        scale = MAX_SIZE / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    if img.mode in ('RGBA', 'LA', 'P'):
        bg = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        bg.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = bg

    lo, hi = MIN_QUALITY, 95
    best = None
    for _ in range(8):
        mid = (lo + hi) // 2
        tmp = '/tmp/_img_compress_tmp.jpg'
        img.save(tmp, 'JPEG', quality=mid, optimize=True)
        sz = os.path.getsize(tmp)
        if sz < TARGET_KB * 1024:
            best = (tmp, sz)
            lo = mid + 1
        else:
            hi = mid - 1

    if best:
        os.replace(best[0], filepath)
        return True, orig, best[1]
    return False, orig, orig

def main():
    target = sys.argv[1] if len(sys.argv) > 1 else 'assets'
    if not os.path.isdir(target):
        target = os.path.join('..', target)

    count, before, after = 0, 0, 0
    for root, dirs, files in os.walk(target):
        for f in files:
            ext = f.split('.')[-1].lower() if '.' in f else ''
            if ext not in ('jpg', 'jpeg', 'png', 'webp'):
                continue
            fpath = os.path.join(root, f)
            ok, b, a = compress_image(fpath)
            before += b; after += a
            if ok:
                count += 1
                print(f'  {f}: {b//1024}KB → {a//1024}KB')

    print(f'\n压缩 {count} 张, {before//1024}KB → {after//1024}KB (省 {(before-after)//1024}KB)')

if __name__ == '__main__':
    main()
