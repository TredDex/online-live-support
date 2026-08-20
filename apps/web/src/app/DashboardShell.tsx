import React from "react";

export default function DashboardShell({
children
}:{
children:React.ReactNode
}){

return (
<div className="dashboard-shell">

<aside>
<h1>
Online Live Support
</h1>

<nav>
<button>Dashboard</button>
<button>Conversations</button>
<button>AI Console</button>
<button>Markets</button>
<button>Settings</button>
</nav>

</aside>


<main>

<header>
<h2>
Support Intelligence Center
</h2>

<div>
● Online
</div>

</header>


<section>
{children}
</section>

</main>


</div>
)

}
