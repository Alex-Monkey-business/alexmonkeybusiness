import sys,io,json,numpy as np
from PIL import Image
S=sys.argv[1]
m=np.load(S+'/dem/mosaic.npy').astype(np.float64)
E0,N1=2612000,1096000; SE,SN=2617048,1091674
# base exactly as the browser decodes it
b=np.asarray(Image.open(S+'/dem/h1024.webp').convert('RGB')).astype(np.float64)
base=(b[...,0]*256+b[...,1])/4+1500
PX=8000/1024; OX,OY=4048,4326
def base_at(x,y):
    tx=(x+OX)/PX-0.5; ty=(OY-y)/PX-0.5
    tx=np.clip(tx,0,1023);ty=np.clip(ty,0,1023)
    i=np.floor(ty).astype(int);j=np.floor(tx).astype(int);fy=ty-i;fx=tx-j
    i1=np.minimum(i+1,1023);j1=np.minimum(j+1,1023)
    return (base[i,j]*(1-fx)+base[i,j1]*fx)*(1-fy)+(base[i1,j]*(1-fx)+base[i1,j1]*fx)*fy
X0,X1,Y0,Y1=-1400,1700,-1300,1800
for D in (1536,):
    dp=(X1-X0)/D
    xs=X0+(np.arange(D)+0.5)*dp; ys=Y1-(np.arange(D)+0.5)*dp
    XX,YY=np.meshgrid(xs,ys)
    # hi-res sampled (box via resize of crop)
    c0=int((X0+SE-E0)/2); r0=int((N1-(Y1+SN))/2); n=int((X1-X0)/2)
    crop=np.nan_to_num(m[r0:r0+n,c0:c0+n],nan=2300).astype(np.float32)
    hi=np.asarray(Image.fromarray(crop).resize((D,D),Image.BOX)).astype(np.float64)
    res=hi-base_at(XX,YY)
    q=np.clip(np.round(res*2+128),0,255).astype(np.uint8)
    print(D,'m/px',round(dp,2),'res range',res.min().round(1),res.max().round(1),'clip%',round(((res*2+128<0)|(res*2+128>255)).mean()*100,3))
    for fmt,kw in (('WEBP',dict(lossless=True,method=6)),('WEBP',dict(quality=90,method=6)),('WEBP',dict(quality=80,method=6))):
        bb=io.BytesIO();Image.fromarray(q).save(bb,fmt,**kw);print('  ',kw,len(bb.getvalue())//1024,'kB')
    Image.fromarray(q).save(S+f'/dem/detail{D}.webp','WEBP',quality=90,method=6)
d=np.asarray(Image.open(S+'/dem/detail1536.webp').convert('RGB')).astype(np.float64)[...,1]
err=(d-128)/2-np.clip(res,-64,63.5)
print('decode err m: mean',np.abs(err).mean().round(3),'p99',np.percentile(np.abs(err),99).round(2),'size',__import__('os').path.getsize(S+'/dem/detail1536.webp')//1024,'kB')
