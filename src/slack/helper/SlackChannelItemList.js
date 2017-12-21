function SlackChannelItemList(options) {
    this.options = {
        ItemClass: false,
        formatURL: false,
        title    : 'Default title',
        itemName : 'analysis',
        itemNamePlural: 'analyses',
        slackCommand: '',
        changeQueryCallback:null,
        // show an edit button to delete entries, or always show the delete button on eash entry
        alwaysEditMode: false
    }
    for (var i in options) {
        this.options[i] = options[i];
    }
    if (!this.options.ItemClass)
        throw new Error('Missing ItemClass');
    if (!this.options.slackCommand)
        throw new Error('Missing slackCommand');

    this.actions = [
        {"name": "del", "style": "danger", "text": "Delete", "type":"button", "value":"del","confirm":{"title":"Delete this item", "ok_text": "Yes", "dismiss_text": "No"}}
        // {"name": "up", "text": "Up", "type":"button", "value":"up"},
        // {"name": "down", "text": "Down", "type":"button", "value":"down"}
    ];
}

SlackChannelItemList.prototype.save = function (channelItem, callback) {
    channelItem.save((err) => {
        if (err) {
            return callback(err);
        }
        return this.toMessage({channelId:channelItem.channelId}, false, callback);
    });; 
}

/**
 * generate a slack message from found items
 */
SlackChannelItemList.prototype.toMessage = function (searchOptions, editMode, callback) {
    
    this.getChannelItems(searchOptions, (err, items) => {
        // TODO : manage error
        var attachments = [];
        items.forEach((item) => {
            var attachment = item.toAttachment(editMode);
            if (editMode || this.options.alwaysEditMode) {
                if (!attachment.fallback) {
                    attachment.fallback = attachment.text;
                }
                // add edit menu
                attachment.callback_id = item._id;
                if (!attachment.actions) {
                    attachment.actions = this.actions;
                } else {
                    attachment.actions = attachment.actions.concat(this.actions)
                }
            }
            attachments.push(attachment);
        });

        if (items.length && !this.options.alwaysEditMode) {
            // add attachment to edit the list or cancel edition
            attachments.push({
                "text": '',
                "fallback": 'You can\'t edit the list',
                "callback_id": searchOptions.channelId,
                "color": "#A33AE3",
                "attachment_type": "default",
                "actions": [{"name":"edit", "text": editMode ? 'Cancel' : 'Edit this list', "type":"button", "value": editMode ? 'cancel' : 'edit'}]
            });
        }
        var res = {text: this.options.title};
        if (!editMode && items.length) {
            res.response_type = 'in_channel';
        }
        if (! attachments.length) {
            res.text += "\nNo item found in this channel. Use '"
                + this.options.slackCommand
                + " MY BEAUTIFUL ITEM\' to add the first item !";
        } else {
            res.attachments = attachments;
        }
        return callback(err, res); 
    });
}

SlackChannelItemList.prototype.getChannelItems = function (searchOptions, callback) {
    if (!searchOptions.channelId)
        throw new Error('Missing channelId in searchOptions');

    // return list of all texts
    var q = this.options.ItemClass
    .find(searchOptions);
    if (this.options.changeQueryCallback) {
        q = this.options.changeQueryCallback(q);
    }
    q.exec(function (err, items) {
        callback(err, items);
    });
}

/**
 * perform action on items or on edit button
 */
SlackChannelItemList.prototype.action = function(action, callback) {
    var actions = action.actions;
    var callbackId = action.callback_id;
    if (actions.length && actions[0].value) {
        switch(actions[0].value) {
            case 'edit':
                return this.toMessage({channelId:callbackId}, true, callback);
            break;

            case 'cancel':
                return this.toMessage({channelId:callbackId}, false, callback);
            break;
            
            case 'del':
            console.log('del', callbackId);
            this.options.ItemClass.findOne({_id: callbackId}).exec((err, item) => {
                if (!item) {
                    return callback('This item has already been deleted');
                }
                var channelId = item.channelId;
                item.remove((err) => {
                    if (err) {
                        return callback('Error while deleting the item');
                    }
                    return this.toMessage({channelId:channelId}, false, callback);
                });
             });
             break;
        }
    } else {
        callback('Unknown action');
    }
}

module.exports = SlackChannelItemList;

SlackChannelItemList.prototype.findLinks = function(str) {
    // is there a http link inside the string ?
    var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b([\/?][-a-zA-Z0-9@:%_\+.~#\?&//=]*)?/gi;
    var regex = new RegExp(expression);
    var found = str.match(regex);
    return found;
}

// TODO : see what is usefull and delete function (not used)
SlackChannelItemList.prototype.saveNote = function (str, channelId, slackUserId, callback) {
    // is there a http link inside the string ?
    this.isLinkOk(str, (err, linkURL) => {
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
        query.exec((found) => {
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
                    return this.getChannelNotes('Note added ! Type \'/n\' to list all notes.', channelId, false, true, callback);
                }
            });
        });
    });
}
