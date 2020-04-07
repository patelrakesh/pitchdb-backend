/* eslint-disable linebreak-style */
module.exports = (app, callback) => {
    // Public routes (require no authentication)

    app.use('/auth', require('./public/authentication'));

    // Admin routes (users with the super-admin priviledge)

    app.use('/admin-users', require('./admin/users'));
    app.use('/admin-searches', require('./admin/searches'));

    // User routes (regular signed-in users)

    app.use('/users', require('./app-user/users'));
    app.use('/teams', require('./app-user/teams'));
    app.use('/podcasts', require('./app-user/podcasts'));
    app.use('/lists', require('./app-user/lists'));
    app.use('/search-parameters', require('./app-user/parameters'));
    app.use('/email-accounts', require('./app-user/email-accounts'));
    app.use('/stages', require('./app-user/stages'));
    app.use('/outreach-sequences', require('./app-user/outreach-sequences'));
    app.use('/counters', require('./app-user/counters'));
    app.use('/guests', require('./app-user/people'));
    app.use('/payments', require('./app-user/payments'));
    app.use('/bundles', require('./app-user/bundles'));
    app.use('/searches', require('./app-user/searches'));
    app.use('/search', require('./marketing-search/search'));
    app.use('/charts', require('./app-user/charts'));
    app.use('/activity', require('./app-user/activity'));
    app.use('/subscriptions', require('./app-user/subscriptions'));

    // Util routes (not for users)

    app.use('/opens', require('./util/opens'));
    app.use('/podstation', require('./util/podstation'));

    // Webhooks (external apps integration routes)
    
    app.use('/wh/paperforms-register', require('./webhooks/paperforms-register'));
    app.use('/wh/stripe-subscriptions', require('./webhooks/stripe-subscriptions'));

    // Missing routes
    app.use('*', require('../modules/common/errors/missing'));

    // Handlers
    callback();
}