import { redirect } from 'next/navigation';

/**
 * Root Page — Redirect to new conversation
 *
 * The home route "/" has no UI of its own. It redirects to the main chat
 * interface. This mirrors ChatGPT's pattern where the root URL immediately
 * drops the user into the chat experience.
 *
 * Future: When authentication is added, this page will check session state
 * and redirect to /login if unauthenticated, or /chat if authenticated.
 */
export default function HomePage() {
  redirect('/chat');
}
