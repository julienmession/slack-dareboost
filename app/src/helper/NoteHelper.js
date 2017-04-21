const Link = require('../model/Link');
const User = require('../model/User');

function NoteHelper() {}

NoteHelper.prototype.findLinks = function(str) {
    // is there a http link inside the string ?
    var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b([\/?][-a-zA-Z0-9@:%_\+.~#\?&//=]*)?/gi;
    var regex = new RegExp(expression);
    var found = str.match(regex);
    return found;
}

NoteHelper.prototype.isLinkOk = function(str, callback) {
    var found = this.findLinks(str);
    if (found && found.length > 1) {
        return callback('Only 1 link by command please !');
    }
    if (found) {
        // there is a link. Is there a title ?
        if (str.replace(found, '').replace(' ', '') == '') {
            return callback('Please provide a title with this URL !');
        }
    }
    return callback(false, found ? found[0] : null);
}

NoteHelper.prototype.getChannelNotes = function(title, channelId, editMode, inChannel, callback) {
    var actions = [
        {"name": "del", "text": "Delete", "type":"button", "value":"del","confirm":{"title":"Are you sure?", "ok_text": "Yes", "dismiss_text": "No"}}
        // {"name": "up", "text": "Up", "type":"button", "value":"up"},
        // {"name": "down", "text": "Down", "type":"button", "value":"down"}
    ];
    var self = this;

    // return list of all texts
    var count = 1;
    var query = Link.find({'channelId': channelId});
    query.exec().then(function(links) {
        var attachments = [];
        links.forEach(function(link) {
            var text = link.text;
 
            if (!editMode) {
                var linkURLs = self.findLinks(text);
                if (linkURLs && linkURLs.length) {
                    var linkURL = linkURLs[0];
                    var label = text.replace(linkURL, '').replace(':', '-').replace('>', '-');
                    text = "<"+linkURL+"|"+label+">\n";
                }
            }

            var attachment = {
                "title": text,
                "fallback": "You can't edit the list",
                "callback_id": link._id,
                "color": "#3AA3E3",
                "attachment_type": "default"
            }
            if (editMode) {
                // add edit menu
                attachment.actions = actions;
            }
            attachments.push(attachment);
        });
        // add attachment to edit the list or cancel edition
        attachments.push({
            "text": '',
            "fallback": 'You can\'t edit the list',
            "callback_id": channelId,
            "color": "#A33AE3",
            "attachment_type": "default",
            "actions": [{"name":"edit", "text": editMode ? 'Cancel' : 'Edit this list', "type":"button", "value": editMode ? 'cancel' : 'edit'}]
        });
        var res = {text: title, "response_type": "in_channel"};
        if (!editMode && inChannel) {
            res.response_type = 'in_channel';
        }
        if (! attachments.length) {
            res.text += "\nNo note in this channel. Use '/n my smart note' to add the first note !";
        } else {
            res.attachments = attachments;
        }
        return callback(false, res);
    });
}

NoteHelper.prototype.saveNote = function (str, channelId, slackUserId, callback) {
    // is there a http link inside the string ?
    var self = this;
    this.isLinkOk(str, function(err, linkURL) {
        if (err) {
            return callback('Not Saved! '+err);
        }
        // is this link URL already present ?
        var queryObj = {'channelId': channelId};
        if (linkURL)
        {
            queryObj.text = {$regex : linkURL};
        }
        else
        {
            queryObj.text =str;    
        }

        var query = Link.findOne(queryObj);
        query.exec().then(function(found) {
            if (found) {
                return callback(linkURL ? 'This URL has already been saved' : 'This text has already been saved');
            }
            // save text
            var link = new Link;
            link.slackId = slackUserId;
            link.channelId = channelId;
            link.text = str;
            link.save(function(err) {
            if (err)
                {
                    return callback('Error : note not saved');
                }
                else
                {
                    return self.getChannelNotes('Note added ! Type \'/n\' to list all notes.', channelId, false, true, callback);
                }
            });
        });
    });
}


module.exports = new NoteHelper();
