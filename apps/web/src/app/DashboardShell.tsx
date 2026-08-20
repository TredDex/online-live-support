import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";


export default function DashboardShell({
children
}:{
children:React.ReactNode
}){

return (

<div className="dashboard-shell">

<Sidebar/>


<div className="workspace">

<Topbar/>


<main className="content">

{children}

</main>


</div>


</div>

)

}
