"""Cut the characters out of a video and write a 'stacked alpha' MP4:
top half = colour, bottom half = alpha mask (white = opaque). Plays everywhere as plain H.264."""
import sys, subprocess, numpy as np
from scipy import ndimage as ndi
sys.path.insert(0, '.')
from cutout_seg import segment

src, dst, W = sys.argv[1], sys.argv[2], int(sys.argv[3])
probe = subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0', src], capture_output=True, text=True).stdout.strip().split(',')
w0, h0 = int(probe[0]), int(probe[1])
H = int(round(h0 * W / w0 / 2) * 2)
dec = subprocess.Popen(['ffmpeg','-v','error','-i',src,'-vf',f'fps=30,scale={W}:{H}','-f','rawvideo','-pix_fmt','rgb24','-'], stdout=subprocess.PIPE)
# soft vignette so anything touching the frame edge fades out instead of being cut flat
yy, xx = np.mgrid[0:H, 0:W]
edge = np.minimum.reduce([xx, W - 1 - xx, yy, H - 1 - yy]).astype(np.float32)
vign = np.clip(edge / (0.08 * min(W, H)), 0, 1) ** 0.8
rng = np.random.default_rng(3)
fibres = ndi.gaussian_filter(rng.standard_normal((H, W)), 1.2)
fibres /= np.abs(fibres).max()
frames, alphas = [], []
while True:
    raw = dec.stdout.read(W * H * 3)
    if len(raw) < W * H * 3: break
    rgb = np.frombuffer(raw, np.uint8).reshape(H, W, 3)
    fg = segment(rgb)
    fg = ndi.binary_erosion(fg, iterations=1)          # drop the background-coloured fringe
    soft = ndi.gaussian_filter(fg.astype(np.float32), 1.6)
    # paper-like edge: a little fibrous noise right at the boundary, then soften
    soft = np.clip(soft + 0.18 * fibres * (soft * (1 - soft) * 4), 0, 1)
    soft = ndi.gaussian_filter(soft, 0.7) * vign
    frames.append(rgb); alphas.append((soft * 255).astype(np.uint8))
dec.wait()
# crop to the area the characters move through (plus a margin), so they sit centred on screen
union = np.max(np.stack(alphas), 0) > 20
ys, xs = np.where(union)
m = 12
x0, x1 = max(0, xs.min() - m), min(W, xs.max() + 1 + m)
y0, y1 = max(0, ys.min() - m), min(H, ys.max() + 1 + m)
x0 -= (x1 - x0) % 2; y0 -= (y1 - y0) % 2
x0, y0 = max(0, x0), max(0, y0)
cw, ch = x1 - x0, y1 - y0
enc = subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{cw}x{ch*2}','-r','30','-i','-',
                        '-c:v','libx264','-preset','slow','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart','-an', dst], stdin=subprocess.PIPE)
for rgb, a in zip(frames, alphas):
    frame = np.concatenate([rgb[y0:y1, x0:x1], np.repeat(a[y0:y1, x0:x1, None], 3, 2)], 0)
    enc.stdin.write(np.ascontiguousarray(frame).tobytes())
enc.stdin.close(); enc.wait()
print(dst, 'crop', (x0, y0, cw, ch), len(frames), 'frames')
