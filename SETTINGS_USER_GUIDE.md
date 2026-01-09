# Admin Settings - User Guide

This guide explains how to use all the new settings features in the admin panel.

## Accessing Settings

Navigate to **Admin Panel → Settings** to access all configuration options.

## 1. Logo & Branding

### Upload a Logo
1. Click on the file input under "Site Logo"
2. Select an image file (PNG, JPG, GIF, or WebP)
3. Maximum file size: 5MB
4. The logo will be uploaded and displayed immediately
5. Click "Save Changes" at the bottom to persist

### Remove a Logo
1. Click the "Remove Logo" button next to the logo preview
2. Click "Save Changes" to confirm removal

## 2. Email Server Configuration

### Configure SMTP Settings
1. Enter your SMTP host (e.g., smtp.gmail.com)
2. Enter SMTP port (typically 587 for TLS or 465 for SSL)
3. Enter your SMTP username (usually your email)
4. Enter your SMTP password
   - Click the eye icon to show/hide password
5. Enter the "From" email address for outgoing emails
6. (Optional) Enter a "From" name for outgoing emails
7. Click "Send Test Email" to verify configuration
8. Click "Save Changes" to persist settings

### Test Email Configuration
- Click "Send Test Email" button
- A test email will be sent to your support email address
- Check for success/error toast notification

## 3. API Key Management

### View Existing Keys
- All configured API keys are displayed with their labels
- Keys are truncated for security (showing first 20 characters)
- Creation timestamp is stored for each key

### Add a New API Key
1. Scroll to "Add New API Key" section
2. Enter a descriptive label (e.g., "Stripe API", "SendGrid Key")
3. Enter the actual API key value
4. Click "Add API Key"
5. The key will appear in the list above
6. Click "Save Changes" to persist

### Remove an API Key
1. Find the key in the list
2. Click the trash icon button
3. The key is removed immediately
4. Click "Save Changes" to persist

## 4. Webhook Configuration

### Configure Webhooks for Events
Four event types are available:
- **Order Created**: Triggered when a new order is placed
- **Order Shipped**: Triggered when an order is marked as shipped
- **Order Delivered**: Triggered when an order is delivered
- **User Registered**: Triggered when a new user signs up

### Set Up a Webhook
1. Enter the webhook URL for each event you want to monitor
2. Format: `https://your-domain.com/webhooks/event-name`
3. Click "Test" button to verify the webhook endpoint
4. Check for success/error notification
5. Click "Save Changes" to persist all webhook URLs

### Test Individual Webhooks
- Click the "Test" button next to any webhook URL
- A test payload will be sent to the endpoint
- Loading spinner shows while testing
- Toast notification shows result

## 5. Security Settings

### Enable Two-Factor Authentication (2FA)
1. Toggle the 2FA switch to ON
2. This will require 2FA for all admin accounts
3. Click "Save Changes" to enforce

### Configure IP Whitelist
1. Enter IP addresses in the textarea (one per line)
2. Example format:
   ```
   192.168.1.1
   10.0.0.1
   203.0.113.42
   ```
3. Leave empty to allow all IP addresses
4. Click "Save Changes" to apply whitelist

### Set Session Timeout
1. Enter timeout value in minutes
2. Valid range: 5-1440 minutes (5 min - 24 hours)
3. Default: 30 minutes
4. Users will be logged out after this period of inactivity
5. Click "Save Changes" to apply

### Set Password Change Interval
1. Enter interval in days
2. Valid range: 0-365 days
3. Default: 90 days
4. 0 = passwords never expire
5. Users will be prompted to change password after this many days
6. Click "Save Changes" to apply

## Saving Changes

**Important:** All settings changes must be saved by clicking the "Save Changes" button at the bottom of the page.

- The button shows a loading spinner while saving
- Success notification appears when saved
- Error notification appears if save fails

## Tips & Best Practices

### Logo Upload
- Use PNG format with transparent background for best results
- SVG files provide the best quality at any size
- Keep file size under 2MB for faster loading

### Email Configuration
- Use app-specific passwords for Gmail/Google Workspace
- Test configuration before relying on it for critical emails
- Store SMTP credentials securely

### API Keys
- Use descriptive labels to identify keys easily
- Rotate keys regularly for security
- Remove unused keys promptly

### Webhooks
- Always test webhooks after configuration
- Use HTTPS URLs for security
- Implement webhook signature verification on your endpoint

### Security
- Enable 2FA for all admin accounts
- Use IP whitelist in production environments
- Set reasonable session timeout (15-60 minutes)
- Enforce password changes every 60-90 days

## Troubleshooting

### Logo won't upload
- Check file size (must be under 5MB)
- Verify file type (JPEG, PNG, GIF, or WebP only)
- Try a different browser

### Test email fails
- Verify SMTP credentials are correct
- Check SMTP host and port
- Ensure "From" email address is valid
- Check your email provider's security settings

### Webhook test fails
- Verify webhook URL is correct and accessible
- Check that endpoint accepts POST requests
- Ensure endpoint returns 200 OK status
- Check server logs for errors

### Settings not saving
- Check browser console for errors
- Verify you have admin permissions
- Try refreshing the page and re-entering data
- Check network connectivity

## Need Help?

If you encounter issues with any settings feature:
1. Check the browser console for error messages
2. Verify your admin permissions
3. Review the SETTINGS_FEATURES_SUMMARY.md for technical details
4. Contact the development team with specific error messages
