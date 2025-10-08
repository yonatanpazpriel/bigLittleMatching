export default async function handler(req,res){
    try{
      if(req.method!=="POST") return res.status(405).json({error:"POST only"});
      const {rankL,rankB,capacity} = req.body||{};
      if(!rankL||!rankB) return res.status(400).json({error:"missing rankL/rankB"});
  
      const littles=Object.keys(rankL), bigs=Object.keys(rankB);
      const edge=(b,l)=>rankL[l]?.[b]!=null && rankB[b]?.[l]!=null;
      const acceptableL={}, acceptableB={}, idxB={};
  
      for(const l of littles)
        acceptableL[l]=bigs.filter(b=>edge(b,l)).sort((b1,b2)=>rankL[l][b1]-rankL[l][b2]);
      for(const b of bigs){
        const arr=littles.filter(l=>edge(b,l)).sort((l1,l2)=>rankB[b][l1]-rankB[b][l2]);
        acceptableB[b]=arr; idxB[b]=Object.fromEntries(arr.map((l,i)=>[l,i]));
      }
  
      const capDefault=Object.fromEntries(bigs.map(b=>[b,2]));
      const cap={...capDefault,...(capacity||{})};
  
      const held=Object.fromEntries(bigs.map(b=>[b,[]]));
      const nextIdx=Object.fromEntries(littles.map(l=>[l,0]));
      let free=littles.filter(l=>acceptableL[l].length>0);
  
      while(free.length){
        const l=free.pop();
        const prefs=acceptableL[l];
        if(nextIdx[l]>=prefs.length) continue;
        const b=prefs[nextIdx[l]++];
        const list=held[b], limit=cap[b]??1;
        if(list.length<limit){
          list.push(l); list.sort((x,y)=>idxB[b][x]-idxB[b][y]);
        }else{
          const worst=list[list.length-1];
          if(idxB[b][l]<idxB[b][worst]){
            list[list.length-1]=l; list.sort((x,y)=>idxB[b][x]-idxB[b][y]); free.push(worst);
          }else{
            free.push(l);
          }
        }
        if(nextIdx[l]<prefs.length && !held[b].includes(l) && !free.includes(l)) free.push(l);
      }
  
      return res.status(200).json({matching:held});
    }catch(e){
      return res.status(500).json({error:String(e)});
    }
  }
  
  