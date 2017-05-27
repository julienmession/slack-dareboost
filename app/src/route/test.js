var express = require('express')
var router  = express.Router()
var Analysis = require('../model/Analysis');

router.get('/', function (req, res) {
    // get the token in a string 'token aioefaoef'
    //var text = 'token UAHFA73981hafeihaef';
    //res.send(text.replace(/\b(token|\b\s)*/, ''));
    var datenow = new Date();
    var cutoff = new Date(datenow.getTime() - parseInt(process.env.ANALYSIS_PEREMPTION_IN_SECONDS)*1000);
    res.send('time = '+datenow.getTime() + ' '+ cutoff.getTime());
    return;
    Analysis.find({createdAt: {$lt : cutoff}}).exec((err, analyses) => {
        if (err) {
            res.send(err + process.env.ANALYSIS_PEREMPTION_IN_SECONDS);
        }
        res.send(analyses ? analyses.length : "0");
    });
});

module.exports = router;
