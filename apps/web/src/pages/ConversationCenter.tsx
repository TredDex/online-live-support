import ConversationList from "../components/conversations/ConversationList";
import { useConversations } from "../hooks/useConversations";


export default function ConversationCenter(){

const {
conversations
}=useConversations();


return (

<div className="conversation-page">


<h1>
Conversation Center
</h1>


<ConversationList

conversations={conversations}

onSelect={(id)=>
console.log("selected",id)
}

/>


<div className="chat-panel">

<h2>
Select a conversation
</h2>

<p>
Live visitor conversations will appear here.
</p>


</div>


</div>

)

}
