var chai = require('chai');
var expect = chai.expect;
var should = chai.should;

var _ = require('lodash');
var util = require(__dirname + '/../../core/util');
var config = util.getConfig();
var dirs = util.dirs();
var LOOSAI = require(dirs.indicators + 'LOOSAI');
var getCandleSummary = LOOSAI.getCandleSummary;

var settings = {
  "candle_duration": 5,
  "buy": {
    "condition": {
      "case1": {
        "prev_candle_count": 3,
        "prev_volume_surge_ratio": 3,
        "prev_price_surge_ratio": 1.001
      },
      "case2": {
        "prev_candle_count": 3,
        "prev_volume_surge_ratio": 2,
        "prev_max_num_candle": 10
      }
    }
  },
  "sell": {
    "condition": {
      "loss_ratio": 0.98,
      "case1": {
        "prev_candle_count": 3,
        "prev_volume_surge_ratio": 3
      },
      "range1": {
        "a": 1.05,
        "b": 0.9,
      },
      "range2": {
        "a": 1.1,
        "b": 0.3
      },
      "range3": {
        "a": 1.2,
        "b": 0.2
      }
    }
  }
}

describe('indicators/LOOSAI', function () {
  let candles = [{
    "open": 1001,
    "high": 1003,
    "low": 999,
    "close": 1002,
    "volume": 1
  }, {
    "open": 1002,
    "high": 1004,
    "low": 1000,
    "close": 1003,
    "volume": 2
  }, {
    "open": 1003,
    "high": 1005,
    "low": 1001,
    "close": 1005,
    "volume": 3
  }, {
    "open": 1004,
    "high": 1006,
    "low": 1002,
    "close": 1003,
    "volume": 5
  }];

  it('should correctly calculate size of candles', function () {
    expect(settings.candle_duration).to.equal(5);
    let loosai = new LOOSAI(settings);
    let tc = _.clone(candles);
    _.each(tc, function (c) {
      loosai.addCandle(c);
    });
    expect(loosai.sizeOfCandles()).to.equal(4);
  });

  it('should correctly calculate summary of candles', function () {
    let loosai = new LOOSAI(settings);
    let tc = _.clone(candles);
    _.each(tc, function (c) {
      loosai.addCandle(c);
    });
    let summary = getCandleSummary(loosai.candles);
    expect(summary.open).equal(1001);
    expect(summary.close).equal(1003);
    expect(summary.volume).equal(11);
    expect(summary.avgvol).equal(2.75);
    expect(summary.low).equal(999);
    expect(summary.high).equal(1006);
    expect(summary.avgoc).equal(1002.875);

    loosai.addCandle({
      "open": 1004,
      "high": 1008,
      "low": 888,
      "close": 1007,
      "volume": 5
    });
    summary = getCandleSummary(loosai.candles);
    expect(summary.open).equal(1001);
    expect(summary.low).equal(888);
    expect(summary.high).equal(1008);
    expect(summary.close).equal(1007);

    expect(loosai.canApplyToCase1()).equal(false);

    _.each(_.range(3), function () {
      _.each(tc, function (c) {
        loosai.addCandle(c);
      });
    })
    expect(loosai.canApplyToCase1()).equal(true);
  });

  it('test buy precondition', function () {
    let tc = _.clone(candles);
    // 5 개 짜리를 만들고
    tc.push({
      "open": 1004,
      "high": 1008,
      "low": 888,
      "close": 1007,
      "volume": 5
    });
    let tcandle = _.clone(tc);
    let loosai = new LOOSAI(settings);
    _.each(_.range(3), function () {
      _.each(tcandle, function (c) {
        loosai.addCandle(c);
      });
    });
    //15개짜리 만들고 살 수 있는지 확인.
    expect(loosai.canApplyToCase1()).equal(false);
    let c = {
      "open": 1004,
      "high": 1008,
      "low": 888,
      "close": 1007,
      "volume": 5
    };
    //하나를 더 더하고 살 수 있는지 확인
    loosai.addCandle(c);
    expect(loosai.canApplyToCase1()).equal(true);
    //양봉인지 확인 . 살 수 있는 조건 마련
    expect(loosai.isUpCandle(c)).equal(true);
    //마지막 30분봉 지점에서 하나의 캔들이 들어갔을 때 변위차는 1이어야 한다.
    expect(loosai.getOffset()).equal(1);
    //하나를 더 더하면 offset 은 2가 되야된다.
    loosai.addCandle(c);
    expect(loosai.getOffset()).equal(2);
    expect(0 % 5).equal(0);
  });

  it('should correctly record summary', function () {
    let loosai = new LOOSAI(settings);
    let tc = _.clone(candles);
    _.each(tc, function (c) {
      loosai.addCandle(c);
    });
    //4개만 진행됐으면 기록할 수 없다.
    expect(loosai.recordable()).equal(false);
    let c = {
      "open": 1004,
      "high": 1008,
      "low": 888,
      "close": 1007,
      "volume": 5
    };
    //한 개를 더하고 기록할 수 있는지 확인
    loosai.addCandle(c);
    //5개만 진행됐으면 기록할 수 있다
    expect(loosai.recordable()).equal(true);
    loosai.record();
    //기록 후 groupCandles 의 첫번째 요약정보 확인
    let summary = loosai.groupCandles[0];
    expect(summary.open).equal(1001);
    expect(summary.low).equal(888);
    expect(summary.high).equal(1008);
    expect(summary.close).equal(1007);
    expect(summary.avgvol).equal(16 / 5);
    expect(loosai.groupCandles.length).equal(1);

    //4개를 더하고 확인 groupCandle 의 수 확인
    let second_candles = [{
      "open": 1002,
      "high": 1005,
      "low": 899,
      "close": 1003,
      "volume": 1
    }, {
      "open": 1003,
      "high": 1005,
      "low": 1001,
      "close": 1004,
      "volume": 2
    }, {
      "open": 1004,
      "high": 1006,
      "low": 1002,
      "close": 1006,
      "volume": 4
    }, {
      "open": 1005,
      "high": 1007,
      "low": 1002,
      "close": 1005,
      "volume": 6
    }];
    _.each(second_candles, function (c) {
      loosai.addCandle(c);
    });
    loosai.record();
    expect(loosai.groupCandles.length).equal(1);
    //하나를 더 채워서 10개를 만들고 기록
    loosai.addCandle({
      "open": 1006,
      "high": 1008,
      "low": 1003,
      "close": 1006,
      "volume": 6
    });
    loosai.record();
    expect(loosai.groupCandles.length).equal(2);
    //기록 후 groupCandles 의 두번째 요약정보 확인
    summary = loosai.groupCandles[1];
    expect(summary.open).equal(1002);
    expect(summary.low).equal(899);
    expect(summary.high).equal(1008);
    expect(summary.close).equal(1006);

    _.each(second_candles, function (c) {
      loosai.addCandle(c);
    });
    loosai.record();
    //아직 15개가 안 차서 2개이다.
    expect(loosai.groupCandles.length).equal(2);
    loosai.addCandle({
      "open": 1009,
      "high": 1011,
      "low": 777,
      "close": 1010,
      "volume": 6
    });
    loosai.record();
    expect(loosai.groupCandles.length).equal(3);
    expect(loosai.candles.length).equal(0);
    //기록 후 groupCandles 의 세번째 요약정보 확인
    summary = loosai.groupCandles[2];
    expect(summary.open).equal(1002);
    expect(summary.low).equal(777);
    expect(summary.high).equal(1011);
    expect(summary.close).equal(1010);

  });

  it('test buy condition1', function () {
    let tc = _.clone(candles);
    tc.push(_.last(candles));
    let loosai = new LOOSAI(settings);
    // add 1 groups 
    _.each(tc, function (c) {
      loosai.addCandle(c);
      expect(loosai.matchBuyCase1()).equal(false);
      loosai.record();
    });
    //add 2 groups
    _.each(tc, function (c) {
      loosai.addCandle(c);
      expect(loosai.matchBuyCase1()).equal(false);
      loosai.record();
    });
    //add 3 groups total => 3 groups
    _.each(candles, function (c) {
      loosai.addCandle(c);
      expect(loosai.matchBuyCase1()).equal(false);
      loosai.record();
    });
    //add matched candle unit;
    let c = {
      "open": 1004,
      "high": 1008,
      "low": 888,
      "close": 1007,
      "volume": 5
    };
    loosai.addCandle(c);
    expect(loosai.matchBuyCase1()).equal(false);
    loosai.record();

    expect(loosai.candlesIndex).equal(15);
    expect(loosai.groupCandles.length).equal(3);
    expect(loosai.groupCandles[0].avgvol).equal(3.2);
    expect(loosai.groupCandles[0].avgoc).equal(1003);
    expect(loosai.groupCandles[1].avgvol).equal(3.2);
    expect(loosai.groupCandles[2].avgvol).equal(3.2);
    let groupSummary = loosai.getCandleGroupSummary(3);
    expect(groupSummary.avgvol).equal(48 / 15);
    // expect(groupSummary.avgoc).equal(1003);

    //volume 3배짜리 하지만 1.01 이상은 아닌 가격 
    let d = {
      "open": 1004,
      "high": 1008,
      "low": 888,
      "close": 1003.3,
      "volume": 1
    };
    loosai.addCandle(d);
    expect(loosai.matchBuyCase1()).equal(false);
    loosai.record();

    //volume 3배짜리이고 가격은 + 0.01% 이하
    let e = {
      "open": 1004,
      "high": 1008,
      "low": 888,
      "close": 1001,
      "volume": 10
    };
    loosai.addCandle(e);
    expect(loosai.matchBuyCase1()).equal(false);
    loosai.record();

    //volume 3배짜리이고 가격도 1.01 이상이면 매수조건
    f = {
      "open": 1004,
      "high": 1008,
      "low": 888,
      "close": 1027,
      "volume": 20
    };
    loosai.addCandle(f);
    expect(loosai.matchBuyCase1()).equal(true);
    loosai.record();

  });

  it('test buy condition2', function () {
    let tc = _.clone(candles);
    tc.push(_.last(candles));
    let loosai = new LOOSAI(settings);
    // 9개 그룹봉을 더한다.
    _.each(_.range(9), function () {
      _.each(tc, function (c) {
        loosai.addCandle(c);
        expect(loosai.matchBuyCase2()).equal(false);
        loosai.record();
      });
    });
    //4개 단위 그룹봉을 더한다.
    let ttc = _.clone(candles);
    _.each(ttc, function (c) {
      loosai.addCandle(c);
      expect(loosai.matchBuyCase2()).equal(false);
      loosai.record();
    });
    //1개를 더해서 조건을 완료하지만 unit candle 갯수가 0 이라 조건에서 탈락
    let c = {
      "open": 1004,
      "high": 1008,
      "low": 888,
      "close": 1037,
      "volume": 40
    };
    loosai.addCandle(c);
    expect(loosai.matchBuyCase2()).equal(false);
    loosai.record();

    //조건이 안 되는 candle unit 을 더한다.
    let d = {
      "open": 1004,
      "high": 1008,
      "low": 888,
      "close": 1017,
      "volume": 3
    };
    loosai.addCandle(d);
    expect(loosai.matchBuyCase2()).equal(false);
    loosai.record();

    //조건이 되는 구매 조건을 추가
    let e = {
      "open": 1004,
      "high": 1008,
      "low": 888,
      "close": 1027,
      "volume": 13
    };
    loosai.addCandle(e);
    expect(loosai.matchBuyCase2()).equal(true);
    loosai.record();
  });
  it('샀던 가격이 현재 가격보다 -2% 미만이면 손절해야 된다.', function () {
    let loosai = makePreConditionForSell();
    let c = {
      "open": 1004,
      "high": 1008,
      "low": 1002,
      "close": 1005,
      "volume": 13
    };
    loosai.addCandle(c);
    expect(loosai.matchSellCase()).equal(false);
    loosai.record();
    //buycase1 조건을 만족되서 구매된
    expect(loosai.matchBuyCase1()).equal(true);
    loosai.snapshotBuy();
    expect(loosai.buy.low).equal(1002);
    expect(loosai.matchSellCase()).equal(false);

    let d = {
      "open": 1004,
      "high": 1008,
      "low": 977,
      "close": 980,
      "volume": 13
    };

    loosai.addCandle(d);
    expect(loosai.matchSellCase()).equal(true);
    loosai.record();
  });

  it('매수시점 이 후 최소 30분 완료 후 , 현재 봉 low 보다 매수가격이 아래면 손절해야 된다.', function () {
    let loosai = makeUtilBuy();
    let tc = _.clone(candles);
    _.each(tc, function (c) {
      loosai.addCandle(c);
      expect(loosai.matchSellCase()).equal(false);
      loosai.record();
    });
    let c = {
      "open": 1004,
      "high": 1008,
      "low": 1002,
      "close": 1005,
      "volume": 13
    };
    //30분 봉 완성
    loosai.addCandle(c);
    expect(loosai.matchSellCase()).equal(false);
    loosai.record();

    expect(loosai.groupCandles.length).equal(1);
    let e = {
      "open": 1002,
      "high": 1008,
      "low": 995,
      "close": 1000,
      "volume": 13
    };
    expect(loosai.buy.low).equal(1002);
    loosai.addCandle(e);
    expect(loosai.matchSellCase()).equal(true);
    loosai.record();
  });

  it('5%이상 수익시 90%하락하면 매도', function () {
    //snapshot 
    //++++++++++++case 1 test +++++++++++++++++++++++
    let loosai = makeUtilBuy();
    expect(loosai.buy.close).equal(1005);
    let c = {
      "open": 1004,
      "high": 1008,
      "low": 1002,
      "close": 1056,
      "volume": 13
    };
    loosai.addCandle(c);
    //현재 1분봉이 case 1 인지 확인
    // expect(loosai.buy.close * loosai.settings.sell.condition.range1.a).equal(1055.25);
    expect(c.close > loosai.buy.close * loosai.settings.sell.condition.range1.a).equal(true);
    // expect(loosai.buy.close * loosai.settings.sell.condition.range2.a).equal(1105.5);
    expect(c.close < loosai.buy.close * loosai.settings.sell.condition.range2.a).equal(true);
    let minProfit = fixedFloat((loosai.settings.sell.condition.range1.a - 1) * (1 - loosai.settings.sell.condition.range1.b));
    expect(minProfit).equal(0.005);
    expect(loosai.buy.close + loosai.buy.close * minProfit).equal(1010.025);
    expect(loosai.matchSellCase()).equal(false);
    expect(loosai.sell.case).equal('1');
    loosai.record();

    //minProfit 미만으로 떨어지면 case1 손절 조건 , 1050.225 미만
    let d = {
      "open": 1004,
      "high": 1008,
      "low": 1002,
      "close": 1010,
      "volume": 13
    };
    loosai.addCandle(d);
    expect(loosai.matchSellCase()).equal(true);
    loosai.snapshotSell();
    loosai.record();

    //++++++++++++case 2 test +++++++++++++++++++++++
    loosai = makeUtilBuy();
    let e = {
      "open": 1004,
      "high": 1008,
      "low": 1002,
      "close": 1110,
      "volume": 13
    };
    loosai.addCandle(e);
    //현재 1분봉이 case 1 인지 확인
    // expect(loosai.buy.close * loosai.settings.sell.condition.range1.a).equal(1055.25);
    expect(e.close > loosai.buy.close * loosai.settings.sell.condition.range2.a).equal(true);
    // expect(loosai.buy.close * loosai.settings.sell.condition.range2.a).equal(1105.5);
    expect(e.close < loosai.buy.close * loosai.settings.sell.condition.range3.a).equal(true);
    minProfit = fixedFloat((loosai.settings.sell.condition.range2.a - 1) * (1 - loosai.settings.sell.condition.range2.b));
    expect(minProfit).equal(0.07);
    expect(loosai.buy.close + loosai.buy.close * minProfit).equal(1075.35);
    expect(loosai.matchSellCase()).equal(false);
    loosai.record();

    //1075.35 미만으로 1분봉이 들어오면 손절
    let f = {
      "open": 1004,
      "high": 1008,
      "low": 1002,
      "close": 1075,
      "volume": 13
    };
    loosai.addCandle(f);
    expect(loosai.matchSellCase()).equal(true);
    loosai.snapshotSell();
    loosai.record();

    //++++++++++++case 3 test +++++++++++++++++++++++
    loosai = makeUtilBuy();
    let g = {
      "open": 1004,
      "high": 1008,
      "low": 1002,
      "close": 1207,
      "volume": 13
    };
    loosai.addCandle(g);
    //현재 1분봉이 case 1 인지 확인
    expect(loosai.buy.close * loosai.settings.sell.condition.range3.a).equal(1206);
    expect(g.close > loosai.buy.close * loosai.settings.sell.condition.range3.a).equal(true);
    minProfit = fixedFloat((loosai.settings.sell.condition.range3.a - 1) * (1 - loosai.settings.sell.condition.range3.b));
    expect(minProfit).equal(0.16);
    expect(loosai.buy.close + loosai.buy.close * minProfit).equal(1165.8);
    expect(loosai.matchSellCase()).equal(false);
    expect(loosai.sell.case).equal('3');
    loosai.record();

    //1165.8 미만으로 1분봉이 들어오면 손절
    let h = {
      "open": 1004,
      "high": 1008,
      "low": 1002,
      "close": 1164,
      "volume": 13
    };
    loosai.addCandle(h);
    expect(loosai.matchSellCase()).equal(true);
    loosai.snapshotSell();
    loosai.record();
  });

  function fixedFloat(f) {
    return Number((f).toFixed(3));
  }

  function makeUtilBuy() {
    // 9개 그룹봉을 더한다.
    let loosai = makePreConditionForSell();
    let c = {
      "open": 1004,
      "high": 1008,
      "low": 1002,
      "close": 1005,
      "volume": 13
    };
    loosai.addCandle(c);
    expect(loosai.matchSellCase()).equal(false);
    loosai.record();
    //buycase1 조건을 만족되서 구매된
    expect(loosai.matchBuyCase1()).equal(true);
    loosai.snapshotBuy();
    return loosai;
  }

  function makePreConditionForSell() {
    let tc = _.clone(candles);
    tc.push(_.last(candles));
    let loosai = new LOOSAI(settings);
    // 9개 그룹봉을 더한다.
    _.each(_.range(3), function () {
      _.each(tc, function (c) {
        loosai.addCandle(c);
        loosai.record();
      });
    });
    return loosai;
  }
});
