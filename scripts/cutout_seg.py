import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi

def segment(rgb):
    a = rgb.astype(np.int16)
    mx = a.max(2); mn = a.min(2)
    lum = (a[...,0]*0.3 + a[...,1]*0.59 + a[...,2]*0.11)
    dark = lum < 95                       # ink outline
    white = (mn > 222) & (mx - mn < 22)   # character fill (white)
    passable = ~dark & ~white
    h, w = dark.shape
    lab, n = ndi.label(passable)
    border = np.zeros_like(passable); border[0,:]=border[-1,:]=border[:,0]=border[:,-1]=True
    seeds = np.unique(lab[border & passable]); seeds = seeds[seeds>0]
    bg = np.isin(lab, seeds)
    fg = ~bg
    fg = ndi.binary_opening(fg, iterations=1)
    # keep large components only
    lab2, n2 = ndi.label(fg)
    if n2:
        sizes = ndi.sum(fg, lab2, range(1, n2+1))
        inks = ndi.sum(dark, lab2, range(1, n2+1))
        # keep sizeable parts that are drawn with ink (characters, notes) — sparkles/bokeh have none
        keep = [i+1 for i,(s,k) in enumerate(zip(sizes, inks)) if s > 0.002*h*w and k > 0.04*s]
        fg = np.isin(lab2, keep)
    fg = ndi.binary_fill_holes(fg)
    return fg

if __name__ == '__main__':
    for path in sys.argv[1:]:
        im = np.asarray(Image.open(path).convert('RGB'))
        fg = segment(im)
        alpha = Image.fromarray((fg*255).astype(np.uint8)).filter(__import__('PIL.ImageFilter',fromlist=['x']).GaussianBlur(1.2))
        out = Image.fromarray(im).convert('RGBA'); out.putalpha(alpha)
        bg = Image.new('RGBA', out.size, (239,231,216,255)); bg.alpha_composite(out)
        bg.save(path.replace('.png','-cut.png'))
