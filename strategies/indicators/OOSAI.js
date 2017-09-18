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
  this.candleIdx = 0; // 캔들 index
  this.buyIdx = 0; // 구매한 시점 1분 봉 index
  this.age_from_completed = 0; // 마지막 30분 완성 이후로 부터의 idx 
  this.active = false;
}

Indicator.prototype.update = function (candle) {
  // 처음 인덱스는 거름.  this.age_from_completed%this.candle_duration. 
  // this.age_from_completed 가 0 이면 0으로 나옴
  this.active = true;
  this.candleHistories.push(candle);
  this.candleIdx++;
  this.currentCandle = candle;
  if (_.size(this.candleHistories) <= this.candle_duration * 3) { //90분 이 후로 측정한다.
    return;
  }
  console.log('@@', this.candleIdx);
  console.log('@@@', this.candle_duration);
  this.age_from_completed = _.size(this.candleHistories) % this.candle_duration;
  console.log('!!', this.age_from_completed);
  //lastCompletedIdx: 마지막 30분 봉이 완성된 순간의 idx 값.
  this.lastCompletedIdx = _.size(this.candleHistories) - this.age_from_completed;
  console.log('!!!', this.lastCompletedIdx);
  this.currentCandleSummary = this.candleRangeSummary(this.lastCompletedIdx, this.lastCompletedIdx + this.age_from_completed);
  this.beforeFirstCandleSummary = this.candleRangeSummary(this.lastCompletedIdx - 30, this.lastCompletedIdx);
}

Indicator.prototype.update2 = function (candle) {
  this.candleHistories.push(candle);
}

Indicator.prototype.calcIndex = function () {
  let size_of_histories = _.size(this.candleHistories);
  let age = size_of_histories % this.settings_candle_duration;
  let age_offset = size_of_histories-age;
  let start = size_of_histories - (age + this.settings.buy.condition.case1.prev_candle_count * this.settings_candle_duration);
  let end = size_of_histories % this.settings_candle_duration;
  return {
    start: start,
    age:age,
    age_offset: age_offset,
    end: size_of_histories,
    size : size_of_histories
  }
}


/*
 <매수 조건> 
CASE1
 1-1. open < 현재가격 ; {30분}
  &
 1-2. (이전 {3}개 봉의 평균거래량)x{3} < 현재 실시간 거래량
   ({3}배의 판단은 시간에 따라 분을 분할하여 계산. {30분}봉의 평균 거래량이 100이고 현재 새로운 봉이 만들어진지 15분 경과한 상황이면 기준 거래량은 50이 되고 현재 거래량이 150이상이면 신호 발생)
  &
 1-3. 이전 {3}개봉의 평균가격(각 봉의(open+close)/2의 평균)보다 {1%}이상 상승)
 */
Indicator.prototype.checkBuyCondition1 = function () {
  let size_of_histories = _.size(this.candleHistories);
  let idx_from_mark = size_of_histories % this.settings_candle_duration;
  let prev_candle_count = this.settings.buy.condition.case1.prev_candle_count * this.candle_duration;
  let start = prev_candle_count;
  let last = idx_from_mark;
  // 이전 세 개 봉 요약 
  let prevSummary = this.candleRangeSummary(start, last);
  //1-1. open < 현재가격 ; {30분}
  let cond1 = prevSummary.close < this.currentCandle.close;
  //1-2. (이전 {3}개 봉의 평균거래량)x{3} < 현재 실시간 거래량
  let currentSummary = this.candleRangeSummary(last, this.candleIdx);
  let prev_volume_surge_ratio = this.settings.buy.condition.case1.prev_volume_surge_ratio;
  let cond2 = prevSummary.avgVol * prev_volume_surge_ratio < currentSummary.volume;
  //1-3. 이전 {3}개봉의 평균가격(각 봉의(open+close)/2의 평균)보다 {1%}이상 상승)
  let prev_price_surge_ratio = this.settings.buy.condition.case1.prev_price_surge_ratio;
  let cond3 = this.prevSummary.avgoc <= this.currentCandle.close * prev_price_surge_ratio;
  return cond1 && cond2 && cond3;
}

/*
CASE2
2-1. open < 현재가격 ; {30분}, CASE1과 동일
 &
2-2. (이전 {3}개 봉의 평균거래량)x {5배} < 현재 실시간 거래량
  ({5}배의 판단은 시간에 따라 분을 분할하여 계산. {30분}봉의 평균 거래량이 100이고 현재 새로운 봉이 만들어진지 15분 경과한 상황이면 기준 거래량은 50이 되고 현재 거래량이 150이상이면 신호 발생)
 &
2-3. 이전 {10}개봉의 최고가격 < 현재가
*/
Indicator.prototype.checkBuyCondition2 = function () {
  let prev_max_num_candle = this.settings.buy.condition.case2.prev_max_num_candle;
  // 10 개봉이 채워지지 않았다면 확인할 필요가 없음
  let isNotFilled = _.size(this.candleHistories) > prev_max_num_candle * this.candle_duration;
  if (isNotFilled) {
    return false;
  }
  let start = this.lastCompletedIdx - this.settings.buy.condition.case2.prev_candle_count * this.candle_duration;
  let last = this.lastCompletedIdx;
  // 이전 세 개 봉 요약 
  let prevSummary = this.candleRangeSummary(start, last);
  //1-1. open < 현재가격 ; {30분}
  let cond1 = prevSummary.close < this.currentCandle.close;
  //2-2. (이전 {3}개 봉의 평균거래량)x {5배} < 현재 실시간 거래량
  let currentSummary = this.candleRangeSummary(this.lastCompletedIdx, this.candleIdx);
  let prev_volume_surge_ratio = this.settings.buy.condition.case2.prev_volume_surge_ratio;
  let cond2 = prevSummary.avgVol * prev_volume_surge_ratio < currentSummary.volume;
  //3-3. 이전 {10}개봉의 최고가격 < 현재가
  start = this.lastCompletedIdx - (prev_max_num_candle * this.candle_duration);
  let prevMaxNumSummary = this.candleRangeSummary(start, this.lastCompletedIdx);

  let cond3 = prevMaxNumSummary.high < this.currentCandle.close;
  return cond1 && cond2 && cond3;
}

Indicator.prototype.candleRangeSummary = function (candleHistories, start, end) {
  var candles = _.slice(candleHistories, start, end);
  var size = _.size(candles);
  // console.log("---", _.size(canldes), "\t", start, "\t", end);
  var candle = _.reduce(
    candles,
    function (candle, m) {
      candle.high = _.max([candle.high, m.high]);
      candle.low = _.min([candle.low, m.low]);
      candle.open = m.open;
      candle.close = m.close;
      candle.volume += m.volume;
      candle.vwp += m.vwp * m.volume;
      candle.trades += m.trades;
      candle.sumoc += m.open + m.close;
      return candle;
    }
  );
  // console.log("candle_", candle);
  candle.avgvol = candle.volume / size;
  candle.size = size;
  candle.avgoc = candle.sumoc / size;
  return candle;
}



module.exports = Indicator;
