"""Prepara el metraje del reel de referencia para reeditarlo en Remotion (BarberReel).

Uso:
  python3 -P tools/clean_footage.py <video_referencia.mp4> <modelo u2net_human_seg.onnx> [public/barber]

Por cada plano de SHOTS genera, ya escalado a 1080x1920 (Lanczos + nitidez suave):
  presenter -> <id>.mp4 (fondo desenfocado sin subtítulos, "modo retrato")
               <id>_alpha.webm (solo la persona, con canal alfa, para poner texto DETRÁS)
  clip      -> <id>.mp4 (subtítulos borrados por inpainting dentro de sus zonas)
  still     -> <id>.png (el fotograma con menos texto del tramo, limpio)
y voice.wav con la narración original.
"""
import os
import subprocess
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from textclean import PersonSeg, inpaint, portrait, text_mask  # noqa: E402

W, H = 1080, 1920

# zonas donde, tras borrar, se desenfoca (fondos ya desenfocados: el resto de texto desaparece)
BLUR_ZONES = {
    'c_phone1': [(0, 0.0, 1, 0.3)],
    'c_phone2': [(0, 0.0, 1, 0.24)],
    'c_tv': [(0, 0.08, 1, 0.38), (0, 0.8, 1, 1.0)],
}

# cajas donde se borra cualquier píxel más claro que `v` (restos de texto sobre fondos oscuros)
BRIGHT_FIX = {'b_cape': [(0.3, 0.40, 0.72, 0.58, 55)]}
FPS = '24000/1001'

# id, tipo, inicio, fin (segundos del video original), zonas de subtítulos (x0,y0,x1,y1 normalizadas)
SHOTS = [
    ('p_hook', 'presenter', 0.00, 3.59, 0.36),
    ('p_retro', 'presenter', 3.62, 4.59, 0.36),
    ('b_barber', 'still', 6.45, 8.15, [(0, 0.38, 1, 0.62)]),
    ('b_sepia', 'still', 8.45, 10.2, [(0, 0.38, 1, 0.62)]),
    ('b_walk', 'still', 10.42, 10.56, [(0, 0.38, 1, 0.62)]),
    ('b_classes', 'still', 11.3, 11.75, [(0, 0.42, 1, 0.62)]),
    ('b_face', 'still', 12.0, 12.3, [(0, 0.55, 1, 0.75)]),
    ('b_chair', 'still', 12.6, 14.1, [(0, 0.4, 1, 0.62)]),
    ('b_cape', 'still', 14.5, 16.3, [(0, 0.4, 1, 0.62)]),
    ('p_science', 'presenter', 18.95, 20.69, 0.36),
    ('c_phone1', 'clip', 20.69, 22.65, [(0, 0.0, 1, 0.3)]),
    ('c_phone2', 'clip', 22.65, 36.66, [(0, 0.0, 1, 0.27)]),
    ('p_interest', 'presenter', 36.66, 37.83, 0.36),
    ('b_hospital', 'still', 39.96, 41.2, [(0, 0.5, 1, 0.78)]),
    ('b_bwbarbers', 'still', 41.21, 42.85, [(0, 0.5, 1, 0.78)]),
    ('p_gloves', 'presenter', 49.47, 54.80, 0.36),
    ('c_product', 'clip', 54.80, 58.85, [(0, 0.5, 1, 0.8)]),
    ('c_earth', 'clip', 59.3, 62.23, []),
    ('c_inspector', 'clip', 62.23, 65.94, [(0, 0.3, 1, 0.75)]),
    ('b_roosevelt', 'still', 70.0, 70.25, [(0.2, 0.36, 0.85, 0.47)]),
    ('c_neck', 'clip', 75.41, 80.96, [(0, 0.45, 1, 0.78)]),
    ('c_head', 'clip', 80.96, 84.38, [(0, 0.05, 1, 0.38)]),
    ('b_torn', 'still', 85.0, 88.5, [(0, 0.1, 1, 0.66)]),
    ('c_tv', 'clip', 92.93, 97.58, [(0, 0.1, 1, 0.36), (0, 0.8, 1, 0.95)]),
    ('c_dance', 'clip', 97.9, 98.77, [(0, 0.6, 1, 0.82)]),
    ('c_sinatra', 'clip', 98.77, 100.35, [(0, 0.55, 1, 0.85)]),
    ('c_twomen', 'clip', 100.35, 103.14, [(0, 0.55, 1, 0.85)]),
    ('p_today', 'presenter', 103.14, 108.78, 0.36),
    ('p_end', 'presenter', 109.94, 118.45, 0.36),
]


def upscale(img):
    up = cv2.resize(img, (W, H), interpolation=cv2.INTER_LANCZOS4)
    blur = cv2.GaussianBlur(up, (0, 0), 1.2)
    return cv2.addWeighted(up, 1.35, blur, -0.35, 0)  # unsharp mask suave


def writer(path, alpha=False):
    if alpha:
        args = ['-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', f'{W}x{H}', '-r', FPS, '-i', '-',
                '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '3M', '-auto-alt-ref', '0', '-deadline', 'good', '-cpu-used', '4']
    else:
        args = ['-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', FPS, '-i', '-',
                '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
    return subprocess.Popen(['ffmpeg', '-v', 'error', '-y', *args, path], stdin=subprocess.PIPE)


def frames(cap, fps, t0, t1):
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(round(t0 * fps)))
    for _ in range(int(round((t1 - t0) * fps))):
        ok, f = cap.read()
        if not ok:
            return
        yield f


def main():
    src, model = sys.argv[1], sys.argv[2]
    out = sys.argv[3] if len(sys.argv) > 3 else 'public/barber'
    os.makedirs(out, exist_ok=True)
    only = set(os.environ.get('ONLY', '').split(',')) - {''}
    cap = cv2.VideoCapture(src)
    fps = cap.get(cv2.CAP_PROP_FPS)
    seg = PersonSeg(model)
    for sid, kind, t0, t1, z in SHOTS:
        if only and sid not in only:
            continue
        print(f'{sid:12s} {kind:9s} {t0:6.2f}-{t1:6.2f}', flush=True)
        if kind == 'presenter':
            zy = z
            v, va = writer(f'{out}/{sid}.mp4'), writer(f'{out}/{sid}_alpha.webm', alpha=True)
            for f in frames(cap, fps, t0, t1):
                alpha = seg(f)
                comp, a = portrait(f, alpha, [(0, 0, 1, zy + 0.04)])
                # el desenfoque solo en la franja de subtítulos; abajo, el plano original (productos intactos)
                ramp = np.clip((zy * f.shape[0] + 60 - np.arange(f.shape[0])) / 120, 0, 1)[:, None, None]
                comp = (comp * ramp + f * (1 - ramp)).astype(np.uint8)
                big = upscale(comp)
                v.stdin.write(big.tobytes())
                ab = cv2.resize(a, (W, H), interpolation=cv2.INTER_LINEAR)
                rgba = np.dstack([upscale(f), (ab * 255).astype(np.uint8)])
                va.stdin.write(rgba.tobytes())
            v.stdin.close(); va.stdin.close(); v.wait(); va.wait()
        elif kind == 'clip':
            v = writer(f'{out}/{sid}.mp4')
            bz = BLUR_ZONES.get(sid, [])
            for f in frames(cap, fps, t0, t1):
                for grow in ((9, 13) if z else ()):
                    m = text_mask(f, z, grow=grow)
                    if m.any():
                        f = inpaint(f, m, 7)
                for (x0, y0, x1, y1) in bz:
                    hh, ww = f.shape[:2]
                    a = np.zeros((hh, ww), np.float32)
                    a[int(y0 * hh):int(y1 * hh), int(x0 * ww):int(x1 * ww)] = 1
                    a = cv2.GaussianBlur(a, (0, 0), 25)[..., None]
                    f = (f * (1 - a) + cv2.GaussianBlur(f, (0, 0), 14) * a).astype(np.uint8)
                v.stdin.write(upscale(f).tobytes())
            v.stdin.close(); v.wait()
        else:  # still: el fotograma con menos texto
            best, best_n = None, None
            for f in frames(cap, fps, t0, t1):
                m = text_mask(f, z)
                n = int(m.sum())
                if best_n is None or n < best_n:
                    best, best_n = (f, m), n
            f, m = best
            # dos pasadas: la segunda recoge restos finos (serif itálica) que quedan tras la primera
            for grow in (11, 15):
                m = text_mask(f, z, grow=grow)
                if m.any():
                    f = inpaint(f, m, 9)
            for (x0, y0, x1, y1, vmin) in BRIGHT_FIX.get(sid, []):
                hh, ww = f.shape[:2]
                box = np.zeros((hh, ww), np.uint8)
                box[int(y0 * hh):int(y1 * hh), int(x0 * ww):int(x1 * ww)] = 1
                bm = ((cv2.cvtColor(f, cv2.COLOR_BGR2HSV)[..., 2] > vmin) & (box > 0)).astype(np.uint8)
                bm = cv2.dilate(bm, np.ones((7, 7), np.uint8))
                f = inpaint(f, bm, 11)
            cv2.imwrite(f'{out}/{sid}.png', upscale(f))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-ac', '2', '-ar', '48000', f'{out}/voice.wav'], check=True)
    print('listo')


if __name__ == '__main__':
    main()
