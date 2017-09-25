<template lang='jade'>
  section.contain.grd-row
    .grd-row-col-4-6(v-html='left')
    .grd-row-col-2-6.txt--center
      img(src='https://cdn.pastemagazine.com/www/articles/RoboCop%20Poster%20Square.jpeg')
      p
        em 잘 되야 될텐데...
</template>

<script>
import marked from '../../tools/marked';

const left = marked(`

### 사용법
#### 과거 데이타 가져오기
1. 먼저 상단 메뉴의 과거데이타 가져오기 항목에 가셔서 아래 데이타 가져오기 페이지 링크를 누르세요
2. 아래 market 을 선택하신 후 Currency 항목에 BTC, Asset 항목에 원하는시는 알트코인을 선택 후 daterange 를 선택하세요.
3. 그리고 하단 import 버튼을 클릭하시면 과거 거래 내역을 가져옵니다. daterange 가 길수록 가져오는 시간이 길어집니다.

#### 백테스트
1. 상단 메뉴의 백테스트메뉴를 선택하신 후 백테스트 화면으로 가서 하단의 *scan available data* 버튼을 클릭하시면 이전 단계에서 진행한 과거데이타가 보입니다.
2. 해당 dataset 을 클릭하신 후 하단 Strategy 항목 중 oosai 항목을 선택하세요.
3. candle size 는 *1* 이고 시간 단위는 *minutes* 로 선택하세요.
4. 오른 쪽 parameters 에 oosai 님의 변수를 수정하세요. 현재 매수로직 1까지만 구현되었습니다. :(
5. Warmup period 는 *0* 으로 설정하세요. oosai 님 알고리즘은 바로 시작됩니다.
6. 하단 *backtest* 버튼을 클릭하세요.
7. 잠시 후 하단에 백테스트 결과가 나옵니다. 그래프의 녹색점은 매수, 빨간색은 매도시점입니다.
   그래프는 차 후 수정예정입니다.
`);

export default {
  data: () => {
    return {
      left
    }
  }
}
</script>