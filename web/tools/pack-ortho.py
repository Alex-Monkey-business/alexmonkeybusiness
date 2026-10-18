"""Orthophoto -> two channels for the detail box (x -1400..1700, y -1300..1800 from the summit, 1536^2):
R = rock structure: luminance high-passed over ~40 m (baked large-scale shading removed), 128 = flat.
G = snow/ice: bright and grey, or blue in shadow."""
import sys,io,numpy as np
from PIL import Image, ImageFilter
S,OUT=sys.argv[1],sys.argv[2]
m=np.load(S+'/ortho/mosaic.npy').astype(np.float32)/255
E0,N1=2612000,1096000; SE,SN=2617048,1091674
X0,X1,Y1=-1400,1700,1800
c0=(X0+SE-E0)//2; r0=(N1-(Y1+SN))//2; n=(X1-X0)//2
a=m[r0:r0+n,c0:c0+n]
im=Image.fromarray((a*255).astype(np.uint8)).resize((1024,1024),Image.BOX)
a=np.asarray(im).astype(np.float32)/255
lum=a@np.array([0.299,0.587,0.114],np.float32)
blur=np.asarray(Image.fromarray((lum*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(7))).astype(np.float32)/255
hp=np.clip(lum/(blur+0.03),0,2)
R=np.clip(128+(hp-1)*160,0,255)
mx=a.max(2);mn=a.min(2);sat=(mx-mn)/(mx+1e-3)
blue=a[...,2]-a[...,0]
snow=np.clip((lum-0.74)/0.1,0,1)*np.clip((0.14-sat)/0.06,0,1)
shsnow=np.clip((blue-0.11)/0.06,0,1)*np.clip((lum-0.18)/0.12,0,1)
G=np.clip(np.maximum(snow,shsnow)*255,0,255)
out=np.dstack([R,G,np.zeros_like(R)]).astype(np.uint8)
Image.fromarray(out).save(OUT,'WEBP',quality=70,method=6)
import os;print(os.path.getsize(OUT)//1024,'kB')
Image.fromarray(out).resize((768,768)).save(S+'/ortho/packed.png')
