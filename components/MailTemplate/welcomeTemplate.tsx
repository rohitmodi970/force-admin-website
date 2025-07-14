import { UserEmailData } from "@/utilities/mailService";

export default function WelcomeTemplate({ user }: { user: UserEmailData }) {
    console.log('Generating welcome template for user:', user);
  return (`
     <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #2d3748;
          margin: 0;
          padding: 20px 0;
          line-height: 1.6;
        }
        .container {
          background: #ffffff;
          max-width: 640px;
          margin: 0 auto;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          text-align: center;
          padding: 48px 32px 40px;
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.15"/><circle cx="20" cy="80" r="0.5" fill="white" opacity="0.15"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        }
        .logo {
          max-width: 140px;
          margin: 0 auto 20px;
          display: block;
          filter: brightness(0) invert(1);
        }
        .header h1 {
          margin: 0;
          font-size: 2.2rem;
          font-weight: 700;
          letter-spacing: -0.025em;
          position: relative;
          z-index: 1;
        }
        .header p {
          margin: 8px 0 0 0;
          font-size: 1.1rem;
          opacity: 0.9;
          font-weight: 400;
          position: relative;
          z-index: 1;
        }
        .content {
          padding: 40px 32px;
        }
        .access-granted {
          background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%);
          border: 2px solid #22c55e;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          margin-bottom: 32px;
          position: relative;
          overflow: hidden;
        }
        .access-granted::before {
          content: '✨';
          position: absolute;
          top: 12px;
          right: 12px;
          font-size: 1.5rem;
          animation: sparkle 2s ease-in-out infinite;
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .access-granted h2 {
          color: #16a34a;
          margin: 0 0 8px 0;
          font-size: 1.5rem;
          font-weight: 600;
        }
        .access-granted p {
          color: #166534;
          margin: 0;
          font-size: 1.05rem;
        }
        .greeting {
          font-size: 1.2rem;
          color: #1f2937;
          margin-bottom: 24px;
          font-weight: 500;
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin: 32px 0;
        }
        .feature-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
        .feature-card h3 {
          color: #4f46e5;
          margin: 0 0 12px 0;
          font-size: 1.1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .feature-card p {
          color: #64748b;
          margin: 0;
          font-size: 0.95rem;
        }
        .cta-section {
          text-align: center;
          margin: 40px 0 32px 0;
          padding: 32px;
          background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
          border-radius: 12px;
          border: 1px solid #f59e0b;
        }
        .cta-section h3 {
          color: #92400e;
          margin: 0 0 16px 0;
          font-size: 1.3rem;
          font-weight: 600;
        }
        .cta-section p {
          color: #a16207;
          margin: 0 0 24px 0;
          font-size: 1.05rem;
        }
        .login-button {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          border: none;
          color: white;
          padding: 16px 32px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
          cursor: pointer;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
          transition: all 0.2s ease;
          letter-spacing: 0.025em;
        }
        .login-button:hover {
          background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
        }
        .next-steps {
          background: #f8fafc;
          border-radius: 12px;
          padding: 24px;
          margin: 32px 0;
        }
        .next-steps h3 {
          color: #1f2937;
          margin: 0 0 16px 0;
          font-size: 1.2rem;
          font-weight: 600;
        }
        .steps-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .steps-list li {
          margin: 0 0 12px 0;
          padding-left: 32px;
          position: relative;
          font-size: 1rem;
          color: #4b5563;
        }
        .steps-list li:before {
          content: "→";
          color: #4f46e5;
          font-weight: bold;
          position: absolute;
          left: 0;
          font-size: 1.2rem;
        }
        .footer {
          background: #f8fafc;
          padding: 32px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 0 0 8px 0;
          font-size: 0.9rem;
          color: #64748b;
        }
        .footer .email-info {
          color: #4f46e5;
          font-weight: 500;
        }
        .divider {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 32px 0;
        }
        @media (max-width: 640px) {
          .container {
            margin: 0 16px;
            border-radius: 12px;
          }
          .header {
            padding: 32px 24px 28px;
          }
          .header h1 {
            font-size: 1.8rem;
          }
          .content {
            padding: 32px 24px;
          }
          .feature-grid {
            grid-template-columns: 1fr;
          }
          .cta-section {
            padding: 24px;
          }
          .footer {
            padding: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://www.findmyforce.com/Logo2.png" alt="Force Journal Logo" class="logo" />
          <h1>Access Granted!</h1>
          <p>Welcome to your Force Journal</p>
        </div>
        
        <div class="content">
          <div class="access-granted">
            <h2>🎉 Congratulations, ${user.name || 'there'}!</h2>
            <p>Your application has been approved and you now have full access to Force Journal.</p>
          </div>
          
          <p class="greeting">
            We're thrilled to have you join our community of mindful journalers and self-improvement enthusiasts. Your Force Journal is now ready to help you track your thoughts, goals, and personal growth journey.
          </p>
          
          <div class="feature-grid">
            <div class="feature-card">
              <h3>📝 Smart Journaling</h3>
              <p>AI-powered prompts and insights to help you reflect deeper and discover patterns in your thoughts and emotions.</p>
            </div>
            <div class="feature-card">
              <h3>📊 Progress Tracking</h3>
              <p>Visualize your growth over time with comprehensive analytics and mood tracking features.</p>
            </div>
            <div class="feature-card">
              <h3>🎯 Goal Setting</h3>
              <p>Set meaningful goals and track your progress with our intelligent goal management system.</p>
            </div>
            <div class="feature-card">
              <h3>🔒 Privacy First</h3>
              <p>Your thoughts are sacred. All entries are encrypted and completely private to you.</p>
            </div>
          </div>
          
          <div class="cta-section">
            <h3>Ready to Start Your Journey?</h3>
            <p>Click below to login and begin your first journal entry.</p>
            <a href="https://www.findmyforce.com/login" class="login-button">Login to Force Journal</a>
          </div>
          
          <div class="next-steps">
            <h3>What to do next:</h3>
            <ul class="steps-list">
              <li>Complete your profile setup to personalize your experience</li>
              <li>Explore our guided journal templates to get started</li>
              <li>Set up your first personal goals and milestones</li>
              <li>Enable notifications to build a consistent journaling habit</li>
              <li>Join our community discussions to connect with like-minded journalers</li>
            </ul>
          </div>
          
          <hr class="divider"/>
          
          <p style="font-size:1rem;color:#4b5563;margin:0 0 16px 0;">
            Need help getting started? Our support team is here to guide you every step of the way. Simply reply to this email or reach out through the app.
          </p>
          
          <p style="margin:0;color:#1f2937;font-weight:500;">
            Welcome to your transformation journey,<br>
            <strong>The Force Journal Team</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Force Journal. All rights reserved.</p>
          <p>This email was sent to <span class="email-info">${user.email}</span></p>
          <p>Visit us at <a href="https://www.findmyforce.com" style="color:#4f46e5;text-decoration:none;">www.findmyforce.com</a></p>
        </div>
      </div>
    </body>
    </html>`
  );
}