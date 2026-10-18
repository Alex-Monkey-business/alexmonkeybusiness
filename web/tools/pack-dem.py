import sys,io,numpy as np
from PIL import Image
S=sys.argv[1]
m=np.load(S+'/dem/mosaic.npy').astype(np.float64)
E0,N1=2612000,1096000
e0,e1,n0,n1=2613000,2621000,1088000,1096000
c0=(e0-E0)//2;c1=(e1-E0)//2;r0=(N1-n1)//2;r1=(N1-n0)//2
a=m[r0:r1,c0:c1]
nanm=np.isnan(a);a[nanm]=2300
for N in (1024,):
    f=a.reshape(N,a.shape[0]//N if a.shape[0]%N==0 else 1,N,-1) if a.shape[0]%N==0 else None
    im=Image.fromarray(a.astype(np.float32),'F').resize((N,N),Image.BOX)
    h=np.asarray(im)
    q=np.clip((h-1500)*4,0,65535).astype(np.uint16)
    rgb=np.dstack([(q>>8).astype(np.uint8),(q&255).astype(np.uint8),np.zeros_like(q,np.uint8)])
    for fmt,kw in (('PNG',dict(optimize=True)),('WEBP',dict(lossless=True,quality=100,method=6))):
        b=io.BytesIO();Image.fromarray(rgb).save(b,fmt,**kw);print(N,fmt,len(b.getvalue())//1024,'kB')
    if N==1024: Image.fromarray(rgb).save(S+'/dem/h1024.png')
    if N==1024: Image.fromarray(rgb).save(S+'/dem/h1024.webp','WEBP',lossless=True,quality=100,method=6)
print('nan frac',nanm.mean(), 'm/px@768', 8000/768)
