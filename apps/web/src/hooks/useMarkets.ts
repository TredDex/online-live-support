import {
 useEffect,
 useState
} from 'react';


const API =
 import.meta.env.VITE_API_URL ||
 window.location.origin;


export type MarketCoin={
 id:string;
 name:string;
 symbol:string;
 image:string;
 price:number;
 change24h:number;
 marketCap:number;
};


export function useMarkets(){

const [coins,setCoins]=
useState<MarketCoin[]>([]);

const [loading,setLoading]=
useState(true);


useEffect(()=>{

fetch(
 `${API}/api/market/coins`
)
.then(r=>r.json())
.then(data=>{
 setCoins(data);
 setLoading(false);
})
.catch(()=>{
 setLoading(false);
});


},[]);


return {
 coins,
 loading
};

}
