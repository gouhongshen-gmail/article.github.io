export async function sendMagicCodeEmail(env, payload) {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  if (!env.RESEND_FROM_EMAIL) {
    throw new Error('RESEND_FROM_EMAIL is not configured.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method : 'POST',
    headers: {
      Authorization : `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from   : env.RESEND_FROM_EMAIL,
      html   : `
        <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6">
          <h2>Your ChronoSina sign-in code</h2>
          <p>Use the verification code below within 15 minutes:</p>
          <p style="font-size:32px;font-weight:700;letter-spacing:0.4em">${payload.code}</p>
          <p>If you did not request this code, you can safely ignore this email.</p>
        </div>
      `,
      subject: 'Your ChronoSina sign-in code',
      to     : [payload.email]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send magic code email: ${errorText}`);
  }

  return response.json();
}
