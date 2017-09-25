var chai = require('chai');
var expect = chai.expect;
var should = chai.should;
var sinon = require('sinon');

var _ = require('lodash');

var util = require('../../core/util');
var dirs = util.dirs();
var INDICATOR_PATH = dirs.indicators;
var settings = {
  "candle_duration": 5,
  "buy": {
    "condition": {
      "case1": {
        "prev_candle_count": 3,
        "prev_volume_surge_ratio": 3,
        "prev_price_surge_ratio": 1.01
      },
      "case2": {
        "prev_candle_count": 3,
        "prev_volume_surge_ratio": 5,
        "prev_max_num_candle": 10
      }
    }
  },
  "sell": {
    "condition": {
      "target_profit": 0.05,
      "case1": {
        "rate_ratio_from_low": 0.4
      }
    }
  }
}


var candles = [{
    "start": moment("2015-02-14T23:57:00.000Z"),
    "open": 257.19,
    "high": 257.19,
    "low": 257.18,
    "close": 257.18,
    "vwp": 257.18559990418294,
    "volume": 0.97206065,
    "trades": 2
  },
  {
    "start": moment("2015-02-14T23:58:00.000Z"),
    "open": 257.02,
    "high": 257.02,
    "low": 256.98,
    "close": 256.98,
    "vwp": 257.0175849772836,
    "volume": 4.1407478,
    "trades": 2
  },
  {
    "start": moment("2015-02-14T23:59:00.000Z"),
    "open": 256.85,
    "high": 256.99,
    "low": 256.85,
    "close": 256.99,
    "vwp": 256.9376998467,
    "volume": 6,
    "trades": 6
  },
  {
    "start": moment("2015-02-15T00:00:00.000Z"),
    "open": 256.81,
    "high": 256.82,
    "low": 256.81,
    "close": 256.82,
    "vwp": 256.815,
    "volume": 4,
    "trades": 2
  },
  {
    "start": moment("2015-02-15T00:01:00.000Z"),
    "open": 256.81,
    "high": 257.02,
    "low": 256.81,
    "close": 257.01,
    "vwp": 256.94666666666666,
    "volume": 6,
    "trades": 3
  },
  {
    "start": moment("2015-02-15T00:02:00.000Z"),
    "open": 257.03,
    "high": 257.03,
    "low": 256.33,
    "close": 256.33,
    "vwp": 256.74257263558013,
    "volume": 6.7551178,
    "trades": 6
  },
  {
    "start": moment("2015-02-15T00:03:00.000Z"),
    "open": 257.02,
    "high": 257.47,
    "low": 257.02,
    "close": 257.47,
    "vwp": 257.26466004728906,
    "volume": 3.7384995300000003,
    "trades": 3
  },
  {
    "start": moment("2015-02-15T00:04:00.000Z"),
    "open": 257.47,
    "high": 257.48,
    "low": 257.37,
    "close": 257.38,
    "vwp": 257.4277429116875,
    "volume": 8,
    "trades": 6
  },
  {
    "start": moment("2015-02-15T00:05:00.000Z"),
    "open": 257.38,
    "high": 257.45,
    "low": 257.38,
    "close": 257.45,
    "vwp": 257.3975644932184,
    "volume": 7.97062564,
    "trades": 4
  },
  {
    "start": moment("2015-02-15T00:06:00.000Z"),
    "open": 257.46,
    "high": 257.48,
    "low": 257.46,
    "close": 257.48,
    "vwp": 257.47333333333336,
    "volume": 7.5,
    "trades": 4
  },
  {
    "start": moment("2015-02-14T23:57:00.000Z"),
    "open": 257.19,
    "high": 257.19,
    "low": 257.18,
    "close": 257.18,
    "vwp": 257.18559990418294,
    "volume": 0.97206065,
    "trades": 2
  },
  {
    "start": moment("2015-02-14T23:58:00.000Z"),
    "open": 257.02,
    "high": 257.02,
    "low": 256.98,
    "close": 256.98,
    "vwp": 257.0175849772836,
    "volume": 4.1407478,
    "trades": 2
  },
  {
    "start": moment("2015-02-14T23:59:00.000Z"),
    "open": 256.85,
    "high": 256.99,
    "low": 256.85,
    "close": 256.99,
    "vwp": 256.9376998467,
    "volume": 6,
    "trades": 6
  },
  {
    "start": moment("2015-02-15T00:00:00.000Z"),
    "open": 256.81,
    "high": 256.82,
    "low": 256.81,
    "close": 256.82,
    "vwp": 256.815,
    "volume": 4,
    "trades": 2
  },
  {
    "start": moment("2015-02-15T00:01:00.000Z"),
    "open": 256.81,
    "high": 257.02,
    "low": 256.81,
    "close": 257.01,
    "vwp": 256.94666666666666,
    "volume": 6,
    "trades": 3
  },
  {
    "start": moment("2015-02-15T00:02:00.000Z"),
    "open": 257.03,
    "high": 257.03,
    "low": 256.33,
    "close": 256.33,
    "vwp": 256.74257263558013,
    "volume": 6.7551178,
    "trades": 6
  },
  {
    "start": moment("2015-02-15T00:03:00.000Z"),
    "open": 257.02,
    "high": 257.47,
    "low": 257.02,
    "close": 257.47,
    "vwp": 257.26466004728906,
    "volume": 3.7384995300000003,
    "trades": 3
  },
  {
    "start": moment("2015-02-15T00:04:00.000Z"),
    "open": 257.47,
    "high": 257.48,
    "low": 257.37,
    "close": 257.38,
    "vwp": 257.4277429116875,
    "volume": 8,
    "trades": 6
  },
  {
    "start": moment("2015-02-15T00:05:00.000Z"),
    "open": 257.38,
    "high": 257.45,
    "low": 257.38,
    "close": 257.45,
    "vwp": 257.3975644932184,
    "volume": 7.97062564,
    "trades": 4
  },
  {
    "start": moment("2015-02-15T00:06:00.000Z"),
    "open": 257.46,
    "high": 257.48,
    "low": 257.46,
    "close": 257.48,
    "vwp": 257.47333333333336,
    "volume": 7.5,
    "trades": 4
  },
  {
    "start": moment("2015-02-15T00:05:00.000Z"),
    "open": 281.38,
    "high": 265.45,
    "low": 245.38,
    "close": 260.45,
    "vwp": 257.3975644932184,
    "volume": 29,
    "trades": 4
  },
  {
    "start": moment("2015-02-15T00:06:00.000Z"),
    "open": 260.46,
    "high": 277.48,
    "low": 257.46,
    "close": 265.48,
    "vwp": 257.47333333333336,
    "volume": 17,
    "trades": 4
  }
];

describe('indicators/OOSAI', function () {

  var OOSAI = require(INDICATOR_PATH + 'OOSAI');

  it('should correctly set up with settings', function () {
    var oosai = new OOSAI(settings);
    expect(oosai.settings.buy.condition.case1.prev_candle_count).to.equal(3);
    expect(oosai.settings_candle_duration).to.equal(settings.candle_duration);
    expect(oosai.settings_candle_duration).to.equal(5);
  });

  it('should correctly update canldes', function () {
    var oosai = new OOSAI(settings);
    var candle = oosai.candleRangeSummary(candles, 0, 5);
    expect(candle.high).to.equal(257.19);
    expect(candle.open).to.equal(257.19);
    expect(candle.close).to.equal(257.01);
    expect(candle.trades).to.equal(15);
    expect(candle.size).to.equal(5);
    expect(candle.avgvol).to.equal(4.22256169);
    // expect(_.size(candles)).to.equal(200);
  });

  it('should correctly calculate index', function () {
    var oosai = new OOSAI(settings);
    _.each(candles, function (c) {
      oosai.update(c);
    })
    // start: start,
    // age_offset: age_offset,
    // end: size_of_histories,
    let result = oosai.calcIndex();
    expect(result.size).to.equal(22);
    expect(result.start).to.equal(5);
    expect(result.age_offset).to.equal(20);
    expect(result.end).to.equal(22);
    oosai.update(_.last(candles));
    oosai.update(_.last(candles));
    result = oosai.calcIndex();
    expect(result.size).to.equal(24);
    expect(result.age).to.equal(4);
    expect(result.age_offset).to.equal(20);
    expect(result.start).to.equal(5);
    expect(result.end).to.equal(24);

    oosai.update(_.last(candles));
    result = oosai.calcIndex();
    expect(result.size).to.equal(25);
    expect(result.age).to.equal(0);
    expect(result.age_offset).to.equal(25);
    expect(result.start).to.equal(10);
    expect(result.end).to.equal(25);

    oosai.update(_.last(candles));
    result = oosai.calcIndex();
    expect(result.size).to.equal(26);
    expect(result.age).to.equal(1);
    expect(result.age_offset).to.equal(25);
    expect(result.start).to.equal(10);
    expect(result.end).to.equal(26);
  });

  it('should correctly getCandleSummaryBySize ', function () {
    var oosai = new OOSAI(settings);
    _.each(candles, function (c) {
      oosai.update(c);
    })
    let result = oosai.getCandleSummaryBySize(5);
    expect(Number(result.avgvol.toFixed(2))).to.equal(6.79);
  });

  it('should correctly getCurrentCandleSummary ', function () {
    var oosai = new OOSAI(settings);
    _.each(candles, function (c) {
      oosai.update(c);
    })
    let result = oosai.getCurrentCandleSummary();
    expect(Number(result.avgvol.toFixed(2))).to.equal(23);
  });

  it('condition1 should be true when volume of the current candles is greater than previous candles ', function () {
    var oosai = new OOSAI(settings);
    _.each(candles, function (c) {
      oosai.update(c);
    })
    let cond1 = oosai.checkBuyCondition1();
    expect(cond1).to.equal(true);

    _.each(candles, function (c) {
      oosai.update(c);
    })
    let cond2 = oosai.checkBuyCondition1();
    expect(cond2).to.equal(false);
  });

  //helper function for condition2 test
  function makeCandlesForCond2() {
    var result = [];
    _.each(_.range(5), function (i) {
      result = result.concat(candles.slice(0, 20));
    })
    _.each(result, function (c) {
      if (c.volume > 100) {
        throw "number exception";
      }
    });

    var bigCandle = {
      "open": 265.46,
      "high": 277.48,
      "low": 257.46,
      "close": 285.48,
      "vwp": 257.47333333333336,
      "volume": 30,
      "trades": 4
    }
    _.each(_.range(4), function (i) {
      result.push(bigCandle);
    })
    return result;
  }
  it('condition2 should be true when volume of the current candles is greater than previous candles ', function () {
    var oosai = new OOSAI(settings);
    var dummyCandles = makeCandlesForCond2();
    _.each(dummyCandles, function (c) {
      oosai.update(c);
    });
    let cond2 = oosai.checkBuyCondition2();
    expect(cond2).to.equal(true);
  });
});
