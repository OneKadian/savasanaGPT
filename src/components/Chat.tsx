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
import { FaArrowAltCircleDown, FaArrowAltCircleUp } from "react-icons/fa";


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

  // below are the states for the modal, subject to change
// Modal states
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [editQuestion, setEditQuestion] = useState("");
const [newAnswer, setNewAnswer] = useState("");
const [editingMessageId, setEditingMessageId] = useState(null);
const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);

const [isViewEditedModalOpen, setIsViewEditedModalOpen] = useState(false);
const [viewEditedQuestion, setViewEditedQuestion] = useState("");
const [viewEditedAnswer, setViewEditedAnswer] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleModal = () => {
    setIsModalOpen((prev) => !prev);
  };

const handleToggleExpand = (index) => {
  setConversation((prevConversation) =>
    prevConversation.map((item, idx) =>
      idx === index
        ? { ...item, isExpanded: !item.isExpanded } // Toggle the specific item's state
        : item
    )
  );
};


useEffect(() => {
  const initializeConversationId = async () => {
    // Function to generate a unique conversation ID
    const generateUniqueConversationId = () => {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      return `${userId}-${randomDigits}`;
    };

    let finalConversationId = propConversationId || generateUniqueConversationId();
    setconversationID(finalConversationId);

    if (propConversationId) {
      // Fetch messages from the "messages" table including editedQuestion and editedAnswer
      const { data, error } = await supabase
        .from("messages")
        .select("question, answer, editedQuestion, editedAnswer, id")
        .eq("conversation_id", finalConversationId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching messages:", error);
      } else if (data) {
        // Format data to include question, answer, editedQuestion, editedAnswer, and id
        const formattedConversation = data.map((msg) => ({
          id: msg.id, // Conversation message ID
          question: msg.question,
          answer: msg.answer,
          editedQuestion: msg.editedQuestion,
          editedAnswer: msg.editedAnswer,
        }));
        setConversation(formattedConversation);
        setShowEmptyChat(false);
      }
    }

    // Adjust text area height
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "24px";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  };

  initializeConversationId();
  console.log(conversation);
  console.log(conversationID);

}, [propConversationId, userId]);
//   try {
//     // Case 1: Existing conversation ID is provided
//     if (propConversationId) {
//       const { error: messageError } = await supabase.from("messages").insert({
//         conversation_id: propConversationId,
//         user_id: userId,
//         question: question,
//         answer: answer,
//       });
//       if (messageError) throw new Error("Error inserting message into messages table");

//       console.log("Message with question and answer added to existing conversation.");
//     } else {
//       // Case 2: New conversation ID
//       const { data: existingConversations, error: selectError } = await supabase
//         .from("conversations")
//         .select("id")
//         .eq("id", conversationID);

//       if (selectError) throw new Error("Error fetching conversation data");

//       let newConversationId = conversationID;
//       if (existingConversations.length === 0) {
//         const { data: conversationData, error: insertError } = await supabase
//           .from("conversations")
//           .insert({
//             id: conversationID,
//             user_id: userId,
//             firstQuestion: question,
//           })
//           .select();
//         if (insertError || !conversationData) {
//           throw new Error("Error inserting new conversation");
//         }
//         newConversationId = conversationData[0].id;
//       }

//       const { error: messageError } = await supabase.from("messages").insert({
//         conversation_id: newConversationId,
//         user_id: userId,
//         question: question,
//         answer: answer,
//       });
//       if (messageError) throw new Error("Error inserting message into messages table");

//       console.log("New conversation and message with question and answer added to database.");
//     }

//     // Update the conversation state with the additional keys
//     setConversation([
//       ...conversation,
//       { question, answer, editedQuestion: null, editedAnswer: null },
//     ]);
//   } catch (error) {
//     console.error("Error in handleSubmit:", error);
//   }
// };

const handleSubmit = async (question, answer) => {
  try {
    let finalConversationId = propConversationId || conversationID;

    // Case 1: Check if an existing conversation ID is provided or already exists
    if (!propConversationId) {
      const { data: existingConversations, error: selectError } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationID);

      if (selectError) throw new Error("Error fetching conversation data");

      if (existingConversations.length === 0) {
        // Insert a new conversation
        const { data: conversationData, error: insertError } = await supabase
          .from("conversations")
          .insert({
            id: conversationID,
            user_id: userId,
            firstQuestion: question,
          })
          .select();
        if (insertError || !conversationData) throw new Error("Error inserting new conversation");

        finalConversationId = conversationData[0].id;
      }
    }

    // Insert the question-answer pair into the `messages` table
    const { error: messageError } = await supabase.from("messages").insert({
      conversation_id: finalConversationId,
      user_id: userId,
      question,
      answer,
    });
    if (messageError) throw new Error("Error inserting message into messages table");

    console.log("Message with question and answer successfully added to database.");

    // Fetch all updated records from the `messages` table
    const { data: updatedMessages, error: fetchError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", finalConversationId)
      .eq("user_id", userId);

    if (fetchError) throw new Error("Error fetching updated messages from the database");

    console.log("Fetched updated messages:", updatedMessages);

    // Return the updated messages
    return updatedMessages.map((msg) => ({
      question: msg.question,
      answer: msg.answer,
      editedQuestion: null,
      editedAnswer: null,
    }));
  } catch (error) {
    console.error("Error in handleSubmit:", error);
    throw error;
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
        messages: [
          ...conversation.map((c) => ({ content: c.question, role: "user" })),
          { content: userQuestion, role: "user" },
        ],
        model: selectedModel,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const systemAnswer = data.message; // Store the answer

      // Update conversation with question-answer object including edited fields
      setConversation([
        ...conversation,
        {
          question: userQuestion,
          answer: systemAnswer,
          editedQuestion: null,
          editedAnswer: null,
        },
      ]);

      // Save question and answer to the database
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

const logConversationDetails = () => {
  console.log("Conversation:", conversation);
  console.log("Conversation ID:", conversationID);
};

const handleKeypress = (e: any) => {
    if (e.keyCode == 13 && !e.shiftKey) {
      sendMessage(e);
      e.preventDefault();
    }
};

// Open modal with pre-filled question
const openEditModal = (messageId, question) => {
  setEditingMessageId(messageId);
  setEditQuestion(question);
  setNewAnswer("");
  setIsEditModalOpen(true);
  setIsSubmitDisabled(true);
};

// Close modal and clear states
const closeEditModal = () => {
  setIsEditModalOpen(false);
  setEditQuestion("");
  setNewAnswer("");
  setEditingMessageId(null);
};

// Handle question changes
const handleQuestionChange = (e) => {
  const updatedQuestion = e.target.value;
  setEditQuestion(updatedQuestion);
  setIsSubmitDisabled(updatedQuestion === conversation.find(msg => msg.id === editingMessageId).question);
};

// Generate new answer
const generateNewAnswer = async () => {
  setIsGeneratingAnswer(true);
  try {
    const response = await fetch(`/api/openai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          ...conversation.map((c) => ({ content: c.question, role: "user" })),
          { content: editQuestion, role: "user" },
        ],
        model: selectedModel,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setNewAnswer(data.message);
    } else {
      console.error("Failed to generate answer:", response.statusText);
    }
  } catch (error) {
    console.error("Error generating new answer:", error);
  }
  setIsGeneratingAnswer(false);
};

// Accept changes and update database
const acceptChanges = async () => {
  try {
    const { error } = await supabase
      .from("messages")
      .update({ editedQuestion: editQuestion, editedAnswer: newAnswer })
      .eq("id", editingMessageId);

    if (error) {
      throw new Error("Failed to update message in database");
    }

    // Update local state
    setConversation((prev) =>
      prev.map((msg) =>
        msg.id === editingMessageId
          ? { ...msg, editedQuestion: editQuestion, editedAnswer: newAnswer }
          : msg
      )
    );

    closeEditModal();
  } catch (error) {
    console.error(error.message);
  }
};

const openViewEditedModal = (id, question, answer) => {
  setViewEditedQuestion(question);
  setViewEditedAnswer(answer);
  setIsViewEditedModalOpen(true);
};

const closeViewEditedModal = () => {
  setIsViewEditedModalOpen(false);
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
      <button type="button" className="px-3" >
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
  // onClick={logConversationDetails}
  onClick={toggleModal}
  className="flex py-3 mt-4 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm mb-1 flex-shrink-0 border border-white/20">
  {/* <AiOutlinePlus className="h-4 w-4" /> */}
  Visualizer
</a>

{conversation.map((item, index) => (
  <div key={index} className="flex flex-col w-full mb-4">
    {/* Question with Edit Button */}
    <div className="flex items-center justify-center">
      {/* Question */}
      <div className="flex w-1/2">
        <Message message={{ content: item.question, role: "user" }} />
      </div>

      {/* Edit Button */}
      <div className="w-max">
{item.editedQuestion ? (
  <button
    onClick={() => openViewEditedModal(item.id, item.editedQuestion, item.editedAnswer)}
    className="bg-black text-white px-2 py-1 rounded"
  >
    Edited
  </button>
) : (
  <button
    onClick={() => openEditModal(item.id, item.question)}
    className="bg-black text-white px-2 py-1 rounded"
  >
    Edit
  </button>
)}


      </div>
    </div>

    {/* Answer */}
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
{isEditModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-gray-400 p-6 rounded-md w-96">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Edit Question</h3>
        <button
          onClick={closeEditModal}
          className="text-gray-500 hover:text-black text-3xl border border-gray-200 w-8 h-8 flex items-center justify-center"
          disabled={isGeneratingAnswer} // Cancel button disabled during "Generating..."
        >
          ×
        </button>
      </div>
      <textarea
        value={editQuestion}
        onChange={handleQuestionChange}
        className="w-full p-2 border rounded-md mb-4"
        rows={4}
      ></textarea>
      {newAnswer ? (
        <div className="p-2 border rounded-md bg-gray-50">
          <p>{newAnswer}</p>
        </div>
      ) : (
        isGeneratingAnswer && <div className="text-center">Generating...</div>
      )}
      <div className="flex justify-end mt-4 space-x-2">
        {!newAnswer ? (
          <button
            onClick={generateNewAnswer}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-blue-300"
            disabled={!editQuestion.trim() || isGeneratingAnswer} // Disable if textbox is empty or generating
          >
            Submit
          </button>
        ) : (
          <button
            onClick={acceptChanges}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Accept
          </button>
        )}
        <button
          onClick={closeEditModal}
          className="bg-gray-500 text-white px-4 py-2 rounded"
          disabled={isGeneratingAnswer} // Cancel button disabled during "Generating..."
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

{isViewEditedModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-gray-400 p-6 rounded-md w-96">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Edited View</h3>
        <button
          onClick={closeViewEditedModal}
          className="text-gray-500 hover:text-black text-3xl border border-gray-200 w-8 h-8 flex items-center justify-center"
        >
          ×
        </button>
      </div>
      <div className="mb-4">
        <h4 className="font-medium">Question</h4>
        <div className="p-2 border rounded-md bg-gray-50">
          <p>{viewEditedQuestion}</p>
        </div>
      </div>
      <div>
        <h4 className="font-medium">Answer</h4>
        <div className="p-2 border rounded-md bg-gray-50">
          <p>{viewEditedAnswer}</p>
        </div>
      </div>
    </div>
  </div>
)}

{isModalOpen && (
  <div className="fixed inset-0 z-50 flex justify-center items-center bg-gray-900 bg-opacity-50">
    <div className="relative w-full max-w-2xl max-h-[80vh] overflow-auto bg-white rounded-lg shadow-lg p-5">
      {/* Modal Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Conversation Timeline</h3>
        <button
          onClick={toggleModal}
          className="text-gray-400 hover:bg-gray-200 p-2 rounded-full"
        >
          <svg
            className="w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 14"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
            />
          </svg>
        </button>
      </div>

      {/* Modal Content */}
      <ol className="relative border-l border-gray-200 dark:border-gray-700 pl-6">
        {conversation.map((item, index) => (
          <li key={index} className="mb-6 ml-6">
            {/* Original Content */}
            <h3 className="text-2xl font-semibold text-gray-900">
              {item.question}
            </h3>
            <h2 className="text-xl text-gray-700 mt-2">{item.answer}</h2>

            {/* View Edited Button */}
            {!item.isExpanded && item.editedQuestion && (
              <button
                onClick={() => handleToggleExpand(index)}
                className="mt-2 inline-block text-blue-500 underline"
              >
                View edited
              </button>
            )}

            {/* Edited Content */}
            {item.isExpanded && (
              <div className="mt-4 pl-6 border-l border-green-500">
                <h3 className="text-2xl font-semibold text-gray-900">
                  {item.editedQuestion}
                </h3>
                <h2 className="text-xl text-gray-700 mt-2">
                  {item.editedAnswer}
                </h2>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  </div>
)}

    </div>
    
  );
  
};

export default Chat;

