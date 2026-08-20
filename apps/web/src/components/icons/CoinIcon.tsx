type Props={
 src:string;
 alt:string;
};


export default function CoinIcon({
 src,
 alt
}:Props){

return (
<img
 src={src}
 alt={alt}
 width="36"
 height="36"
 loading="lazy"
/>
);

}
