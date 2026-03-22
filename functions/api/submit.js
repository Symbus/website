/**
 * POST /api/submit
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const username = formData.get('username')?.trim();
    const botField = formData.get('bot-field');

    // Honeypot spam check
    if (botField) {
      return new Response("Bot detected", { status: 400 });
    }

    // Basic length validation (optional, also handled client-side)
    if (!username || username.length < 3 || username.length > 16) {
      return new Response("Username must be 3–16 characters", { status: 400 });
    }

    // Validate Minecraft username via Ashcon API
    const res = await fetch(`https://api.ashcon.app/mojang/v2/user/${username}`);
    if (!res.ok) {
      return new Response("Invalid Minecraft username", { status: 400 });
    }

    // Store in KV namespace
    // Key uses timestamp to prevent collisions
    await env.WHITELIST_KV.put(`user-${Date.now()}`, username);

    // Redirect to success page
    return Response.redirect('/success.html', 302);
  } catch (err) {
    console.error(err);
    return new Response("Error checking username. Try again.", { status: 500 });
  }
}