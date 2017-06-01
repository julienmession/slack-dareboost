var express = require('express')
var router  = express.Router()
var Analysis = require('../model/Analysis');
var dareboostHelper = require('../helper/DareboostHelper');
router.get('/', function (req, res) {
    // get the token in a string 'token aioefaoef'
    //var text = 'token UAHFA73981hafeihaef';
    //res.send(text.replace(/\b(token|\b\s)*/, ''));
    /*
    var datenow = new Date();
    var cutoff = new Date(datenow.getTime() - parseInt(process.env.ANALYSIS_PEREMPTION_IN_SECONDS)*1000);
    res.send('time = '+datenow.getTime() + ' '+ cutoff.getTime());
    Analysis.find({createdAt: {$lt : cutoff}}).exec((err, analyses) => {
        if (err) {
            res.send(err + process.env.ANALYSIS_PEREMPTION_IN_SECONDS);
        }
        res.send(analyses ? analyses.length : "0");
    });*/

    var scoreInfo = dareboostHelper.formatReportValue('score', 75);
    console.log(scoreInfo);
    
    var advice = '<p>HTTP cookies are used to track a user to costumize the page according to their profile. They are sent as a HTTP header from the web server to the browser. Then, each time the browser accesses to the server, it sends a request containing the cookie received at the first response. <a target=\"_blank\" href=\"http://developer.yahoo.com/performance/rules.html#cookie_size\">See more information</a>.</p><p>Here, 1 domain sends 112 bytes of cookies:</p><h5>Domain name: fabernovel</h5><ul><li><code> _ga</code>: 52 bytes distributed on 2 request(s)</li><li><code> _gid</code>: 52 bytes distributed on 2 request(s)</li><li><code> _hjIncludedInSample</code>: 2 bytes distributed on 2 request(s)</li><li><code> _gat_UA-455808-54</code>: 2 bytes distributed on 2 request(s)</li><li><code>_gat_UA-455808-53</code>: 2 bytes distributed on 2 request(s)</li><li><code> _gat_UA-87443915-1</code>: 2 bytes distributed on 2 request(s)</li></ul>';

    console.log(advice);
    advice = dareboostHelper.formatTipAdvice(advice);
    console.log(advice);
    res.send('ok');
});

module.exports = router;
