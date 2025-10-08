import pandas as pd
from ortools.sat.python import cp_model

def ranks_from_csv(path):
    df=pd.read_csv(path)
    name_col=df.columns[1]
    pref_cols=list(df.columns[2:7])
    R={}
    for _,r in df.iterrows():
        a=str(r[name_col]).strip()
        R[a]={}
        for k,c in enumerate(pref_cols,1):
            v=r[c]
            if pd.notna(v): R[a][str(v).strip()]=k
    return R

rankL=ranks_from_csv('littleForm.csv')
rankB=ranks_from_csv('bigForm.csv')
L=list(rankL.keys()); B=list(rankB.keys())
edges=[(b,l) for b in B for l in L if l in rankB[b] and b in rankL[l]]
qB={b:2 for b in B}

PLge={ (l,b):[bp for bp in B if b in rankL[l] and bp in rankL[l] and rankL[l][bp]<=rankL[l][b]] for l in L for b in B if b in rankL[l]}
PBge={ (b,l):[lp for lp in L if l in rankB[b] and lp in rankB[b] and rankB[b][lp]<=rankB[b][l]] for b in B for l in L if l in rankB[b]}

m=cp_model.CpModel()
x={(b,l):m.NewBoolVar(f"x_{b}_{l}") for b,l in edges}
for b in B: m.Add(sum(x[b,l] for l in L if (b,l) in x)<=qB[b])
for l in L: m.Add(sum(x[b,l] for b in B if (b,l) in x)<=1)
for b,l in edges:
    s1=sum(x[bp,l] for bp in PLge[(l,b)] if (bp,l) in x)
    s2=sum(x[b,lp] for lp in PBge[(b,l)] if (b,lp) in x)
    m.Add(qB[b]*s1+s2>=qB[b])

class AllStable(cp_model.CpSolverSolutionCallback):
    def __init__(self,x): super().__init__(); self.x=x; self.n=0
    def OnSolutionCallback(self):
        self.n+=1
        M={}
        for (b,l),v in self.x.items():
            if self.Value(v):
                M.setdefault(b,[]).append(l)
        print(f"\nStable matching #{self.n}")
        for b in sorted(M): print(b,":",", ".join(sorted(M[b])))

s=cp_model.CpSolver()
s.parameters.enumerate_all_solutions=True
s.Solve(m,AllStable(x))
