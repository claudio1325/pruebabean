const dotenv = require('dotenv').config();

module.exports = {

    NODE_ENV: process.env.NODE_ENV || 'development',
    HOST: process.env.HOST || '127.0.0.1',
    PORT: process.env.PORT || 3000,

    SSL_KEY: process.env.SSL_KEY || 'star_cientifica_edu_pe.key',
    SSL_CERT: process.env.SSL_CERT || '46e5cd7ee3e8c155.crt',
    SSL_CA: process.env.SSL_CA || 'gd_bundle-g2-g1.crt',

    KEY_ID: process.env.KEY_ID || 'AKIARLLB5LHBO5O4V3NB',
    ACCESS_KEY: process.env.ACCESS_KEY || 'FK7mpXik5ghpQVllkGP2ShRqx9xCRzCI6/LI8eC4',
    REGION: process.env.REGION || 'us-west-2',

    MAIL_HOST: process.env.MAIL_HOST || 'email-smtp.us-west-2.amazonaws.com',
    MAIL_PORT: process.env.MAIL_PORT || '465',
    MAIL_ENCRYPTION: process.env.MAIL_ENCRYPTION || 'ssl',
    MAIL_USER: process.env.MAIL_USER || 'AKIARLLB5LHBEEXH6XE3',
    MAIL_PASSWORD: process.env.MAIL_PASSWORD || 'BOvlB7kWTtzEq+y6w++FzJfXN+rYd1MnaYnHQ24s3tTi',
    MAIL_FROM: process.env.MAIL_FROM || 'academico@cientifica.edu.pe',

    DB_HOST: process.env.DB_HOST || 'postgresql-miportal.cfokelaa3um5.us-west-2.rds.amazonaws.com',
    DB_PORT: process.env.DB_PORT || '5432',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'PlVzNFbpBTk*',
    DB_DATABASE: process.env.DB_DATABASE || 'miportal_ucs_dev2',
    INIT_VECTOR: process.env.INIT_VECTOR || '{"type":"Buffer","data": [222,215,232,35,123,236,222,11,222,69,230,15,201,174,64]}',
    SECURITY_KEY: process.env.SECURITY_KEY || '{"type":"Buffer","data": [226,142,247,81,104,56,38,211,243,251,135,136,11,209,135,92,62,39,197,90,8,216,0,4,31,73,70,89,210,6,90,156]}',
}