import sys,glob,re,numpy as np,tifffile
d=sys.argv[1]
E0,E1,N0,N1=2612,2622,1087,1096
W=(E1-E0)*500;H=(N1-N0)*500
m=np.full((H,W),np.nan,np.float32)
for f in glob.glob(d+'/*.tif'):
    e,n=map(int,re.search(r'_(\d{4})-(\d{4})_2_',f).groups())
    a=tifffile.imread(f).astype(np.float32)
    a[a<-1000]=np.nan
    r=(N1-1-n)*500;c=(e-E0)*500
    m[r:r+a.shape[0],c:c+a.shape[1]]=a[:500,:500]
print(m.shape,np.nanmin(m),np.nanmax(m),np.isnan(m).mean())
i=np.nanargmax(m);r,c=divmod(i,W);print('peak',E0*1000+c*2,N1*1000-r*2,m[r,c])
np.save(d+'/mosaic.npy',m)
