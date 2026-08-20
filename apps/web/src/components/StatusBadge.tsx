type Props={
  api:boolean;
  socket:boolean;
};

export default function StatusBadge({
 api,
 socket
}:Props){

return (
<div>
 <p>
 API:
 {
 api
 ? "🟢 Online"
 : "🔴 Offline"
 }
 </p>

 <p>
 Socket:
 {
 socket
 ? "🟢 Connected"
 : "🔴 Disconnected"
 }
 </p>
</div>
)

}
