using Azure;
using Azure.Communication.Email;
using Azure.Core;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.Extensions.Options;
using Zelu.Api.Configuration;

namespace Zelu.Api.Identity
{
    public class IdentityEmailProvider : IEmailSender<IdentityUser>, IEmailSender
    {
        private readonly LinkGenerator linkGenerator;
        EmailOptions emailOptions;

        public IdentityEmailProvider(IOptions<EmailOptions> options, LinkGenerator linkGenerator)
        {
            emailOptions = options.Value;
            this.linkGenerator = linkGenerator;
        }

        public async Task SendConfirmationLinkAsync(IdentityUser user, string email, string confirmationLink)
        {
            var emailContent = new EmailContent("Zelu Confirmation")
            {
                PlainText = confirmationLink
            };

            //var x = linkGenerator.
            EmailSendOperation emailSendOperation = await SendEmail(emailOptions.Sender, email, emailContent);
        }

        public async Task SendEmailAsync(string email, string subject, string htmlMessage)
        {
            var emailContent = new EmailContent(subject)
            {
                Html = htmlMessage
            };

            EmailSendOperation emailSendOperation = await SendEmail(emailOptions.Sender, email, emailContent);
        }

        public async Task SendPasswordResetCodeAsync(IdentityUser user, string email, string resetCode)
        {
            var callbackUrl = $"https://localhost:7288/resetpassword?code={resetCode}";

            var emailContent = new EmailContent("Zelu Password Code")
            {
                PlainText = callbackUrl
            };

            EmailSendOperation emailSendOperation = await SendEmail(emailOptions.Sender, email, emailContent);

        }

        public async Task SendPasswordResetLinkAsync(IdentityUser user, string email, string resetLink)
        {
            var emailContent = new EmailContent("Zelu Password Link")
            {
                PlainText = resetLink
            };

            EmailSendOperation emailSendOperation = await SendEmail(emailOptions.Sender, email, emailContent);
        }

        private async Task<EmailSendOperation> SendEmail(string emailSender, string emailRecipient, EmailContent emailContent)
        {
            var emailRecipients = new EmailRecipients(new[]
            {
                new EmailAddress(emailRecipient)
            });

            return await SendEmail(emailSender, emailRecipients, emailContent);
        }

        private async Task<EmailSendOperation> SendEmail(string emailSender, EmailRecipients emailRecipients, EmailContent emailContent)
        {
            var emailClient = new EmailClient(emailOptions.ConnectionString);

            var emailMessage = new EmailMessage(emailSender, emailRecipients, emailContent);
            EmailSendOperation emailSendOperation = await emailClient.SendAsync(WaitUntil.Completed, emailMessage);
            return emailSendOperation;
        }
    }
}
