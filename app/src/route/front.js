var express = require('express')
var router = express.Router()
var analyserController = require('../controller/AnalyserController')

/**
 * Return a tip
 */
router.get('/tip/:analysisId-:tipId', (req, res) => {
    analyserController.getReportTip(req.params.analysisId, req.params.tipId, (err, ret) => {
        res.send(ret);
    });
});

module.exports = router;