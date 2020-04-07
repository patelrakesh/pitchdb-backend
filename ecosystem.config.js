// Target server hostname or IP address
const TARGET_SERVER_HOST = process.env.TARGET_SERVER_HOST ? process.env.TARGET_SERVER_HOST.trim() : '';
// Target server username
const TARGET_SERVER_USER = process.env.TARGET_SERVER_USER ? process.env.TARGET_SERVER_USER.trim() : '';
// Target server application path
const TARGET_SERVER_APP_PATH = `/home/${TARGET_SERVER_USER}/app/back-end`;
// Your repository
const REPO = 'git@gitlab.com:pitchdb/pitchdb-backend.git';

module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      name: 'pitchdb-api',
      script: 'src/app.js',
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080,
        LINKEDIN_ID: process.env.LINKEDIN_ID,
        LINKEDIN_SECRET: process.env.LINKEDIN_SECRET,

        FACEBOOK_ID: process.env.FACEBOOK_ID,
        FACEBOOK_SECRET: process.env.FACEBOOK_SECRET,

        GOOGLE_ID: process.env.GOOGLE_ID,
        GOOGLE_SECRET: process.env.GOOGLE_SECRET,

        MICROSOFT_ID: process.env.MICROSOFT_ID,
        MICROSOFT_PASSWORD: process.env.MICROSOFT_PASSWORD,

        IONOS_ACCOUNT_PASS: process.env.IONOS_ACCOUNT_PASS,

        AUTHORITY_SPARK_SECRET: process.env.AUTHORITY_SPARK_SECRET,
        AUTHORITY_SPARK_TEAM_SECRET: process.env.AUTHORITY_SPARK_TEAM_SECRET,

        HUNTER_API_KEY: process.env.HUNTER_API_KEY,

        CHECKER_API_KEY: process.env.CHECKER_API_KEY,

        VOILANORBERT_API_KEY: process.env.VOILANORBERT_API_KEY,
        VOILANORBERT_API_KEY_BASE64: process.env.VOILANORBERT_API_KEY_BASE64,

        CLEARBIT_API_KEY: process.env.CLEARBIT_API_KEY,

        SNOV_API_ID: process.env.SNOV_API_ID,
        SNOV_API_SECRET: process.env.SNOV_API_SECRET,

        MASHAPE_API_KEY: process.env.MASHAPE_API_KEY,
        LISTENNOTES_API_KEY:process.envLISTENNOTES_API_KEY,

        STRIPE_KEY: process.env.STRIPE_KEY,

        MARKETING_API_JWT: process.env.MARKETING_API_JWT,

        // CONNECTION SETTINGS

        MONGO_AUTH_CONNECTION_URL: process.env.MONGO_AUTH_CONNECTION_URL,
        BACK_BASE_URL: process.env.BACK_BASE_URL,
        FRONT_BASE_URL: process.env.FRONT_BASE_URL,
        MARKETING_SEARCH_URL: process.env.MARKETING_SEARCH_URL,
        CERT_FOLDER: process.env.CERT_FOLDER,
        KEY_FOLDER: process.env.KEY_FOLDER,

        // EMAIL SENDING
        GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET,
        GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN,
        GMAIL_ACCESS_TOKEN: process.env.GMAIL_ACCESS_TOKEN,

        // LOGS
        LOG_PATH: process.env.LOG_PATH
      }
    }
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy: {
    production: {
      user: TARGET_SERVER_USER,
      host: TARGET_SERVER_HOST,
      ref: 'origin/master',
      repo: REPO,
      ssh_options: 'StrictHostKeyChecking=no',
      path: TARGET_SERVER_APP_PATH,
      'post-deploy': 'npm install --production'
        + ' && pm2 startOrRestart ecosystem.config.js --update-env'
        + ' && pm2 save'
    }
  }
};