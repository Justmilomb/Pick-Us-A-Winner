/**
 * Professional HTML Email Templates
 * All templates are responsive and compatible with major email clients
 */

const baseStyles = `
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      line-height: 1.6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      background: linear-gradient(135deg, #E1306C 0%, #C13584 50%, #833AB4 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .email-header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .email-body {
      padding: 40px 30px;
      color: #333333;
    }
    .email-body h2 {
      color: #E1306C;
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 20px;
      font-weight: 700;
    }
    .email-body p {
      font-size: 16px;
      color: #555555;
      margin-bottom: 16px;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background-color: #E1306C;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      background-color: #C13584;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #E1306C;
      padding: 20px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .info-box h3 {
      color: #E1306C;
      font-size: 18px;
      margin-top: 0;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .info-box ul {
      margin: 0;
      padding-left: 20px;
    }
    .info-box li {
      margin-bottom: 8px;
      color: #555555;
    }
    .winner-list {
      background-color: #fff5f7;
      border: 2px solid #E1306C;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }
    .winner-item {
      padding: 16px;
      background-color: #ffffff;
      border-radius: 6px;
      margin-bottom: 12px;
      border-left: 4px solid #E1306C;
    }
    .winner-item:last-child {
      margin-bottom: 0;
    }
    .winner-username {
      font-weight: 700;
      color: #E1306C;
      font-size: 18px;
      margin-bottom: 8px;
    }
    .winner-comment {
      color: #666666;
      font-style: italic;
      margin-top: 8px;
    }
    .email-footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .email-footer p {
      color: #888888;
      font-size: 14px;
      margin: 8px 0;
    }
    .email-footer a {
      color: #E1306C;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #e0e0e0;
      margin: 30px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-body {
        padding: 30px 20px;
      }
      .email-header {
        padding: 30px 15px;
      }
      .email-header h1 {
        font-size: 24px;
      }
      .email-body h2 {
        font-size: 20px;
      }
      .button {
        display: block;
        width: 100%;
        box-sizing: border-box;
      }
    }
  </style>
`;

export interface ScheduleEmailData {
  scheduledDate: string;
  accessLink: string;
  postUrl?: string;
}

export interface WinnerEmailData {
  username: string;
  comment?: string;
  prize?: string;
}

export interface ResultsEmailData {
  winners: Array<{
    username: string;
    comment?: string;
  }>;
  totalEntries: number;
  postUrl?: string;
}

/**
 * Schedule Confirmation Email Template
 */
export function getScheduleEmailHTML(data: ScheduleEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Giveaway Has Been Scheduled</title>
  ${baseStyles}
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>🎉 Giveaway Scheduled!</h1>
    </div>
    
    <div class="email-body">
      <h2>Your Giveaway is Ready</h2>
      <p>Great news! Your Instagram giveaway has been successfully scheduled and will run automatically.</p>
      
      <div class="info-box">
        <h3>📅 Scheduled Time</h3>
        <p style="font-size: 20px; font-weight: 700; color: #E1306C; margin: 0;">
          ${data.scheduledDate}
        </p>
      </div>
      
      <p>You can manage your giveaway, view its status, and make changes (up to 15 minutes before it runs) using your unique access link:</p>
      
      <div style="text-align: center;">
        <a href="${data.accessLink}" class="button">Manage My Giveaway</a>
      </div>
      
      <div class="info-box">
        <h3>📋 Important Information</h3>
        <ul>
          <li>You can edit or cancel your giveaway up to <strong>15 minutes</strong> before the scheduled time</li>
          <li>After that, the giveaway will be locked and will run automatically</li>
          <li>You'll receive another email with the results once winners are selected</li>
          <li>Keep your access link safe - you'll need it to manage your giveaway</li>
        </ul>
      </div>
      
      ${data.postUrl ? `
      <div class="divider"></div>
      <p style="font-size: 14px; color: #888888;">
        <strong>Instagram Post:</strong><br>
        <a href="${data.postUrl}" style="color: #E1306C; word-break: break-all;">${data.postUrl}</a>
      </p>
      ` : ''}
    </div>
    
    <div class="email-footer">
      <p><strong>PickUsAWinner</strong></p>
      <p>The fastest and fairest way to pick giveaway winners</p>
      <p>
        <a href="https://pickusawinner.com">Visit Website</a> | 
        <a href="https://pickusawinner.com/privacy">Privacy Policy</a>
      </p>
      <p style="font-size: 12px; color: #aaaaaa; margin-top: 20px;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Winner Notification Email Template
 */
export function getWinnerEmailHTML(data: WinnerEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Congratulations! You're a Winner!</title>
  ${baseStyles}
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>🎉 Congratulations!</h1>
    </div>
    
    <div class="email-body">
      <h2>You're a Winner!</h2>
      <p>Hi <strong>@${data.username}</strong>,</p>
      
      <p>We're thrilled to inform you that you've been selected as a winner in our Instagram giveaway!</p>
      
      ${data.comment ? `
      <div class="winner-list">
        <div class="winner-item">
          <div class="winner-username">Your Winning Comment</div>
          <div class="winner-comment">"${data.comment}"</div>
        </div>
      </div>
      ` : ''}
      
      ${data.prize ? `
      <div class="info-box">
        <h3>🏆 Your Prize</h3>
        <p style="font-size: 18px; font-weight: 600; color: #E1306C; margin: 0;">
          ${data.prize}
        </p>
      </div>
      ` : ''}
      
      <div class="info-box">
        <h3>📝 What Happens Next?</h3>
        <ul>
          <li>Share your win on your Instagram story using the winner image provided</li>
          <li>Tag us to spread the word and celebrate with your followers!</li>
          <li>We'll contact you soon with prize details and next steps</li>
        </ul>
      </div>
      
      <p>Thank you for participating in our giveaway! We appreciate your support.</p>
    </div>
    
    <div class="email-footer">
      <p><strong>PickUsAWinner</strong></p>
      <p>The fastest and fairest way to pick giveaway winners</p>
      <p>
        <a href="https://pickusawinner.com">Visit Website</a> | 
        <a href="https://pickusawinner.com/privacy">Privacy Policy</a>
      </p>
      <p style="font-size: 12px; color: #aaaaaa; margin-top: 20px;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Giveaway Results Email Template
 */
export function getResultsEmailHTML(data: ResultsEmailData): string {
  const winnersList = data.winners.map((winner, index) => `
    <div class="winner-item">
      <div class="winner-username">Winner #${index + 1}: @${winner.username}</div>
      ${winner.comment ? `<div class="winner-comment">"${winner.comment}"</div>` : ''}
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Giveaway Results Are Ready!</title>
  ${baseStyles}
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>🏆 Giveaway Complete!</h1>
    </div>
    
    <div class="email-body">
      <h2>Your Winners Have Been Selected</h2>
      <p>Your scheduled giveaway has completed successfully! Here are the results:</p>
      
      <div class="info-box">
        <h3>📊 Giveaway Statistics</h3>
        <p style="margin: 0;">
          <strong>Total Entries:</strong> ${data.totalEntries}<br>
          <strong>Winners Selected:</strong> ${data.winners.length}
        </p>
      </div>
      
      ${data.winners.length > 0 ? `
      <div class="winner-list">
        <h3 style="color: #E1306C; margin-top: 0; margin-bottom: 16px; font-size: 20px;">🎉 Winners</h3>
        ${winnersList}
      </div>
      ` : `
      <div class="info-box" style="border-left-color: #ff9800;">
        <h3 style="color: #ff9800;">⚠️ No Winners Found</h3>
        <p>Unfortunately, no participants matched your giveaway criteria. You may want to adjust your filters and try again.</p>
      </div>
      `}
      
      ${data.postUrl ? `
      <div class="divider"></div>
      <p style="font-size: 14px; color: #888888;">
        <strong>Instagram Post:</strong><br>
        <a href="${data.postUrl}" style="color: #E1306C; word-break: break-all;">${data.postUrl}</a>
      </p>
      ` : ''}
      
      <div class="info-box">
        <h3>💡 Next Steps</h3>
        <ul>
          <li>Contact the winners to arrange prize delivery</li>
          <li>Download winner images to share on your Instagram story</li>
          <li>Consider running another giveaway to keep your audience engaged!</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://pickusawinner.com/tool" class="button">Run Another Giveaway</a>
      </div>
    </div>
    
    <div class="email-footer">
      <p><strong>PickUsAWinner</strong></p>
      <p>The fastest and fairest way to pick giveaway winners</p>
      <p>
        <a href="https://pickusawinner.com">Visit Website</a> | 
        <a href="https://pickusawinner.com/privacy">Privacy Policy</a>
      </p>
      <p style="font-size: 12px; color: #aaaaaa; margin-top: 20px;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Get plain text version for email clients that don't support HTML
 */
export function getScheduleEmailText(data: ScheduleEmailData): string {
  return `
🎉 Your Giveaway Has Been Scheduled! 🎉

Your Instagram giveaway has been successfully scheduled and will run automatically.

📅 Scheduled Time: ${data.scheduledDate}

Manage Your Giveaway:
${data.accessLink}

You can use this link to:
- Edit your giveaway settings (up to 15 minutes before scheduled time)
- View the countdown timer
- Cancel the giveaway if needed
- Access results once the giveaway completes

Important Notes:
- You can edit or cancel your giveaway up to 15 minutes before the scheduled time
- After that, the giveaway will be locked and will run automatically
- You'll receive another email with the results once winners are selected
- Keep your access link safe - you'll need it to manage your giveaway

${data.postUrl ? `Instagram Post: ${data.postUrl}` : ''}

Best regards,
PickUsAWinner Team

---
Visit us at: https://pickusawinner.com
  `.trim();
}

export function getWinnerEmailText(data: WinnerEmailData): string {
  return `
🎉 Congratulations! You're a Winner! 🎉

Hi @${data.username},

We're thrilled to inform you that you've been selected as a winner in our Instagram giveaway!

${data.comment ? `Your winning comment: "${data.comment}"` : ''}

${data.prize ? `Your Prize: ${data.prize}` : ''}

What happens next?
- Share your win on your Instagram story using the winner image provided
- Tag us to spread the word!
- We'll contact you soon with prize details and next steps

Thank you for participating in our giveaway!

Best regards,
PickUsAWinner Team

---
Visit us at: https://pickusawinner.com
  `.trim();
}

export function getResultsEmailText(data: ResultsEmailData): string {
  const winnersText = data.winners.length > 0
    ? data.winners.map((w, i) => `Winner #${i + 1}: @${w.username}${w.comment ? ` - "${w.comment}"` : ''}`).join('\n')
    : 'No winners found matching your criteria.';

  return `
🏆 Your Giveaway Results Are Ready! 🏆

Your scheduled giveaway has completed successfully!

📊 Statistics:
- Total Entries: ${data.totalEntries}
- Winners Selected: ${data.winners.length}

🎉 Winners:
${winnersText}

${data.postUrl ? `Instagram Post: ${data.postUrl}` : ''}

Next Steps:
- Contact the winners to arrange prize delivery
- Download winner images to share on your Instagram story
- Consider running another giveaway!

Best regards,
PickUsAWinner Team

---
Visit us at: https://pickusawinner.com
  `.trim();
}

// ============================================
// SCRAPER OFFLINE EMAIL TEMPLATES
// ============================================

export interface ScraperOfflineScheduledEmailData {
  scheduledDate: string;
  accessLink: string;
  postUrl?: string;
}

export interface ScraperOfflineUserEmailData {
  scheduledDate: string;
  accessLink: string;
  postUrl?: string;
}

export interface ScraperOfflineAdminEmailData {
  affectedGiveaways: Array<{ id: string; scheduledFor: string; contactEmail: string }>;
}

/**
 * Sent to user when they schedule while the scraper worker is offline.
 * Subject: "Your Giveaway Is Queued — We're On It"
 */
export function getScraperOfflineScheduledEmailHTML(data: ScraperOfflineScheduledEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Giveaway Is Queued</title>
  ${baseStyles}
</head>
<body>
  <div class="email-container">
    <div class="email-header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
      <h1>Your Giveaway Is Queued</h1>
    </div>

    <div class="email-body">
      <h2 style="color: #d97706;">Payment Confirmed — We're On It</h2>
      <p>Your payment went through and your giveaway has been safely queued.</p>

      <div class="info-box" style="border-left-color: #f59e0b;">
        <h3 style="color: #d97706;">📅 Scheduled Time</h3>
        <p style="font-size: 20px; font-weight: 700; color: #d97706; margin: 0;">
          ${data.scheduledDate}
        </p>
      </div>

      <p>Our scraper service is temporarily offline, but <strong>your giveaway is safely stored</strong> and will run automatically as soon as the service is restored. No action is needed from you.</p>

      <div class="info-box" style="border-left-color: #f59e0b; background-color: #fffbeb;">
        <h3 style="color: #d97706;">⚡ What Happens Next</h3>
        <ul>
          <li>Our team has been alerted and is working to restore the service</li>
          <li>Your giveaway will run automatically once the service is back online</li>
          <li>If the service is not restored in time, we will offer a <strong>full refund or reschedule</strong> at no extra charge</li>
          <li>You can manage your giveaway using your access link below</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="${data.accessLink}" class="button" style="background-color: #d97706;">Manage My Giveaway</a>
      </div>

      ${data.postUrl ? `
      <div class="divider"></div>
      <p style="font-size: 14px; color: #888888;">
        <strong>Instagram Post:</strong><br>
        <a href="${data.postUrl}" style="color: #d97706; word-break: break-all;">${data.postUrl}</a>
      </p>
      ` : ''}
    </div>

    <div class="email-footer">
      <p><strong>PickUsAWinner</strong></p>
      <p>The fastest and fairest way to pick giveaway winners</p>
      <p>
        <a href="https://pickusawinner.com">Visit Website</a> |
        <a href="https://pickusawinner.com/privacy">Privacy Policy</a>
      </p>
      <p style="font-size: 12px; color: #aaaaaa; margin-top: 20px;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getScraperOfflineScheduledEmailText(data: ScraperOfflineScheduledEmailData): string {
  return `
Your Giveaway Is Queued — We're On It

Your payment went through and your giveaway has been safely queued.

Scheduled Time: ${data.scheduledDate}

Our scraper service is temporarily offline, but your giveaway is safely stored and will run automatically as soon as the service is restored. No action is needed from you.

What Happens Next:
- Our team has been alerted and is working to restore the service
- Your giveaway will run automatically once the service is back online
- If the service is not restored in time, we will offer a full refund or reschedule at no extra charge

Manage your giveaway:
${data.accessLink}

${data.postUrl ? `Instagram Post: ${data.postUrl}` : ''}

Best regards,
PickUsAWinner Team

---
Visit us at: https://pickusawinner.com
  `.trim();
}

/**
 * Sent to user when the scraper has been offline for a while and their giveaway is < 30 min away.
 * Subject: "⚠️ Update on Your Giveaway — Temporary Outage"
 */
export function getScraperOfflineUserEmailHTML(data: ScraperOfflineUserEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Update on Your Giveaway</title>
  ${baseStyles}
</head>
<body>
  <div class="email-container">
    <div class="email-header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
      <h1>⚠️ Update on Your Giveaway</h1>
    </div>

    <div class="email-body">
      <h2 style="color: #d97706;">Temporary Service Outage</h2>
      <p>We wanted to give you a heads-up about your upcoming giveaway.</p>

      <div class="info-box" style="border-left-color: #f59e0b;">
        <h3 style="color: #d97706;">📅 Your Scheduled Time</h3>
        <p style="font-size: 20px; font-weight: 700; color: #d97706; margin: 0;">
          ${data.scheduledDate}
        </p>
      </div>

      <p>We're currently experiencing a temporary outage with our scraper service. Your giveaway is safely queued and <strong>we are actively working to restore the service</strong>.</p>

      <div class="info-box" style="border-left-color: #f59e0b; background-color: #fffbeb;">
        <h3 style="color: #d97706;">What This Means for You</h3>
        <ul>
          <li>Your giveaway may run slightly later than scheduled</li>
          <li>If the service cannot be restored in time, we will <strong>offer a full refund or reschedule at no charge</strong></li>
          <li>You will receive results via email as soon as your giveaway completes</li>
          <li>No action is required from you right now</li>
        </ul>
      </div>

      <p>We sincerely apologise for any inconvenience. You can check on your giveaway status at any time using your access link:</p>

      <div style="text-align: center;">
        <a href="${data.accessLink}" class="button" style="background-color: #d97706;">View Giveaway Status</a>
      </div>

      ${data.postUrl ? `
      <div class="divider"></div>
      <p style="font-size: 14px; color: #888888;">
        <strong>Instagram Post:</strong><br>
        <a href="${data.postUrl}" style="color: #d97706; word-break: break-all;">${data.postUrl}</a>
      </p>
      ` : ''}
    </div>

    <div class="email-footer">
      <p><strong>PickUsAWinner</strong></p>
      <p>The fastest and fairest way to pick giveaway winners</p>
      <p>
        <a href="https://pickusawinner.com">Visit Website</a> |
        <a href="https://pickusawinner.com/privacy">Privacy Policy</a>
      </p>
      <p style="font-size: 12px; color: #aaaaaa; margin-top: 20px;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getScraperOfflineUserEmailText(data: ScraperOfflineUserEmailData): string {
  return `
⚠️ Update on Your Giveaway — Temporary Outage

We wanted to give you a heads-up about your upcoming giveaway.

Your Scheduled Time: ${data.scheduledDate}

We're currently experiencing a temporary outage with our scraper service. Your giveaway is safely queued and we are actively working to restore the service.

What This Means for You:
- Your giveaway may run slightly later than scheduled
- If the service cannot be restored in time, we will offer a full refund or reschedule at no charge
- You will receive results via email as soon as your giveaway completes
- No action is required from you right now

View your giveaway status:
${data.accessLink}

${data.postUrl ? `Instagram Post: ${data.postUrl}` : ''}

We sincerely apologise for any inconvenience.

Best regards,
PickUsAWinner Team

---
Visit us at: https://pickusawinner.com
  `.trim();
}

/**
 * Sent to admin (ADMIN_ALERT_EMAIL) when scraper is offline and giveaways are within 30 min.
 * Subject: "🚨 URGENT: Scraper Offline — [N] Giveaways Affected"
 */
export function getScraperOfflineAdminEmailHTML(data: ScraperOfflineAdminEmailData): string {
  const rows = data.affectedGiveaways.map(g => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; font-family: monospace; font-size: 13px;">${g.id}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0;">${g.scheduledFor}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0;">${g.contactEmail}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>URGENT: Scraper Offline Alert</title>
  ${baseStyles}
</head>
<body>
  <div class="email-container">
    <div class="email-header" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">
      <h1>🚨 Scraper Offline Alert</h1>
    </div>

    <div class="email-body">
      <h2 style="color: #dc2626;">URGENT: ${data.affectedGiveaways.length} Giveaway${data.affectedGiveaways.length > 1 ? 's' : ''} Affected</h2>
      <p>The scraper worker is <strong>offline</strong> and the following giveaways are scheduled within the next 30 minutes. User notification emails have been sent.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <thead>
          <tr style="background-color: #fee2e2;">
            <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #dc2626;">Giveaway ID</th>
            <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #dc2626;">Scheduled For</th>
            <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #dc2626;">Contact Email</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="info-box" style="border-left-color: #dc2626; background-color: #fef2f2;">
        <h3 style="color: #dc2626;">Immediate Action Required</h3>
        <ul>
          <li>Reconnect the scraper worker immediately</li>
          <li>On reconnect, pending jobs will be automatically re-queued</li>
          <li>If jobs cannot run in time, contact affected users to arrange refunds or rescheduling</li>
        </ul>
      </div>
    </div>

    <div class="email-footer">
      <p><strong>PickUsAWinner — Internal Alert</strong></p>
      <p style="font-size: 12px; color: #aaaaaa;">This is an automated system alert.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getScraperOfflineAdminEmailText(data: ScraperOfflineAdminEmailData): string {
  const rows = data.affectedGiveaways
    .map(g => `  - ${g.id} | ${g.scheduledFor} | ${g.contactEmail}`)
    .join('\n');

  return `
🚨 URGENT: Scraper Offline — ${data.affectedGiveaways.length} Giveaway${data.affectedGiveaways.length > 1 ? 's' : ''} Affected

The scraper worker is OFFLINE and the following giveaways are scheduled within the next 30 minutes. User notification emails have been sent.

Affected Giveaways:
${rows}

Immediate Action Required:
- Reconnect the scraper worker immediately
- On reconnect, pending jobs will be automatically re-queued
- If jobs cannot run in time, contact affected users to arrange refunds or rescheduling

---
PickUsAWinner — Internal Alert
  `.trim();
}

// ============================================
// CONTACT FORM EMAIL TEMPLATES
// ============================================

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Contact Received - sent to support@pickusawinner.com
 */
export function getContactReceivedHTML(data: ContactFormData): string {
  const safeMessage = escapeHtml(data.message).replace(/\n/g, "<br>");
  const safeSubject = escapeHtml(data.subject);
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
  ${baseStyles}
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>New Contact Form Submission</h1>
    </div>

    <div class="email-body">
      <h2>Message from PickUsAWinner Contact Form</h2>

      <div class="info-box">
        <h3>Sender Details</h3>
        <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${safeName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Email:</strong> <a href="mailto:${safeEmail}" style="color: #E1306C;">${safeEmail}</a></p>
        <p style="margin: 0;"><strong>Submitted:</strong> ${escapeHtml(data.timestamp)}</p>
      </div>

      <div class="info-box">
        <h3>Subject</h3>
        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">${safeSubject}</p>
      </div>

      <h3 style="color: #E1306C; font-size: 18px; margin-top: 24px; margin-bottom: 12px;">Message</h3>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #E1306C; white-space: pre-wrap;">${safeMessage}</div>

      <p style="font-size: 14px; color: #888888; margin-top: 24px;">
        Reply directly to this email to respond to ${safeName}. The Reply-To header is set to the sender's address.
      </p>
    </div>

    <div class="email-footer">
      <p><strong>PickUsAWinner</strong></p>
      <p>Contact form submission from pickusawinner.com</p>
      <p>
        <a href="https://pickusawinner.com">Visit Website</a> |
        <a href="https://pickusawinner.com/contact">Contact Page</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Contact Auto-Reply - sent to the user who submitted the form
 */
export function getContactAutoReplyHTML(data: { name: string }): string {
  const safeName = escapeHtml(data.name);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We Received Your Message</title>
  ${baseStyles}
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>Thanks for Reaching Out!</h1>
    </div>

    <div class="email-body">
      <h2>We Got Your Message</h2>
      <p>Hi ${safeName},</p>

      <p>Thank you for contacting PickUsAWinner. We've received your message and our team will get back to you as soon as possible.</p>

      <div class="info-box">
        <h3>What to Expect</h3>
        <ul>
          <li>We typically respond within <strong>24–48 hours</strong> during business days</li>
          <li>For urgent matters, you can reach us at <a href="mailto:support@pickusawinner.com" style="color: #E1306C;">support@pickusawinner.com</a></li>
          <li>Check your spam folder if you don't see our reply</li>
        </ul>
      </div>

      <p>In the meantime, feel free to explore our free Instagram giveaway picker:</p>

      <div style="text-align: center;">
        <a href="https://pickusawinner.com/tool" class="button">Launch Giveaway Tool</a>
      </div>
    </div>

    <div class="email-footer">
      <p><strong>PickUsAWinner</strong></p>
      <p>The fastest and fairest way to pick giveaway winners</p>
      <p>
        <a href="https://pickusawinner.com">Visit Website</a> |
        <a href="https://pickusawinner.com/privacy">Privacy Policy</a>
      </p>
      <p style="font-size: 12px; color: #aaaaaa; margin-top: 20px;">
        This is an automated confirmation. Please do not reply to this message.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getContactReceivedText(data: ContactFormData): string {
  return `
New Contact Form Submission - PickUsAWinner

Sender Details:
- Name: ${data.name}
- Email: ${data.email}
- Submitted: ${data.timestamp}

Subject: ${data.subject}

Message:
${data.message}

---
Reply to this email to respond to the sender.
  `.trim();
}

export function getContactAutoReplyText(data: { name: string }): string {
  return `
Thanks for Reaching Out! - PickUsAWinner

Hi ${data.name},

Thank you for contacting PickUsAWinner. We've received your message and our team will get back to you as soon as possible.

What to Expect:
- We typically respond within 24–48 hours during business days
- For urgent matters: support@pickusawinner.com
- Check your spam folder if you don't see our reply

In the meantime, try our free Instagram giveaway picker:
https://pickusawinner.com/tool

Best regards,
PickUsAWinner Team

---
Visit us at: https://pickusawinner.com
  `.trim();
}
