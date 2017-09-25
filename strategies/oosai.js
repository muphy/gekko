// This is a basic example strategy for Gekko.
// For more information on everything please refer
// to this document:
//
// https://gekko.wizb.it/docs/strategies/creating_a_strategy.html
//
// The example below is pretty bad investment advice: on every new candle there is
// a 10% chance it will recommend to change your position (to either
// long or short).

var log = require('../core/log');
var oosai = require('./indicators/OOSAI.js');
var _ = require('lodash');
var config = require('../core/util.js').getConfig();
var settings = config.oosai;
const TEST_ENABLED = false;
// Let's create our own strat
var strat = {};

// Prepare everything our method needs
strat.init = function () {
  console.log("init",settings);
  this.addIndicator('oosai', 'OOSAI', settings);
  this.trend = 'none';
}

// What happens on every new candle?
strat.update = function (candle) {
  // this.indicators.update(candle);
}

// For debugging purposes.
strat.log = function () {
  // log.debug('calculated random number:');
  // log.debug('\t', this.randomNumber.toFixed(3));
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function (candle) {
  if(this.indicators.oosai.isBoundary()) {
    return;
  }
  if(this.trend != 'long') {
    if(this.indicators.oosai.checkBuyCondition1() || this.indicators.oosai.checkBuyCondition1() ) {
      this.advice('long');
      this.lastPrice = candle.close;
      this.trend = 'long';
      log.debug("buy:",this.lastPrice);
    }
  } else {
    if(this.indicators.oosai.checkSellCondition1(this.lastPrice,candle)) {
      this.advice('short');
      log.debug("sell1:",this.lastPrice);
      this.trend = 'short';
      this.indicators.oosai.reset();
      return;
    }

    if(this.indicators.oosai.checkSellStage1Cond2(this.lastPrice)) {
      this.advice('short');
      log.debug("sell2:",this.lastPrice);
      this.trend = 'short';
      this.indicators.oosai.reset();
      return;
    }
  }
}

if(TEST_ENABLED)  {
  var Consultant = function() {}
  _.each(strat, function(fn, name) {
    Consultant.prototype[name] = fn;
  });

  module.exports = Consultant;
} else {
  module.exports = strat;
}
