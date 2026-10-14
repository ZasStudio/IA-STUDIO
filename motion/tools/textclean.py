"""Borrado de subtítulos incrustados en metraje (para reeditar un video con texto quemado).

Dos técnicas:
  1. `text_mask` + `cv2.inpaint`: el texto es claro o muy saturado, de trazo nítido y de alta
     frecuencia (contrasta con su entorno a ~15 px). El fondo desenfocado no cumple eso.
  2. `build_plate` + `replace_with_plate` (cámara fija): mediana temporal de muchos fotogramas
     descartando los píxeles de texto -> "placa limpia" del fondo; luego se sustituye solo
     donde el fotograma difiere de la placa y parece texto.
"""
import cv2
import numpy as np


def _zone(shape, zones):
    h, w = shape[:2]
    z = np.zeros((h, w), np.uint8)
    for (x0, y0, x1, y1) in zones:
        z[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = 1
    return z


def text_mask(frame, zones, v_min=150, s_white=85, s_col=95, v_col=115, hf=22, close=15, grow=9):
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    s, v = hsv[..., 1].astype(np.int16), hsv[..., 2].astype(np.int16)
    g = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    # alta frecuencia: el trazo destaca sobre su entorno inmediato
    bg = cv2.medianBlur(g, 31).astype(np.int16)
    high = (g.astype(np.int16) - bg) > hf
    cand = ((v > v_min) & (s < s_white)) | ((s > s_col) & (v > v_col))
    # saturados (cian/magenta) también valen si destacan en color respecto al entorno
    hsv_bg = cv2.medianBlur(hsv, 31)
    col_jump = np.abs(s - hsv_bg[..., 1].astype(np.int16)) > 70
    m = (cand & (high | (col_jump & (s > s_col)))).astype(np.uint8)
    m &= _zone(frame.shape, zones)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((close, close), np.uint8))
    m = cv2.dilate(m, np.ones((grow, grow), np.uint8))  # sombra/halo del texto
    return m


def inpaint(frame, mask, radius=7):
    return cv2.inpaint(frame, mask * 255, radius, cv2.INPAINT_TELEA)


def build_plate(frames, zones):
    """Mediana temporal ignorando píxeles de texto. Devuelve (placa, válido)."""
    stack = np.stack(frames).astype(np.float32)
    masks = np.stack([text_mask(f, zones) for f in frames]).astype(bool)
    stack[masks] = np.nan
    plate = np.nanmedian(stack, axis=0)
    valid = ~np.isnan(plate).any(axis=2)
    plate = np.nan_to_num(plate).astype(np.uint8)
    if (~valid).any():
        plate = cv2.inpaint(plate, (~valid).astype(np.uint8) * 255, 7, cv2.INPAINT_TELEA)
    return plate, valid


def replace_with_plate(frame, plate, zones, diff_t=28):
    z = _zone(frame.shape, zones).astype(bool)
    d = np.abs(frame.astype(np.int16) - plate.astype(np.int16)).max(axis=2)
    tm = text_mask(frame, zones, grow=5).astype(bool)
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    # texto = difiere de la placa y es claro/saturado (o pegado a texto detectado)
    bright = (hsv[..., 2] > 140) & ((hsv[..., 1] < 90) | (hsv[..., 1] > 110))
    m = ((d > diff_t) & (bright | tm) & z).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    m = cv2.dilate(m, np.ones((9, 9), np.uint8))
    a = cv2.GaussianBlur(m.astype(np.float32), (9, 9), 0)[..., None]
    return (frame * (1 - a) + plate * a).astype(np.uint8), m


class PersonSeg:
    """Segmentación de persona (u2net_human_seg, ONNX) -> alfa 0..1 del tamaño del fotograma."""

    def __init__(self, model_path):
        import onnxruntime as ort
        self.s = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
        self.inp = self.s.get_inputs()[0].name

    def __call__(self, frame):
        h, w = frame.shape[:2]
        x = cv2.resize(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB), (320, 320)).astype(np.float32) / 255
        x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
        y = self.s.run(None, {self.inp: x.transpose(2, 0, 1)[None].astype(np.float32)})[0][0, 0]
        y = (y - y.min()) / (y.max() - y.min() + 1e-6)
        return cv2.resize(y, (w, h))


def person_plate(frames, alphas, zones):
    """Placa del fondo: mediana de píxeles que no son persona ni texto."""
    stack = np.stack(frames).astype(np.float32)
    bad = np.stack([(a > 0.15) | text_mask(f, zones, grow=11).astype(bool) for f, a in zip(frames, alphas)])
    stack[bad] = np.nan
    with np.errstate(all='ignore'):
        plate = np.nanmedian(stack, axis=0)
    valid = ~np.isnan(plate).any(axis=2)
    plate = np.nan_to_num(plate).astype(np.uint8)
    if (~valid).any():
        plate = cv2.inpaint(plate, (~valid).astype(np.uint8) * 255, 9, cv2.INPAINT_TELEA)
    return plate


def clean_presenter(frame, alpha, plate, zone_y, feather=60):
    """Dentro de la franja superior (y < zone_y): fondo = placa limpia, persona = fotograma.
    Después, el texto que quede sobre la persona (pelo) se borra con inpaint."""
    h, w = frame.shape[:2]
    a = cv2.dilate((alpha > 0.35).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(np.float32)
    a = cv2.GaussianBlur(a, (15, 15), 0)
    a = np.maximum(a, alpha)
    zy = np.clip((zone_y * h - np.arange(h)) / feather, 0, 1)[:, None]  # 1 arriba, 0 abajo
    keep = 1 - zy * (1 - a)  # peso del fotograma original
    out = (frame * keep[..., None] + plate * (1 - keep[..., None])).astype(np.uint8)
    over = text_mask(out, [(0, 0, 1, zone_y)], grow=7) & (a > 0.5).astype(np.uint8)
    if over.any():
        out = inpaint(out, over, 5)
    return out


def portrait(frame, alpha, zones, sigma=12, dim=0.9):
    """'Modo retrato': fondo = fotograma sin texto (inpaint aproximado) muy desenfocado y algo
    oscurecido; persona nítida encima. El residuo del texto desaparece en el desenfoque.
    Devuelve (compuesto, alfa_refinada) para poder poner texto detrás de la persona."""
    m = text_mask(frame, zones, grow=13)
    bg = inpaint(frame, m, 9) if m.any() else frame
    bg = cv2.GaussianBlur(bg, (0, 0), sigma)
    bg = (bg.astype(np.float32) * dim).astype(np.uint8)
    a = np.clip((alpha - 0.2) / 0.6, 0, 1)
    a = cv2.GaussianBlur(a, (5, 5), 0)[..., None]
    out = (frame * a + bg * (1 - a)).astype(np.uint8)
    return out, a[..., 0]
