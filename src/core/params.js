require('dotenv').config();

module.exports = exports = {
    shouldReset: process.argv.some(el => el === '--reset'),
    shouldFix: process.argv.some(el => el === '--fix'),
    debugMode: process.env.DEBUG_MODE === 'true' || process.argv.some(el => el === '--debug'),
    defaultGatewayIp: process.env.GATEWAY_BASE,
    newGatewayIp: process.env.NEW_GATEWAY_ADDRESS,
    wifiName: process.env.WIRELESS_NAME,
    wifiPassword: process.env.WIRELESS_PASSWORD,
    channel: process.env.WIRELESS_CHANNEL,
    siteSurveyCount: process.env.SITE_SURVEY_COUNT_TRY,
}