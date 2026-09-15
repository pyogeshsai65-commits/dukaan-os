import { supabase } from './supabaseClient';

export async function sendAIMessage(
  message,
  context = {},
) {
  const trimmedMessage = String(
    message ?? '',
  ).trim();

  if (!trimmedMessage) {
    throw new Error(
      'Message cannot be empty.',
    );
  }

  if (!supabase) {
    throw new Error(
      'Supabase is not configured.',
    );
  }

  const { data, error } =
    await supabase.functions.invoke(
      'gemini-chat',
      {
        body: {
          message: trimmedMessage,
          context,
        },
      },
    );

  if (error) {
    console.error(
      'AI function error:',
      error,
    );

    throw new Error(
      error.message ||
        'Unable to connect to the AI assistant.',
    );
  }

  if (!data?.text) {
    console.error(
      'AI returned unexpected response:',
      data,
    );

    throw new Error(
      'The AI assistant returned an empty response.',
    );
  }

  return {
    text: data.text,
    model:
      data.model ||
      'gemini-3.5-flash',
  };
}