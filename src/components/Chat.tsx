import { useEffect, useRef, useState } from "react";
import { FiSend } from "react-icons/fi";
import { BsChevronDown, BsPlusLg } from "react-icons/bs";
import { RxHamburgerMenu } from "react-icons/rx";
import useAutoResizeTextArea from "@/hooks/useAutoResizeTextArea";
import Message from "./Message";
import { DEFAULT_OPENAI_MODEL } from "@/shared/Constants";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  AiOutlinePlus,
} from "react-icons/ai";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { supabase, addConversation } from "@/supabase/supabaseRequests";


const Chat = (props: any) => {
  const { userId } = useAuth();
  const { toggleComponentVisibility } = props;
  const { conversationId: propConversationId } = props; // Get conversation ID prop
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showEmptyChat, setShowEmptyChat] = useState(true);
  const [conversationID, setconversationID] = useState()
  const [conversation, setConversation] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const textAreaRef = useAutoResizeTextArea();
  const bottomOfChatRef = useRef<HTMLDivElement>(null);
  const selectedModel = DEFAULT_OPENAI_MODEL;


  useEffect(() => {
  const initializeConversationId = async () => {
    // Function to generate a unique conversation ID
    const generateUniqueConversationId = () => {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      return `${userId}-${randomDigits}`;
    };

    // Use the provided prop ID if available; otherwise, generate a new one
    let finalConversationId = propConversationId || generateUniqueConversationId();

    // Set the conversation ID in the state
    setconversationID(finalConversationId);

        // Adjust text area height
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "24px";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  };

  initializeConversationId();
}, [propConversationId, userId]);


// Function to create a user if they don't exist
const createUserIfNotExists = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select("user_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user:", error);
    return null;
  }

  if (data.length === 0) {
    const { error: insertError } = await supabase
      .from("users")
      .insert({ user_id: userId });
    if (insertError) {
      console.error("Error creating user:", insertError);
      return null;
    }
    console.log("User created:", userId);
  }
  return userId;
};

// Function to add a new conversation
const addConversationWithMessages = async (userId, initialQuestion, initialAnswer) => {
  // Ensure the user exists
  await createUserIfNotExists(userId);

  // Create the conversation
  const { data: conversationData, error: conversationError } = await supabase
    .from("conversations")
    .insert({ user_id: userId })
    .select();

  if (conversationError || !conversationData) {
    console.error("Error creating conversation:", conversationError);
    return null;
  }

  const conversationId = conversationData[0].id;

  // Add initial question and answer to the conversation in messages
  const { error: messageError } = await supabase.from("messages").insert([
    {
      conversation_id: conversationId,
      user_id: userId,
      content: initialQuestion,
      message_type: "question",
    },
    {
      conversation_id: conversationId,
      user_id: userId,
      content: initialAnswer,
      message_type: "answer",
    },
  ]);

  if (messageError) {
    console.error("Error adding messages:", messageError);
    return null;
  }

  console.log("Conversation created with initial messages.");
  return conversationId;
};

// Updated handleSubmit function
const handleSubmit = async (question, answer) => {
  try {
    const conversationId = await addConversationWithMessages(userId, question, answer);
    if (!conversationId) {
      console.error("Error: Conversation creation failed.");
    }
  } catch (error) {
    console.error("Error in handleSubmit:", error);
  }
};

const sendMessage = async (e) => {
  e.preventDefault();

  if (message.length < 1) {
    setErrorMessage("Please enter a message.");
    return;
  } else {
    setErrorMessage("");
  }

  setIsLoading(true);
  const userQuestion = message; // Store the question

  // Clear the message & remove empty chat
  setMessage("");
  setShowEmptyChat(false);

  try {
    const response = await fetch(`/api/openai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [...conversation.map(c => ({ content: c.question, role: "user" })), { content: userQuestion, role: "user" }],
        model: selectedModel,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const systemAnswer = data.message; // Store the answer

      // Update conversation with question-answer object after receiving the answer
      setConversation([
        ...conversation,
        { question: userQuestion, answer: systemAnswer },
      ]);

      // Save question and answer to database
      await handleSubmit(userQuestion, systemAnswer);
    } else {
      console.error(response);
      setErrorMessage(response.statusText);
    }

    setIsLoading(false);
  } catch (error) {
    console.error(error);
    setErrorMessage(error.message);
    setIsLoading(false);
  }
};

  const handleKeypress = (e: any) => {
    if (e.keyCode == 13 && !e.shiftKey) {
      sendMessage(e);
      e.preventDefault();
    }
  };

  return (
  <div className="flex max-w-full flex-1 flex-col">
    <div className="sticky top-0 z-10 flex items-center border-b border-white/20 bg-gray-800 pl-1 pt-1 text-gray-200 sm:pl-3 md:hidden">
      <button
        type="button"
        className="-ml-0.5 -mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white dark:hover:text-white"
        onClick={toggleComponentVisibility}
      >
        <span className="sr-only">Open sidebar</span>
        <RxHamburgerMenu className="h-6 w-6 text-white" />
      </button>
      <h1 className="flex-1 text-center text-base font-normal">New chat</h1>
      <button type="button" className="px-3">
        <BsPlusLg className="h-6 w-6" />
      </button>
    </div>
    <div className="relative h-full w-full transition-width flex flex-col overflow-hidden items-stretch flex-1">
      <div className="flex-1 overflow-hidden">
        <div className="react-scroll-to-bottom--css-ikyem-79elbk h-full dark:bg-gray-800">
          <div className="react-scroll-to-bottom--css-ikyem-1n7m0yu">
            {!showEmptyChat && conversation.length > 0 ? (
              <div className="flex flex-col items-center text-sm bg-gray-800">
                <a 
                onClick={() => { console.log(conversation); }}
                className="flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm mb-1 flex-shrink-0 border border-white/20">
                  <AiOutlinePlus className="h-4 w-4" />
                  New chat
                </a>
                {conversation.map((item, index) => (
                  <div key={index} className="flex flex-col w-full">
                    <Message message={{ content: item.question, role: "user" }} />
                    <Message message={{ content: item.answer, role: "system" }} />
                  </div>
                ))}
                <div className="w-full h-32 md:h-48 flex-shrink-0"></div>
                <div ref={bottomOfChatRef}></div>
              </div>
            ) : null}
              {showEmptyChat ? (
                <div className="py-10 relative w-full flex flex-col h-full">
                  <div className="flex items-center justify-center gap-2">
                    <div className="relative w-full md:w-1/2 lg:w-1/3 xl:w-1/4"></div>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-semibold text-center text-gray-200 dark:text-gray-600 flex gap-2 items-center justify-center h-screen">
                    ChatGPT Clone
                  </h1>
                </div>
              ) : null}
              <div className="flex flex-col items-center text-sm dark:bg-gray-800"></div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full border-t md:border-t-0 dark:border-white/20 md:border-transparent md:dark:border-transparent md:bg-vert-light-gradient bg-white dark:bg-gray-800 md:!bg-transparent dark:md:bg-vert-dark-gradient pt-2">
          <form className="stretch mx-2 flex flex-row gap-3 last:mb-2 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl">
            <div className="relative flex flex-col h-full flex-1 items-stretch md:flex-col">
              {errorMessage ? (
                <div className="mb-2 md:mb-0">
                  <div className="h-full flex ml-1 md:w-full md:m-auto md:mb-2 gap-0 md:gap-2 justify-center">
                    <span className="text-red-500 text-sm">
                      {errorMessage}
                    </span>
                  </div>
                </div>
              ) : null}
              {!userId ? (
                <Link
                  href="sign-in"
                  className="flex flex-col w-full py-2 flex-grow md:py-3 md:pl-4 relative border border-black/10 text-center font-2xl  bg-blue-600 text-white rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]"
                >
                  Log in
                </Link>
              ) : (
                <div className="flex flex-col w-full py-2 flex-grow md:py-3 md:pl-4 relative border border-black/10 bg-white dark:border-gray-900/50 dark:text-white dark:bg-gray-700 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]">
                  <textarea
                    ref={textAreaRef}
                    value={message}
                    tabIndex={0}
                    data-id="root"
                    style={{
                      height: "24px",
                      maxHeight: "200px",
                      overflowY: "hidden",
                    }}
                    rows={1}
                    placeholder="Type your message here"
                    onKeyDown={handleKeypress}
                    onChange={(e) => setMessage(e.target.value)}
                    className="m-0 w-full resize-none border-0 bg-transparent p-0 pl-2 pr-7 focus:ring-0 focus-visible:ring-0 dark:bg-transparent md:pl-0"
                  ></textarea>
                  <button
                    className="absolute p-1 rounded-md text-gray-500 bottom-2 md:bottom-3 right-1 md:right-2 hover:bg-gray-100 dark:hover:text-gray-400 dark:hover:bg-gray-900"
                    onClick={sendMessage}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Box sx={{ display: "flex" }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      <FiSend />
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>
          <div className="px-3 pt-1 pb-3 text-center text-xs text-black/50 dark:text-white/50 md:px-4 md:pt-3 md:pb-6">
            ChatGPT Clone Footer
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;