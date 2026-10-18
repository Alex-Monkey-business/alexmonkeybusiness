"""Ridge routes as least-cost paths: summit -> a known foot, where cost is
low on crests (height above the local mean) and high in gullies and faces."""
import sys,json,heapq,math,numpy as np
from PIL import Image,ImageDraw
S,OUT=sys.argv[1],sys.argv[2]
m=np.load(S+'/dem/mosaic.npy').astype(np.float64)
E0,N1=2612000,1096000; SE,SN=2617048,1091674
G=4  # metres per node
X0,X1,Y0,Y1=-2000,2400,-800,2400
c0=(X0+SE-E0)//2; r0=(N1-(Y1+SN))//2
w=(X1-X0)//2; hgt=(Y1-Y0)//2
a=np.nan_to_num(m[r0:r0+hgt,c0:c0+w],nan=2000)
a=a[:hgt//2*2,:w//2*2].reshape(hgt//2,2,w//2,2).mean((1,3))  # 4 m
H,W=a.shape
def box(z,k):
    p=np.pad(z,k,mode='edge');c=p.cumsum(0).cumsum(1);c=np.pad(c,((1,0),(1,0)))
    n=2*k+1;return (c[n:,n:]-c[:-n,n:]-c[n:,:-n]+c[:-n,:-n])/(n*n)
ridge=np.maximum(a-box(a,6),0)  # height above the 52 m mean
cost=1.0/(0.15+ridge)
def node(x,y): return int(round((Y1-y)/G)),int(round((x-X0)/G))
def xy(r,c): return X0+c*G,Y1-r*G
def path(src,dst):
    sr,sc=node(*src);dr,dc=node(*dst)
    dist=np.full((H,W),np.inf);prev=-np.ones((H,W),np.int64);dist[sr,sc]=0;q=[(0.0,sr,sc)]
    nb=[(-1,-1,1.414),(-1,0,1),(-1,1,1.414),(0,-1,1),(0,1,1),(1,-1,1.414),(1,0,1),(1,1,1.414)]
    while q:
        d,r,c=heapq.heappop(q)
        if (r,c)==(dr,dc):break
        if d>dist[r,c]:continue
        for i,j,l in nb:
            rr,cc=r+i,c+j
            if 0<=rr<H and 0<=cc<W:
                nd=d+l*(cost[r,c]+cost[rr,cc])*0.5
                if nd<dist[rr,cc]:dist[rr,cc]=nd;prev[rr,cc]=r*W+c;heapq.heappush(q,(nd,rr,cc))
    out=[];k=dr*W+dc
    while k>=0:
        r,c=divmod(k,W);out.append((r,c));k=prev[r,c]
    return out  # dst -> src: foot to summit
def zat(x,y):
    cc=(x+SE-E0)/2-0.5;rr=(N1-(y+SN))/2-0.5;i,j=int(rr),int(cc);fy,fx=rr-i,cc-j
    q=m[i:i+2,j:j+2];return float((q[0,0]*(1-fx)+q[0,1]*fx)*(1-fy)+(q[1,0]*(1-fx)+q[1,1]*fx)*fy)
def rdp(p,eps):
    p=np.asarray(p)
    if len(p)<3:return p
    d=p[-1,:2]-p[0,:2];n=np.hypot(*d) or 1
    dist=np.abs(d[0]*(p[:,1]-p[0,1])-d[1]*(p[:,0]-p[0,0]))/n;i=int(np.argmax(dist))
    if dist[i]>eps:return np.vstack([rdp(p[:i+1],eps)[:-1],rdp(p[i:],eps)])
    return p[[0,-1]]
FEET={'hornligrat':(1435,647),'zmuttgrat':(-1166,1300)}
res={}
for k,foot in FEET.items():
    rc=path((0,0),foot)
    pts=[(*xy(r,c),) for r,c in rc]
    # smooth xy a little (3-node mean) so the 4 m grid does not stair-step
    P=np.array(pts,float);P[1:-1]=(P[:-2]+P[1:-1]+P[2:])/3
    P=np.array([(x,y,zat(x,y)) for x,y in P])
    P[-1]=(0,0,zat(0,0))
    Q=rdp(P,2.5)
    L=np.concatenate([[0],np.cumsum(np.linalg.norm(np.diff(Q,axis=0),axis=1))]);L/=L[-1]
    res[k]=[[round(x,1),round(y,1),round(z,1),round(f,4)] for (x,y,z),f in zip(Q,L)]
    print(k,len(P),'->',len(Q),'foot z',round(Q[0][2]),'top z',round(Q[-1][2]))
json.dump(res,open(OUT,'w'))
s=np.clip((np.gradient(a,axis=1)*-0.5+np.gradient(a,axis=0)*0.5)/G*0.6+0.5,0,1)
im=Image.fromarray((s*255).astype(np.uint8)).convert('RGB');d=ImageDraw.Draw(im)
for k,col in (('hornligrat','#ff00ff'),('zmuttgrat','#00ffff')):
    d.line([((x-X0)/G,(Y1-y)/G) for x,y,z,f in res[k]],fill=col,width=3)
im.save(S+'/dem/routes2.png')
