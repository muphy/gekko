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
var oosai = require('./indicators/oosai.js');
var _ = require('lodash');
var config = require('../core/util.js').getConfig();
var settings = config.OOSAI;
// Let's create our own strat
var strat = {};

// Prepare everything our method needs
strat.init = function () {
  this.addIndicator('oosai', 'OOSAI', settings);
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

}

function processLong(candle) {
  var sizeOfCurrentCandles = _.size(this.currentCandles);
  if (sizeOfCurrentCandles > 0 && _.last(candle.open > this.beforeCandles).open) {
    var sumOfBeforeCandleVolume = _.reduce(
      this.beforeCandles,
      function (candle, m) {
        candle.oc = (m.open + m.close) / 2;
        candle.volume += m.volume;
        return candle;
      },
      _.first(this.beforeCandles)
    );
    var avgBeforeVolume = sumOfBeforeCandleVolume.volume / 90;
    var sumOfCurrentCandleVolume = _.reduce(
      this.currentCandles,
      function (candle, m) {
        candle.volume += m.volume;
        return candle;
      },
      _.first(this.currentCandles)
    );
    var avgCurrentVolume = sumOfCurrentCandleVolume.volume / sizeOfCurrentCandles;
    if (avgCurrentVolume >= avgBeforeVolume * 3) { //when volume rapidly increase,
      var avgPriceOfOpenClose = sumOfBeforeCandleVolume.op / sizeOfCurrentCandles;
      //이전 {3}개봉의 평균가격(각 봉의(open+close)/2의 평균)보다 {1%}이상 상승)
      if (sumOfBeforeCandleVolume.op / sizeOfCurrentCandles > candle.close + candle.close * 0.1)
        if (this.currentPosition === 'short') {
          this.advice('long');
          this.currentPosition = 'long';
          this.longPrice = candle.close;
        }
    }
  }
}

module.exports = strat;
