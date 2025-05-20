
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContractEmailRequest {
  recipientName: string;
  recipientEmail: string;
  contractName: string;
  contractUrl: string;
  message?: string;
  senderName: string;
  subject?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientName, recipientEmail, contractName, contractUrl, message, senderName, subject }: ContractEmailRequest = await req.json();

    if (!recipientEmail) {
      throw new Error('Recipient email is required');
    }

    // Validate the Resend API key
    if (!Deno.env.get("RESEND_API_KEY")) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error('Email service is not properly configured');
    }

    const emailSubject = subject || `Contract for Review: ${contractName}`;
    
    console.log(`Sending email to ${recipientEmail} about contract: ${contractName}`);
    console.log(`From: Contracts <onboarding@resend.dev>`);
    console.log(`Subject: ${emailSubject}`);

    const emailResponse = await resend.emails.send({
      from: "Contracts <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Contract for Your Review</h2>
          <p>Hello ${recipientName},</p>
          <p>${senderName} has shared a contract with you that requires your attention.</p>
          <p><strong>Contract Name:</strong> ${contractName}</p>
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
          <p>You can view and sign the contract by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${contractUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">View Contract</a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p>${contractUrl}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #777; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contract function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
