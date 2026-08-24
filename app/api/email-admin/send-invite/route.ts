import { POST as sendEmailAdminInvites } from "@/app/api/email-admin/invites/send/route";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return sendEmailAdminInvites(request);
}
