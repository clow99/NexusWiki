import { Resend } from "resend";

import { getBaseEnv, getResendEnv } from "@/lib/env";

const resendEnv = getResendEnv();
const resend = new Resend(resendEnv.RESEND_API_KEY);

function getAppUrl() {
  return getBaseEnv().NEXTAUTH_URL;
}

export async function sendInviteEmail(params: {
  email: string;
  organizationName: string;
  role: string;
  token: string;
  code: string;
}) {
  const inviteLink = `${getAppUrl()}/invite?token=${params.token}`;
  const html = `
    <p>You have been invited to join <strong>${params.organizationName}</strong> as <strong>${params.role}</strong>.</p>
    <p>Accept the invite via this link:</p>
    <p><a href="${inviteLink}">${inviteLink}</a></p>
    <p>Or enter this invite code during sign-in:</p>
    <p><strong>${params.code}</strong></p>
    <p>This invitation expires in 7 days.</p>
  `;

  await resend.emails.send({
    from: resendEnv.RESEND_FROM_EMAIL,
    to: params.email,
    subject: `Invite to ${params.organizationName}`,
    html,
  });
}
