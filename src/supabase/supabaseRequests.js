import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

// Function to add a new conversation
export const addConversation = async (
  userId,
  initialQuestion,
  initialAnswer
) => {
  const { data, error } = await supabase.from("conversations").insert({
    user_id: userId,
    title: initialQuestion.slice(0, 20), // Shortened version of question for the sidebar title
  });

  if (error) {
    console.error("Error creating conversation:", error);
    return null;
  }

  const conversationId = data[0].id;

  // Add initial question and answer to the conversation
  const { error: messageError } = await supabase.from("messages").insert([
    {
      conversation_id: conversationId,
      user_id: userId,
      content: initialQuestion,
      role: "user",
      version: 1,
    },
    {
      conversation_id: conversationId,
      user_id: userId,
      content: initialAnswer,
      role: "assistant",
      version: 1,
    },
  ]);

  if (messageError) {
    console.error("Error adding messages:", messageError);
    return null;
  }

  console.log("Conversation created with initial messages.");
  return conversationId;
};

// Function to retrieve all conversations for a user
export const getConversations = async (userId) => {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }

  return data;
};

// Function to add a message (question or answer) to an existing conversation
export const addMessageToConversation = async (
  conversationId,
  userId,
  content,
  role
) => {
  const { data, error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    user_id: userId,
    content: content,
    role: role,
    version: 1, // Initial version
  });

  if (error) {
    console.error("Error adding message to conversation:", error);
    return null;
  }

  console.log("Message added to conversation:", data);
  return data;
};

// Function to edit a message and preserve history
export const editMessage = async (messageId, newContent, userId, role) => {
  // Fetch the current version of the message
  const { data, error } = await supabase
    .from("messages")
    .select("version")
    .eq("id", messageId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching message version:", error);
    return null;
  }

  const newVersion = data.version + 1;

  // Insert the edited message as a new version
  const { data: newMessage, error: insertError } = await supabase
    .from("messages")
    .insert({
      conversation_id: data.conversation_id,
      user_id: userId,
      content: newContent,
      role: role,
      version: newVersion,
    });

  if (insertError) {
    console.error("Error inserting edited message:", insertError);
    return null;
  }

  console.log("Message edited and new version added:", newMessage);
  return newMessage;
};
