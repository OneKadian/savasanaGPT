import { useEffect, useState } from "react";
import Chat from "@/components/Chat";
import MobileSiderbar from "@/components/MobileSidebar";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { MdLogout } from "react-icons/md";
import { useAuth } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { supabase } from "@/supabase/supabaseRequests";
import { AiOutlinePlus } from "react-icons/ai";

interface Conversation {
  firstQuestion: string;
  id: string;
}

export default function Home() {
  const [isComponentVisible, setIsComponentVisible] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const { userId } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetchConversations = async () => {
    setIsLoading(true);
    if (userId) {
      const { data, error } = await supabase
        .from("conversations")
        .select("firstQuestion, id")  // Use comma-separated string here
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching conversations:", error);
        return;
      }

      setConversations(data || []);
    }
    setIsLoading(false);
    console.log(conversations);
  };

  fetchConversations();
}, [userId, selectedConversationId]);


  const toggleComponentVisibility = () => {
    setIsComponentVisible(!isComponentVisible);
  };

  return (
    <main className="overflow-hidden w-full h-screen relative flex">
      {isComponentVisible && (
        <MobileSiderbar toggleComponentVisibility={toggleComponentVisibility} />
      )}
      <div className="dark hidden flex-shrink-0 bg-gray-900 md:flex md:w-[260px] md:flex-col">
        <div className="flex h-full min-h-0 flex-col ">
          <div className="scrollbar-trigger flex h-full w-full flex-1 items-start border-white/20">
            <nav className="flex h-full flex-1 flex-col space-y-1 p-2">
              {isLoading ? (
                <Box sx={{ display: "flex" }}>
                  <CircularProgress size={24} />
                </Box>
                
              ) : (
               <>
<a
  className="flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm mb-1 flex-shrink-0 border border-white/20"
  onClick={() => window.location.reload()}
>
  <AiOutlinePlus className="h-4 w-4" />
  New chat
</a>

{userId && conversations.map((conversation) => (
  <a
    key={conversations.indexOf(conversation)}
    onClick={() => setSelectedConversationId(conversation.id)}
    className="flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm mb-1 flex-shrink-0 border border-white/20 w-[98%] overflow-hidden whitespace-nowrap text-ellipsis"
  >
    {conversation.firstQuestion.length > 30
      ? `${conversation.firstQuestion.slice(0, 30)}...`
      : conversation.firstQuestion}
  </a>
))}

  </>
              )}
              {!userId ? (
                <Link
                  href="sign-in"
                  className="flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm"
                >
                  <MdLogout className="h-4 w-4" />
                  Log in
                </Link>
              ) : (
                <div className="w-full h-max flex justify-center items-center">
                  <UserButton />
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
<Chat
  toggleComponentVisibility={toggleComponentVisibility}
  conversationId={selectedConversationId} // Pass down the selected ID here
/>

    </main>
  );
}
