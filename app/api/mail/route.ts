import { NextResponse } from "next/server";
import { transporter } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { to, businessName } = await req.json();

    if (!to || !businessName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Digital Growth Opportunity</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hello ${businessName} Team,</h2>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            I hope this email finds you well. I came across your business and was impressed by what you're doing in your community.
          </p>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            I specialize in helping local businesses like yours establish a stronger online presence and reach more customers through digital marketing strategies.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="color: #333; margin-top: 0;">What I can help you with:</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li>Professional website development</li>
              <li>Local SEO optimization</li>
              <li>Social media marketing</li>
              <li>Online reputation management</li>
            </ul>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            I'd love to schedule a brief 15-minute call to discuss how we can help ${businessName} grow and reach more customers online.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${process.env.MAIL_USER}?subject=Interested in Digital Marketing Services" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Schedule a Call
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            Best regards,<br>
            Your Digital Marketing Partner
          </p>
        </div>
      </div>
    `;

    const textContent = `
Hello ${businessName} Team,

I hope this email finds you well. I came across your business and was impressed by what you're doing in your community.

I specialize in helping local businesses like yours establish a stronger online presence and reach more customers through digital marketing strategies.

What I can help you with:
- Professional website development
- Local SEO optimization  
- Social media marketing
- Online reputation management

I'd love to schedule a brief 15-minute call to discuss how we can help ${businessName} grow and reach more customers online.

Please reply to this email if you're interested in learning more.

Best regards,
Your Digital Marketing Partner
    `;

    await transporter.sendMail({
      from: `"Digital Marketing Partner" <${process.env.MAIL_USER}>`,
      to,
      subject: `Help ${businessName} Grow Online - Quick 15-min Call?`,
      text: textContent,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
