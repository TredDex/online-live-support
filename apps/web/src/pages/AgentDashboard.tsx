import StatCard from "../components/dashboard/StatCard";

export default function AgentDashboard(){

return (

<div className="dashboard-page">

<div className="page-title">

<h1>
Live Support Dashboard
</h1>

<p>
Monitor visitors, conversations and AI assistance
</p>

</div>


<div className="stats-grid">

<StatCard
title="Active Chats"
value="24"
/>


<StatCard
title="Waiting Visitors"
value="7"
/>


<StatCard
title="AI Resolutions"
value="86%"
/>


<StatCard
title="Response Time"
value="12s"
/>


</div>


<div className="dashboard-panels">


<div className="panel">

<h2>
Incoming Conversations
</h2>

<p>
No waiting conversations
</p>

</div>


<div className="panel">

<h2>
AI Assistant
</h2>

<p>
Ready to assist agents
</p>

</div>


</div>


</div>

)

}
