module.exports = {
  LINKEDIN_OAUTH: 'https://www.linkedin.com/oauth/v2/authorization',
  FACEBOOK_OAUTH: 'https://www.facebook.com/v2.12/dialog/oauth',
  GOOGLE_OAUTH: 'https://accounts.google.com/o/oauth2/v2/auth',
  MICROSOFT_OAUTH: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',

  LINKEDIN_TOKEN: 'https://www.linkedin.com/oauth/v2/accessToken',
  FACEBOOK_TOKEN: 'https://graph.facebook.com/v2.12/oauth/access_token',
  GOOGLE_TOKEN: 'https://www.googleapis.com/oauth2/v4/token',
  MICROSOFT_TOKEN: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',

  LINKEDIN_USER: 'https://api.linkedin.com/v2/me',
  LINKEDIN_USER_EMAIL: 'https://api.linkedin.com/v2/clientAwareMemberHandles?q=members&projection=(elements*(primary,type,handle~))',
  FACEBOOK_USER: 'https://graph.facebook.com/me',
  GOOGLE_USER: 'https://people.googleapis.com/v1/people/me',
  MICROSOFT_USER: 'https://graph.microsoft.com/v1.0/me',

  GOOGLE_MAIL_USER: 'https://www.googleapis.com/gmail/v1/users/me/profile'
}