/*
 * CCI
 */
var log = require('../../core/log');
var _ = require('lodash');

//현재는 gekko 가 최소 1분 이하로는 봉 정보를 보내주지 않는다 따라서 1분마다 봉정보를 수신하여 처리
var Indicator = function (settings) {
  this.reset(settings);
  this.settings = settings;
  this.settings_candle_duration = settings.candle_duration;
}

Indicator.prototype.reset = function (settings) {
  this.candleHistories = [];
}

Indicator.prototype.isBoundary = function () {
  return _.size(this.candleHistories) % this.settings_candle_duration === 0;
}

Indicator.prototype.update = function (candle) {
  this.currentCandle = candle;
  this.candleHistories.push(candle);
}

Indicator.prototype.calcIndex = function () {
  let size_of_histories = _.size(this.candleHistories);
  let age = size_of_histories % this.settings_candle_duration;
  let age_offset = size_of_histories - age;
  let start = size_of_histories - (age + this.settings.buy.condition.case1.prev_candle_count * this.settings_candle_duration);
  let end = size_of_histories % this.settings_candle_duration;
  return {
    start: start,
    age: age,
    age_offset: age_offset,
    end: size_of_histories,
    size: size_of_histories
  }
}
/**
 * age_offset 이전 size 봉 만큼의 봉 요약 정보
 */
Indicator.prototype.getCandleSummaryBySize = function (size) {
  let indexResult = this.calcIndex();
  let start = indexResult.age_offset - size;
  let end = indexResult.age_offset;
  let result = this.candleRangeSummary(this.candleHistories, start, end);
  return result;
}

/**
 * 봉이 완료되기 전까지 현재 봉 요약 정보
 */
Indicator.prototype.getCurrentCandleSummary = function () {
  let indexResult = this.calcIndex();
  let start = indexResult.age_offset;
  let end = indexResult.age_offset;
  let result = this.candleRangeSummary(this.candleHistories, indexResult.age_offset, indexResult.end);
  return result;
}

Indicator.prototype.checkBuyCondition1 = function () {
  if(_.size(this.candleHistories) <= this.settings_candle_duration * 3 ) {
    return false;
  }
  //1-1. 30봉 open 가격 < 현재 가격
  let before_result1 = this.getCandleSummaryBySize(this.settings_candle_duration);
  let cond1 = before_result1.open < this.currentCandle.open;
  //1-2 (이전 {3}개 봉의 평균거래량)x{3} < 현재 실시간 거래량
  let before_result2 = this.getCandleSummaryBySize(this.settings_candle_duration * 3);
  let current_result2 = this.getCurrentCandleSummary();
  let cond2 = before_result2.avgvol * 3 < current_result2.avgvol;
  //1-3. 이전 {3}개봉의 평균가격(각 봉의(open+close)/2의 평균)보다 {1%}이상 상승)
  const prev_price_surge_ratio = this.settings.buy.condition.case1.prev_price_surge_ratio;
  let cond3 = before_result2.avgoc < current_result2.avgoc * prev_price_surge_ratio;
  return cond1 && cond2 && cond3;
}

Indicator.prototype.checkBuyCondition2 = function () {
  let size = _.size(this.candleHistories);
  if(size <= this.settings_candle_duration * 10 ) {
    return false;
  }
  //2-1. 30봉 open 가격 < 현재 가격
  let before_result1 = this.getCandleSummaryBySize(this.settings_candle_duration);
  let cond1 = before_result1.open < this.currentCandle.open;
  //2-2. (이전 {3}개 봉의 평균거래량)x {5배} < 현재 실시간 거래량
  let before_result2 = this.getCandleSummaryBySize(this.settings_candle_duration * 5);
  let current_result2 = this.getCurrentCandleSummary();
  let cond2 = before_result2.avgvol * 5 < current_result2.avgvol;
  //2-3. 이전 {10}개봉의 최고가격 < 현재가
  let before_result3 = this.getCandleSummaryBySize(this.settings_candle_duration * 10);
  let cond3 = before_result3.high < current_result2.close;
  return cond1 && cond2 && cond3;
}

Indicator.prototype.checkSellCondition1 = function (lastBuyPrice,currentCandle) {
  if(currentCandle.close > lastBuyPrice * 1.03 ) {
    return true;
  }
  return false;
}

Indicator.prototype.candleRangeSummary = function (candleHistories, start, end) {
  var candles = candleHistories.slice(start, end);
  var size = _.size(candles);
  var result = _.reduce(
    candles,
    function (candle, m) {
      candle.high = _.max([candle.high, m.high]);
      candle.low = _.min([candle.low, m.low]);
      candle.volume += m.volume;
      candle.vwp += m.vwp * m.volume;
      candle.trades += m.trades;
      candle.sumoc += m.open + m.close;
      return candle;
    },
    {
      high: Number.MIN_VALUE,
      low: Number.MAX_VALUE,
      volume: 0,
      vwp: 0,
      trades: 0,
      sumoc: 0,
      avgvol: 0,
      size: 0,
      avgoc: 0
    }
  );
  result.avgvol = result.volume / size;
  result.open = _.first(candles).open;
  result.close = _.last(candles).close;
  result.size = size;
  result.avgoc = result.sumoc / size;
  return result;
}

module.exports = Indicator;
