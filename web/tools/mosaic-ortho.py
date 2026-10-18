import sys,glob,re,numpy as np,tifffile
from PIL import Image
S=sys.argv[1]
E0,E1,N0,N1=2612,2622,1087,1096
W=(E1-E0)*500;H=(N1-N0)*500
m=np.zeros((H,W,3),np.uint8); have=np.zeros((H,W),bool)
for f in glob.glob(S+'/ortho/*.tif'):
    e,n=map(int,re.search(r'_(\d{4})-(\d{4})_2_2056',f).groups())
    a=tifffile.imread(f)
    if a.ndim==3 and a.shape[0] in (3,4): a=np.moveaxis(a,0,-1)
    a=a[:500,:500,:3]
    r=(N1-1-n)*500;c=(e-E0)*500
    m[r:r+500,c:c+500]=a; have[r:r+500,c:c+500]=a.sum(2)>0
np.save(S+'/ortho/mosaic.npy',m)
print(m.shape,have.mean())
# crop around summit
r0,c0=(N1*1000-1091674)//2,(2617048-E0*1000)//2
Image.fromarray(m[r0-800:r0+800,c0-800:c0+800]).resize((800,800)).save(S+'/ortho/peek.png')
