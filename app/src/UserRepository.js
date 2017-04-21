 /*jshint esversion: 6 */

var appConfig = require('../config/app');
var envConfig = require('../config/env');
var DebugHelper = require('../helpers/DebugHelper');
var SlackHelper = require('../helpers/SlackHelper');
var User = require('../model/User');

function UserRepository() {}

/**
 * Find users who are available for a speedmeeting
 * 
 * @param  {[Function]} callback 
 */
UserRepository.prototype.findAvailable = function(callback) {
    var criteria = {};

    // User is not a bot
    criteria['slackInfo.is_bot'] = false;
    // User is not blacklisted (thx Captain Obvious!)
    criteria.isBlacklisted = false;
    // User is not removed
    criteria.isRemoved = false;
    // User is not on holiday
    criteria['slackInfo.profile.fields.' + envConfig.slack.customFields.onHoliday + '.value'] = {$ne: 'Yes'};

    // Random not to always serve the first ones better than the others
    User.findRandom(criteria, {}, {limit : 1000000}, callback);
    // User.find(criteria, callback);
};

/**
 * Retrieve the first bot
 * 
 * @param  {Function} callback First and only argument is a User object
 */
UserRepository.prototype.findBot = function(callback) {
    User.find({'slackInfo.is_bot':true}, (err, users) => {
        if (err) {
            return DebugHelper.log(err);
        }

        callback(users[0]);
    });
};

/**
 * Import Slack users locally
 * 
 * @param  {Function} callback 
 */
UserRepository.prototype.import = function(callback) {
    var slackWebClient;

    if (!envConfig.debug.database.importUsers) {
        DebugHelper.log('[IMPORT] User import disabled.');

        return callback('[IMPORT] User import disabled.');
    }

    slackWebClient = SlackHelper.createWebClient();

    slackWebClient.auth.test((err, authData) => {
        //get the members of the whitelist channel
        slackWebClient.channels.info(envConfig.slack.whitelistChannel, (err, channelInfo) => {
            if (err) {
                return callback('[IMPORT] white list channel error ' + appConfig.slack.whitelistChannel);
            } else {
                var whitelistUserIds = channelInfo.channel.members;
                slackWebClient.users.list((err, slackUsers) => {
                    if (err) {
                        return callback('[IMPORT] Cannot retrieve Slack members');
                    } else {
                        return this.importUsers(authData, slackUsers, whitelistUserIds, callback);
                    }
                });
            }
        });
    });
}

/**
 * Import Slack users locally
 *
 * @param  {Function} callback
 */
UserRepository.prototype.importUsers = function (authData, slackUsers, whitelistUserIds, callback) {

    // filter the slackUsers to keep only those who are valid active users.
    slackUsers = slackUsers.members.filter((slackUser) => {
        // filter on domains
        var email = slackUser.profile.email;
        if (email) {
            var reg = new RegExp("@("+envConfig.slack.whitelistEmailDomains.join('|')+")");
            if (!email.match(reg)) {
                return false;
            }
        }
        return !slackUser.deleted && // User is not deactivated
            (
                // User is the authenticated app (the bot)
                authData.user_id === slackUser.id ||
                // User is not a bot and name different from 'slackbot' (slackbot is not considered as a bot user T_T)
                (
                    !slackUser.is_bot &&
                    slackUser.name !== 'slackbot' &&
                    whitelistUserIds.indexOf(slackUser.id) >= 0 // User is in the whitelist
                )
            )
        ;
    });

    // convert into array of slack ids
    var slackUsersIds = slackUsers.map((slackUserNotBot) => {
        return slackUserNotBot.id;
    });
    User.find({}, (err, users) => {
        if (err) {
            callback('[IMPORT] Cannot retrieve local users');
        }

        var usersIds = users.map((user) => {
            return user.slackInfo.id;
        });
                    
        // Tag as 'isRemoved' the local users that are no longer retrieved from Slack
        var userToRemove = usersIds
            .filter(user => slackUsersIds.indexOf(user) == -1) // Reduce local users to the one that are present in Slack
            .concat(
                // Reduce Slack users to the ones that are present from local
                slackUsersIds.filter(slackUser => usersIds.indexOf(slackUser) == -1)
            );

        User.update({'slackInfo.id': {$in: userToRemove}}, { $set: { isRemoved: true }}, { multi: true }, (err, raw) => {
            if (err) {
                
                callback('[IMPORT] Cannot update deleted users');
            }

            this.updateUsers(slackUsers, (usersQty) => {
                DebugHelper.log('[IMPORT] ' + usersQty + ' users imported from Slack (created or updated)');

                callback('[IMPORT] ' + usersQty + ' users imported from Slack (created or updated)');
            });
        });
    });
};

/**
 * Create or update local users according to the given Slack users
 *
 * @see https://api.slack.com/methods/users.list 
 * 
 * @param  {Array} slackUsers  Slack users ('members' property of the API JSON)
 * @param  {Function} callback 
 */
UserRepository.prototype.updateUsers = function(slackUsers, callback) {
    var saved, slackWebClient, usersUpdatedQty = 0;

    saved = (err, user) => {
        if (err) {
            return DebugHelper.log('[IMPORT] Cannot save user ' + user.slackInfo.profile.email);
        }

        usersUpdatedQty++;

        if (usersUpdatedQty === slackUsers.length) {
            return callback(usersUpdatedQty);
        }
    };

    // Slack web client with a user token
    slackWebClient = SlackHelper.createWebClient(false);

    slackUsers.forEach((slackUser) => {
        // Retrieve custom fields from the user.
        slackWebClient.users.profile.get({user:slackUser.id}, (err, slackUserProfile) => {
            if (err || !slackUserProfile.ok) {
                DebugHelper.log('[IMPORT] Cannot retrieve Slack profile from ' + slackUser.profile.email);
            } else {
                // Add custom fields in the slackUser object
                slackUser.profile.fields = slackUserProfile.profile.fields;

                // Search the user in local database
                User.findOne({'slackInfo.id': slackUser.id}, (err, user) => {
                    if (user) { // User exists: update him
                        user.updatedAt = Date.now();
                        user.isRemoved = false;
                        user.slackInfo = slackUser;
                    } else { // User does not exist: create him
                        user = new User({
                            slackInfo : slackUser
                        });
                    }

                    user.save(saved);
                });
            }
        });
    });
};

module.exports = new UserRepository();
