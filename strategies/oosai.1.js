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
// Let's create our own strat
var strat = {};

// Prepare everything our method needs
strat.init = function() {
  this.currentTrend = 'long';
  this.requiredHistory = 0;
}

// What happens on every new candle?
strat.update = function(candle) {

  // Get a random number between 0 and 1.
  this.randomNumber = Math.random();

  // There is a 10% chance it is smaller than 0.1
  this.toUpdate = this.randomNumber < 0.1;
}

// For debugging purposes.
strat.log = function() {
  log.debug('calculated random number:');
  log.debug('\t', this.randomNumber.toFixed(3));
}

// Prepare everything our method needs
strat.init = function () {
  this.addIndicator('oosai', 'OOSAI', settings);
  this.trend = 'none';
  // this.beforeCandles = [];
  // this.currentCandles = [];
  // this.currentPosition = 'short'; //최초는 판 상태,즉 BTC 가 있는 상태로 출발
  // this.wishProfit = 0.05; // 목표 수익율
  // this.longPrice = 0;
}

// What happens on every new candle?
strat.update = function (candle) {
  this.indicator.update(candle);
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
  if(this.trend != 'long') {
    if(this.indicator.oosai.checkBuyCondition1() || this.indicator.oosai.checkBuyCondition1() ) {
      this.advice('long');
      this.trend = 'long';
      log.debug("short !!!!!!!!!!!!!!!!!!");
      log.debug('lastPrice',this.lastPrice);
      log.debug('close',candle.close);
    }
  } else {
    if(this.indicator.oosai.checkSellCondition1()) {
      this.advice('short');
      log.debug("long !!!!!!!!!!!!!!!!!!");
      log.debug('lastPrice',this.lastPrice);
      log.debug('close',candle.close);
      this.indicator.oosai.reset();
    }
  }
}

module.exports = strat;
