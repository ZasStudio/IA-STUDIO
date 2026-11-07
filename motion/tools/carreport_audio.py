"""Música y efectos sintetizados (sin derechos de terceros) para el comercial CarReport.
Uso: python3 tools/carreport_audio.py public/carreport"""
import sys, wave
import numpy as np

SR = 48000
out = sys.argv[1]
rng = np.random.default_rng(7)


def save(name, x):
    x = np.clip(x, -1, 1)
    st = np.stack([x, x], 1) if x.ndim == 1 else x
    with wave.open(f"{out}/{name}", "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def kick():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 45 + 120 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.16)


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    x = rng.standard_normal(n)
    x = x - np.convolve(x, np.ones(6) / 6, "same")  # agudos
    return x * env(n, 0.001, 0.06 if open_ else 0.012) * 0.35


def lp(x, k=40):
    return np.convolve(x, np.ones(k) / k, "same")


DUR = 38.0
N = int(DUR * SR)
mix = np.zeros(N)
bpm = 120
beat = 60 / bpm


def add(sig, at, g=1.0):
    i = int(at * SR)
    j = min(N, i + len(sig))
    if i < N:
        mix[i:j] += sig[: j - i] * g


DROP = 3.5
# drone + riser de intro
t = np.arange(int(DROP * SR)) / SR
drone = (np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 82.4 * t)) * np.minimum(1, t / 2) * 0.18
riser = lp(rng.standard_normal(len(t)), 8) * (t / DROP) ** 3 * 0.5
add(drone + riser, 0)
# impacto del drop
n = int(1.6 * SR); tt = np.arange(n) / SR
boom = (np.sin(2 * np.pi * (38 + 60 * np.exp(-tt * 6)) * tt) * env(n, 0.002, 0.5) + lp(rng.standard_normal(n), 3) * env(n, 0.001, 0.25) * 0.4)
add(boom, DROP, 0.9)
# ritmo
END_BEAT = 36.2
b = DROP
k = 0
while b < END_BEAT:
    bar = int((b - DROP) / (beat * 4))
    quiet = 10.9 < b < 11.5  # pausa antes del reporte
    if not quiet:
        add(kick(), b, 0.85)
        if b > 7.5:
            add(hat(), b + beat / 2, 0.8)
        if k % 4 == 3 and b > 7.5:
            add(hat(True), b + beat / 2, 0.5)
    b += beat
    k += 1
# bajo: La menor – Fa – Do – Sol (un acorde por compás de 2 s)
roots = [55.0, 43.65, 65.41, 49.0]
b = DROP
while b < END_BEAT:
    i = int((b - DROP) / 2) % 4
    for s in range(4):
        st = b + s * beat
        n = int(beat * 0.9 * SR); tt = np.arange(n) / SR
        f0 = roots[i]
        tone = np.sign(np.sin(2 * np.pi * f0 * tt)) * 0.5 + np.sin(2 * np.pi * f0 * tt)
        add(lp(tone, 60) * env(n, 0.01, 0.25) * 0.3, st)
    # pad suave
    n = int(2 * SR); tt = np.arange(n) / SR
    chord = sum(np.sin(2 * np.pi * roots[i] * m * tt) for m in (4, 5, 6)) / 3
    add(chord * np.sin(np.pi * tt / 2) * 0.05, b)
    b += 2
# riser antes del reporte y del CTA
for at, length in ((9.5, 1.9), (28.5, 1.5)):
    n = int(length * SR); tt = np.arange(n) / SR
    add(lp(rng.standard_normal(n), 6) * (tt / length) ** 2.5 * 0.35, at)
# final: golpe + cola
n = int(2.5 * SR); tt = np.arange(n) / SR
add(np.sin(2 * np.pi * (40 + 50 * np.exp(-tt * 5)) * tt) * env(n, 0.002, 0.8) * 0.8, END_BEAT)
# fade final
fade = int(1.2 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)
mix /= np.max(np.abs(mix)) + 1e-9
save("music.wav", mix * 0.8)

# ----- efectos -----
n = int(0.5 * SR); tt = np.arange(n) / SR
save("whoosh.wav", lp(rng.standard_normal(n), 4) * np.sin(np.pi * tt / 0.5) ** 2 * 0.7)
n = int(0.22 * SR); x = rng.standard_normal(n)
x = np.round(x * 4) / 4  # bitcrush
x *= (np.sin(2 * np.pi * 37 * np.arange(n) / SR) > 0)  # chopeado
save("glitch.wav", x * env(n, 0.001, 0.08) * 0.6)
n = int(0.03 * SR)
save("tick.wav", np.sin(2 * np.pi * 3200 * np.arange(n) / SR) * env(n, 0.001, 0.008) * 0.6)
n = int(0.6 * SR); tt = np.arange(n) / SR
save("scan.wav", np.sin(2 * np.pi * (600 + 1400 * tt / 0.6) * tt) * np.sin(np.pi * tt / 0.6) * 0.25)
n = int(0.12 * SR)
save("check.wav", (np.sin(2 * np.pi * 1760 * np.arange(n) / SR) + 0.5 * np.sin(2 * np.pi * 2640 * np.arange(n) / SR)) * env(n, 0.002, 0.05) * 0.35)
n = int(0.5 * SR); tt = np.arange(n) / SR
save("alarm.wav", np.sign(np.sin(2 * np.pi * 220 * tt)) * (np.sin(2 * np.pi * 8 * tt) > 0) * env(n, 0.01, 0.3) * 0.18)
n = int(0.35 * SR); tt = np.arange(n) / SR
save("pop.wav", np.sin(2 * np.pi * (500 + 900 * tt) * tt) * env(n, 0.002, 0.07) * 0.5)
print("ok")
