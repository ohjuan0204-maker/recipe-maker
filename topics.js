/*
 * 용액 레시피 메이커 — R&E 탐구 주제와 추천 규칙 (SPEC.md 13장)
 *
 * 주제는 고등학교 실험실에서 해 볼 수 있는 화학 탐구를 이 앱을 위해 새로 정리한 것이다.
 * 특정 수상작이나 논문을 옮긴 것이 아니며, 수상 여부와는 관계가 없다.
 * 추천은 생성형 AI가 아니라 진로·키워드·장비·난이도를 견주는 규칙으로 한다 (API 키를 쓰지 않는다).
 * 한 주제: { id, title, careers, tools, level(1~3), keywords, question, change, measure, fixed, plan, needs, labs, calcs, caution, extend }
 */
(function (root) {
  'use strict';

  const CAREERS = ['의약·바이오', '환경', '에너지·배터리', '소재·나노', '식품·화장품', '화학공학', 'AI·데이터', '분석화학'];
  const TOOLS = ['분광 광도계', 'pH 미터', '전도도 측정기', '전압계·전원 장치', '온도 센서', '스마트폰 카메라'];
  const LEVELS = [
    [0, '상관없음'],
    [1, '기초 (4주 안팎)'],
    [2, '보통 (한 학기)'],
    [3, '심화 (1년)'],
  ];

  const TOPICS = [
    {
      id: 'adsorb', title: '버려지는 재료로 만든 흡착제의 염료 흡착 성능', careers: ['환경', '화학공학', '소재·나노'], tools: ['분광 광도계'], level: 2,
      keywords: ['흡착', '커피 찌꺼기', '활성탄', '메틸렌 블루', '수질', '폐수'],
      question: '커피 찌꺼기나 귤껍질로 만든 흡착제는 활성탄과 견주어 메틸렌 블루를 얼마나 잘 흡착할까?',
      change: '흡착제의 종류와 양, 접촉 시간', measure: '흡광도로 구한 남은 농도와 흡착량(mg/g)', fixed: '처음 농도, 온도, 용액의 부피, 젓는 속도',
      plan: ['재료를 씻어 말리고 갈아 체로 입자 크기를 맞춘다.', '메틸렌 블루 1~8 mg/L 표준 용액으로 검량선을 만든다.', '10 mg/L 용액 50 mL에 흡착제 0.10 g을 넣고 5~60분 사이에 시료를 떠서 걸러 흡광도를 잰다.', '처음 농도를 바꾸어 흡착 등온선을 그리고 랭뮤어·프로인틀리히 식에 맞춰 본다.', 'pH와 온도를 바꾸어 흡착량이 달라지는지 확인한다.'],
      needs: ['메틸렌 블루', '활성탄', '커피 찌꺼기 등 재료', '거름종이', '자석 젓개'], labs: ['beer', 'standard'], calcs: ['beer', 'stats'],
      caution: '염료 폐액은 하수구에 버리지 않고 모아서 처리한다.', extend: '쓴 흡착제를 씻어 다시 쓸 때 성능이 얼마나 남는지 본다.',
    },
    {
      id: 'photocatalyst', title: '이산화 타이타늄 광촉매의 염료 분해 속도', careers: ['환경', '소재·나노', '에너지·배터리'], tools: ['분광 광도계'], level: 2,
      keywords: ['광촉매', 'TiO2', '자외선', '분해', '반응 속도', '수처리'],
      question: '빛의 종류와 촉매의 양에 따라 광촉매가 염료를 분해하는 속도는 어떻게 달라질까?',
      change: '광원(햇빛, 자외선 램프, 어둠), 촉매의 양', measure: '시간에 따른 흡광도와 겉보기 속도 상수', fixed: '염료의 처음 농도, 용액의 부피, 광원과의 거리, 온도',
      plan: ['메틸렌 블루 5 mg/L 용액 100 mL에 이산화 타이타늄 가루를 넣고 어두운 곳에서 30분 저어 흡착 평형을 맞춘다.', '빛을 쬐면서 10분마다 시료를 떠서 가루를 가라앉히거나 걸러 흡광도를 잰다.', 'ln(농도)를 시간에 대해 그려 직선이면 1차 반응으로 보고 기울기에서 속도 상수를 구한다.', '촉매 없이 빛만 쬔 실험과 빛 없이 촉매만 넣은 실험을 대조군으로 둔다.'],
      needs: ['이산화 타이타늄 가루', '메틸렌 블루', '자외선 램프', '자석 젓개'], labs: ['beer', 'rate-conc'], calcs: ['beer', 'rate-order'],
      caution: '자외선 램프를 맨눈으로 보지 않고, 고운 가루를 들이마시지 않게 마스크를 쓴다.', extend: '촉매를 유리판에 입혀 가루를 걸러 내지 않아도 되는 반응기를 만든다.',
    },
    {
      id: 'vitamin-c', title: '조리와 보관 조건에 따른 비타민 C 함량 변화', careers: ['식품·화장품', '의약·바이오', '분석화학'], tools: [], level: 1,
      keywords: ['비타민', '아스코르브산', '적정', '아이오딘', '식품', '과일'],
      question: '가열 시간과 보관 온도는 주스 속 비타민 C를 얼마나 줄일까?',
      change: '가열 시간, 보관 온도와 기간', measure: '아이오딘 적정으로 구한 비타민 C 농도', fixed: '시료의 부피, 지시약의 양, 적정 용액의 농도',
      plan: ['아스코르브산 표준 용액으로 아이오딘 용액의 농도를 확인한다.', '주스 10.0 mL에 녹말 용액을 넣고 아이오딘 용액으로 청남색이 사라지지 않을 때까지 적정한다.', '끓는 물중탕에서 0, 5, 10, 20분 가열한 시료를 같은 방법으로 적정한다.', '냉장과 실온에서 며칠 둔 시료를 견준다.'],
      needs: ['아이오딘-아이오딘화 칼륨 용액', '아스코르브산', '녹말 용액', '뷰렛', '과일 주스'], labs: ['vinegar', 'permanganate'], calcs: ['redox', 'stats'],
      caution: '아이오딘 용액은 피부와 옷에 물이 든다.', extend: '공기와 닿는 면적이나 금속 이온이 분해를 빠르게 하는지 본다.',
    },
    {
      id: 'antioxidant', title: '차와 과일 추출물의 항산화 능력 비교', careers: ['식품·화장품', '의약·바이오', '분석화학'], tools: ['분광 광도계'], level: 3,
      keywords: ['항산화', 'ABTS', '라디칼', '폴리페놀', '녹차', '추출'],
      question: '추출 온도와 시간에 따라 차의 항산화 능력은 어떻게 달라질까?',
      change: '시료의 종류, 추출 온도와 시간', measure: 'ABTS 라디칼 용액의 흡광도 감소율', fixed: '시료의 양, 반응 시간, 측정 파장',
      plan: ['ABTS 7 mM 용액과 과황산 칼륨 2.45 mM 용액을 섞어 어두운 곳에 12~16시간 두어 라디칼 용액을 만든다.', '734 nm에서 흡광도가 약 0.70이 되게 묽힌다.', '추출물을 넣고 6분 뒤 흡광도를 재어 감소율을 구한다.', '아스코르브산 표준 용액으로 같은 실험을 해 아스코르브산 당량으로 나타낸다.'],
      needs: ['ABTS', '과황산 칼륨', '아스코르브산', '차와 과일 시료', '마이크로피펫'], labs: ['beer'], calcs: ['beer', 'stats'],
      caution: '과황산 칼륨은 산화제다. 가루를 들이마시지 않고 장갑을 낀다.', extend: '같은 시료를 다른 항산화 측정법으로도 재어 순위가 같은지 견준다.',
    },
    {
      id: 'phone-color', title: '스마트폰 카메라로 용액의 농도 재기', careers: ['AI·데이터', '분석화학', '화학공학'], tools: ['스마트폰 카메라'], level: 1,
      keywords: ['스마트폰', 'RGB', '비색법', '이미지', '센서', '코딩'],
      question: '사진의 색 정보만으로 분광 광도계만큼 정확하게 농도를 잴 수 있을까?',
      change: '용액의 농도, 조명과 촬영 조건', measure: '사진에서 뽑은 RGB 값과 그것으로 계산한 농도', fixed: '촬영 거리, 배경, 용기, 카메라 설정',
      plan: ['빛이 일정한 촬영 상자를 만들고 흰 배경을 댄다.', '표준 용액을 같은 용기에 담아 찍고 가운데 영역의 RGB 평균을 구한다.', '빈 용액과 견준 −log(세기 비)를 농도에 대해 그려 검량선을 만든다.', '같은 용액을 분광 광도계로 재어 두 방법의 차이를 견준다.'],
      needs: ['스마트폰', '촬영 상자', '메틸렌 블루나 식용 색소', '큐벳이나 시험관'], labs: ['beer', 'standard'], calcs: ['beer', 'percent-error'],
      caution: '카메라의 자동 노출과 화이트밸런스를 꺼야 값이 흔들리지 않는다.', extend: '색 채널 여러 개를 함께 쓰는 회귀 모델로 정확도를 높인다.',
    },
    {
      id: 'ph-model', title: '천연 지시약의 색으로 pH를 맞히는 모델 만들기', careers: ['AI·데이터', '식품·화장품', '분석화학'], tools: ['스마트폰 카메라', 'pH 미터'], level: 2,
      keywords: ['지시약', '안토시아닌', '적양배추', '머신러닝', '인공지능', '색'],
      question: '적양배추 지시약의 사진 색만으로 pH를 얼마나 정확히 예측할 수 있을까?',
      change: '용액의 pH', measure: '사진의 RGB·HSV 값과 모델이 예측한 pH의 오차', fixed: '지시약의 농도, 촬영 조건',
      plan: ['적양배추를 뜨거운 물에 우려 지시약을 만든다.', 'pH 2~12의 용액을 만들어 pH 미터로 값을 확인하고 지시약을 넣어 사진을 찍는다.', '색 값과 pH를 표로 모아 회귀 모델을 학습시킨다.', '학습에 쓰지 않은 용액으로 예측 오차를 구한다.'],
      needs: ['적양배추', '산과 염기 용액', 'pH 미터', '스마트폰', '파이썬 환경'], labs: ['buffer', 'weak-acid'], calcs: ['ph-target', 'buffer', 'stats'],
      caution: '산과 염기 용액을 다룰 때 보안경을 쓴다.', extend: '지시약을 종이에 입혀 시험지를 만들고 앱으로 읽는다.',
    },
    {
      id: 'hydrogel', title: '알긴산 하이드로젤 구슬의 방출 속도 조절', careers: ['의약·바이오', '소재·나노', '화학공학'], tools: ['분광 광도계'], level: 2,
      keywords: ['하이드로젤', '알긴산', '약물 전달', '방출', '가교', '고분자'],
      question: '가교 조건을 바꾸면 구슬에 넣은 물질이 빠져나오는 속도를 조절할 수 있을까?',
      change: '염화 칼슘 용액의 농도, 가교 시간, 구슬의 크기', measure: '시간에 따라 물로 빠져나온 염료의 농도', fixed: '알긴산 나트륨의 농도, 염료의 양, 온도',
      plan: ['알긴산 나트륨 2 % 용액에 식용 색소를 섞는다.', '염화 칼슘 용액에 한 방울씩 떨어뜨려 구슬을 만들고 정한 시간만큼 둔다.', '구슬을 씻어 증류수에 넣고 일정 시간마다 물의 흡광도를 잰다.', '방출 곡선을 그려 조건별로 견준다.'],
      needs: ['알긴산 나트륨', '염화 칼슘', '식용 색소', '주사기나 스포이트'], labs: ['beer', 'standard'], calcs: ['beer', 'mole'],
      caution: '알긴산 용액은 하수구를 막을 수 있으니 굳혀서 버린다.', extend: 'pH가 다른 용액(위와 장을 흉내 낸 용액)에서의 방출을 견준다.',
    },
    {
      id: 'h2o2-catalyst', title: '과산화 수소 분해 촉매의 성능 비교', careers: ['화학공학', '의약·바이오', '에너지·배터리'], tools: [], level: 1,
      keywords: ['촉매', '과산화 수소', '반응 속도', '효소', '활성화 에너지', '산소'],
      question: '무기 촉매와 효소는 과산화 수소 분해를 얼마나, 어떤 조건에서 빠르게 할까?',
      change: '촉매의 종류와 양, 온도', measure: '시간에 따른 산소의 부피와 처음 속도', fixed: '과산화 수소의 농도와 부피',
      plan: ['3 % 과산화 수소수 20 mL에 촉매를 넣고 수상 치환으로 10초마다 산소의 부피를 잰다.', '이산화 망가니즈, 아이오딘화 칼륨, 감자나 간의 효소를 견준다.', '처음 30초의 기울기로 처음 속도를 구한다.', '온도를 바꾸어 활성화 에너지를 구한다.'],
      needs: ['과산화 수소수', '이산화 망가니즈', '아이오딘화 칼륨', '눈금 실린더와 수조', '초시계'], labs: ['gas-constant', 'rate-temp'], calcs: ['gas-collect', 'arrhenius', 'rate-order'],
      caution: '과산화 수소가 피부에 닿으면 하얗게 변한다. 장갑과 보안경을 쓴다.', extend: '효소가 온도와 pH에 따라 활성을 잃는 구간을 찾는다.',
    },
    {
      id: 'urease', title: '우레아제 효소 반응의 속도와 저해', careers: ['의약·바이오', '분석화학'], tools: ['전도도 측정기'], level: 3,
      keywords: ['효소', '우레아제', '요소', '미카엘리스', '저해제', '전도도'],
      question: '기질의 농도와 금속 이온은 우레아제의 반응 속도를 어떻게 바꿀까?',
      change: '요소의 농도, 저해제(구리 이온)의 농도', measure: '전도도가 늘어나는 속도(처음 속도)', fixed: '효소의 양, 온도, 완충 용액',
      plan: ['요소 용액에 우레아제를 넣으면 암모늄 이온이 생겨 전도도가 오른다. 처음 1분의 기울기를 처음 속도로 잡는다.', '요소의 농도를 5단계로 바꾸어 속도-농도 곡선을 그린다.', '역수 그래프로 최대 속도와 미카엘리스 상수를 구한다.', '구리 이온을 조금 넣었을 때 곡선이 어떻게 바뀌는지 본다.'],
      needs: ['우레아제', '요소', '인산 완충 용액', '황산 구리(II)', '전도도 측정기'], labs: ['buffer'], calcs: ['buffer', 'stats'],
      caution: '효소는 냉장 보관하고, 구리 이온이 든 폐액은 따로 모은다.', extend: '콩에서 직접 뽑은 효소와 시약 효소의 활성을 견준다.',
    },
    {
      id: 'dssc', title: '천연 색소로 만든 염료 감응 태양 전지', careers: ['에너지·배터리', '소재·나노'], tools: ['전압계·전원 장치'], level: 3,
      keywords: ['태양 전지', '염료 감응', '색소', '안토시아닌', '신재생', '효율'],
      question: '어떤 천연 색소가 염료 감응 태양 전지에서 가장 큰 전압과 전류를 낼까?',
      change: '색소의 종류, 색소를 흡착시키는 시간', measure: '빛을 쬘 때의 전압과 전류', fixed: '전극의 면적, 광원과의 거리, 전해질',
      plan: ['전도성 유리에 이산화 타이타늄 반죽을 얇게 펴 바르고 구워 막을 만든다.', '막을 색소 추출액에 담가 색소를 흡착시킨다.', '탄소를 입힌 상대 전극과 맞대고 사이에 아이오딘 전해질을 넣는다.', '같은 빛 아래에서 전압과 전류를 재어 색소별로 견준다.'],
      needs: ['전도성 유리', '이산화 타이타늄', '아이오딘 전해질', '색소 추출액', '멀티미터'], labs: ['daniell'], calcs: ['cell', 'stats'],
      caution: '유리를 구울 때 화상에 주의하고 전해질이 피부에 닿지 않게 한다.', extend: '두 색소를 섞어 흡수하는 빛의 범위를 넓힌다.',
    },
    {
      id: 'al-air', title: '알루미늄-공기 전지의 전해질과 출력', careers: ['에너지·배터리', '화학공학'], tools: ['전압계·전원 장치'], level: 2,
      keywords: ['전지', '배터리', '알루미늄', '활성탄', '전해질', '출력'],
      question: '전해질의 농도와 활성탄의 양은 알루미늄-공기 전지의 출력을 어떻게 바꿀까?',
      change: '소금물의 농도, 활성탄의 양', measure: '전압, 전류, 지속 시간', fixed: '알루미늄박의 넓이, 전지의 구조',
      plan: ['알루미늄박 위에 소금물을 적신 종이, 활성탄 가루, 탄소 막대나 구리선을 차례로 올린다.', '전압과 작은 전구나 저항을 연결했을 때의 전류를 잰다.', '소금물의 농도를 바꾸어 되풀이한다.', '시간에 따라 전압이 떨어지는 곡선을 그린다.'],
      needs: ['알루미늄박', '활성탄', '염화 나트륨', '키친타월', '멀티미터'], labs: ['daniell', 'electrolysis'], calcs: ['cell', 'faraday'],
      caution: '여러 개를 직렬로 이으면 열이 날 수 있다.', extend: '쓴 알루미늄박의 줄어든 질량으로 이론 전하량과 견준다.',
    },
    {
      id: 'corrosion', title: '철의 부식 속도와 부식을 막는 방법', careers: ['소재·나노', '화학공학', '환경'], tools: [], level: 1,
      keywords: ['부식', '녹', '철', '희생 양극', '도금', '염분'],
      question: '염분과 pH는 철의 부식을 얼마나 빠르게 하고, 다른 금속을 이으면 얼마나 막을 수 있을까?',
      change: '용액의 염분과 pH, 이어 붙인 금속의 종류', measure: '철못의 질량 감소와 용액의 색 변화', fixed: '철못의 크기, 용액의 부피, 기간, 온도',
      plan: ['사포로 닦은 철못의 질량을 재고 조건이 다른 용액에 담근다.', '며칠마다 꺼내 녹을 닦고 말려 질량을 잰다.', '아연이나 마그네슘 조각을 이은 철못과 견준다.', '한천에 페리사이안화 칼륨과 페놀프탈레인을 넣어 부식이 일어나는 자리를 색으로 본다.'],
      needs: ['철못', '염화 나트륨', '아연·마그네슘 조각', '한천', '전자저울'], labs: ['daniell'], calcs: ['cell', 'stats'],
      caution: '페리사이안화 칼륨 용액에 산을 섞지 않는다.', extend: '기름막, 페인트, 도금 가운데 무엇이 가장 오래 막는지 견준다.',
    },
    {
      id: 'deicer', title: '제설제의 종류에 따른 어는점 내림과 부작용', careers: ['환경', '화학공학'], tools: ['온도 센서'], level: 1,
      keywords: ['제설제', '어는점 내림', '총괄성', '염화 칼슘', '부식', '겨울'],
      question: '같은 질량을 썼을 때 어떤 제설제가 어는점을 가장 많이 내리고 부작용은 가장 적을까?',
      change: '제설제의 종류와 농도', measure: '어는점, 철못의 부식 정도, 씨앗의 발아율', fixed: '용매의 질량, 냉각 방법',
      plan: ['염화 나트륨, 염화 칼슘, 염화 마그네슘, 요소, 아세트산 칼슘 용액을 같은 질량 농도로 만든다.', '냉각 곡선을 그려 어는점을 구하고 입자 수로 예상한 값과 견준다.', '각 용액에 철못을 담가 일주일 뒤 질량 감소를 잰다.', '묽힌 용액으로 씨앗을 길러 발아율을 견준다.'],
      needs: ['염화 나트륨', '염화 칼슘', '요소', '아세트산 칼슘', '얼음과 소금', '온도 센서'], labs: ['freezing'], calcs: ['fp-molar-mass', 'percent-error'],
      caution: '염화 칼슘은 녹을 때 열이 난다.', extend: '값과 효과를 함께 따져 가장 알맞은 조합을 제안한다.',
    },
    {
      id: 'hardness', title: '우리 지역 물의 경도 지도 만들기', careers: ['환경', '분석화학'], tools: [], level: 2,
      keywords: ['경도', 'EDTA', '적정', '수돗물', '지하수', '칼슘'],
      question: '수돗물, 지하수, 생수의 경도는 얼마나 다르고 끓이면 어떻게 변할까?',
      change: '물의 종류와 채수 지점, 끓인 시간', measure: 'EDTA 적정으로 구한 경도(탄산 칼슘 mg/L)', fixed: '시료의 부피, 완충 용액과 지시약의 양',
      plan: ['0.0100 M EDTA 표준 용액을 만든다.', '시료 50.0 mL에 pH 10 완충 용액과 에리오크롬 블랙 T를 넣는다.', '붉은색이 푸른색으로 바뀔 때까지 적정한다.', '지점별 결과를 지도에 표시하고 끓인 시료와 견준다.'],
      needs: ['EDTA 이나트륨이나 사나트륨 염', '암모니아 완충 용액 (pH 10)', '에리오크롬 블랙 T', '뷰렛'], labs: ['vinegar', 'ksp'], calcs: ['redox', 'stats', 'mole'],
      caution: '암모니아 완충 용액은 후드에서 다룬다.', extend: '경도와 비누 거품의 양, 전도도의 관계를 본다.',
    },
    {
      id: 'buffer-drink', title: '음료의 완충 능력과 치아 부식 가능성', careers: ['식품·화장품', '의약·바이오'], tools: ['pH 미터'], level: 1,
      keywords: ['완충', '음료', '탄산', '치아', '산도', '적정 곡선'],
      question: '처음 pH가 비슷한 음료라도 치아를 녹이는 힘은 왜 다를까?',
      change: '음료의 종류', measure: '적정 곡선, pH 5.5와 7까지 드는 염기의 양, 달걀 껍데기의 질량 감소', fixed: '음료의 부피, 염기의 농도',
      plan: ['김을 뺀 음료 50 mL의 pH를 잰다.', '0.100 M 수산화 나트륨 수용액을 1 mL씩 넣으며 pH를 적어 적정 곡선을 그린다.', 'pH 5.5와 7.0까지 드는 염기의 양을 견준다.', '달걀 껍데기 조각을 음료에 하루 담가 질량 감소를 잰다.'],
      needs: ['여러 음료', '수산화 나트륨', 'pH 미터', '뷰렛', '달걀 껍데기'], labs: ['buffer', 'vinegar', 'weak-acid'], calcs: ['buffer', 'ka', 'vinegar'],
      caution: '수산화 나트륨 수용액이 눈에 들어가지 않게 한다.', extend: '음료에 든 산의 종류(시트르산, 인산)와 완충 구간을 연결해 설명한다.',
    },
    {
      id: 'antacid', title: '제산제의 중화 능력 비교', careers: ['의약·바이오', '분석화학'], tools: [], level: 1,
      keywords: ['제산제', '위산', '중화', '역적정', '약', '탄산 칼슘'],
      question: '한 알이 중화할 수 있는 산의 양과 반응 속도는 제품마다 얼마나 다를까?',
      change: '제산제의 종류', measure: '중화한 염산의 몰수, pH가 3을 넘는 데 걸리는 시간', fixed: '염산의 농도와 부피, 온도',
      plan: ['제산제 한 알을 갈아 0.100 M 염산 50.0 mL에 넣고 반응이 끝날 때까지 젓는다.', '남은 염산을 0.100 M 수산화 나트륨 수용액으로 적정한다.', '처음 넣은 염산에서 남은 염산을 빼 중화한 양을 구한다.', '같은 질량과 같은 값으로 환산해 견준다.'],
      needs: ['제산제 여러 종류', '염산', '수산화 나트륨', '페놀프탈레인', '뷰렛'], labs: ['vinegar', 'limiting'], calcs: ['limiting', 'mole', 'stats'],
      caution: '염산과 수산화 나트륨을 다룰 때 보안경을 쓴다.', extend: '위의 온도(37 °C)에서 중화 속도를 pH 미터로 따라가 본다.',
    },
    {
      id: 'crystal', title: '명반 결정의 성장 조건과 크기', careers: ['소재·나노'], tools: ['온도 센서'], level: 1,
      keywords: ['결정', '명반', '과포화', '냉각', '성장', '용해도'],
      question: '식히는 속도와 과포화 정도는 결정의 크기와 모양을 어떻게 바꿀까?',
      change: '냉각 속도, 용액의 농도, 씨결정의 유무', measure: '결정의 질량, 크기, 모양', fixed: '용액의 부피, 용기',
      plan: ['뜨거운 물에 명반을 녹여 농도가 다른 과포화 용액을 만든다.', '실온, 보온 상자, 얼음물에서 식혀 냉각 속도를 달리한다.', '실에 매단 씨결정을 넣은 것과 넣지 않은 것을 견준다.', '며칠 뒤 결정을 꺼내 질량과 크기를 재고 사진으로 모양을 기록한다.'],
      needs: ['명반', '비커', '실', '보온 상자', '온도 센서'], labs: ['standard', 'hydrate'], calcs: ['mole', 'stats'],
      caution: '뜨거운 용액을 옮길 때 데지 않게 한다.', extend: '다른 이온을 조금 넣었을 때 결정의 색과 모양이 바뀌는지 본다.',
    },
    {
      id: 'cmc', title: '계면활성제의 임계 미셀 농도 측정', careers: ['식품·화장품', '화학공학'], tools: ['전도도 측정기'], level: 2,
      keywords: ['계면활성제', '미셀', '세제', '전도도', '비누', '화장품'],
      question: '소금이나 온도는 계면활성제가 미셀을 만들기 시작하는 농도를 어떻게 바꿀까?',
      change: '계면활성제의 농도, 넣은 염의 농도, 온도', measure: '전도도와 농도 그래프가 꺾이는 점', fixed: '용액의 부피, 측정 온도',
      plan: ['도데실 황산 나트륨 용액을 1~20 mM 사이에서 10단계로 만든다.', '묽은 것부터 전도도를 잰다.', '전도도를 농도에 대해 그려 기울기가 바뀌는 두 직선의 교점을 찾는다.', '염화 나트륨을 넣은 용액으로 되풀이한다.'],
      needs: ['도데실 황산 나트륨', '염화 나트륨', '전도도 측정기', '부피 플라스크'], labs: ['standard'], calcs: ['mole', 'stats'],
      caution: '가루가 날리지 않게 하고 거품이 넘치지 않게 천천히 젓는다.', extend: '시판 세제의 임계 미셀 농도를 재어 권장 사용량과 견준다.',
    },
    {
      id: 'bioplastic', title: '녹말과 키토산으로 만든 생분해성 필름', careers: ['소재·나노', '환경'], tools: [], level: 2,
      keywords: ['생분해', '플라스틱', '녹말', '키토산', '필름', '친환경'],
      question: '가소제의 비율은 필름의 강도와 분해 속도를 어떻게 바꿀까?',
      change: '글리세롤의 비율, 녹말과 키토산의 비', measure: '끊어질 때의 하중, 물 흡수율, 흙 속에서의 질량 감소', fixed: '필름의 두께와 크기, 건조 조건',
      plan: ['녹말 용액에 글리세롤을 비율별로 넣고 가열해 풀처럼 만든다.', '판에 같은 두께로 펴서 말린다.', '같은 폭으로 잘라 추를 달아 끊어질 때의 하중을 잰다.', '흙에 묻고 일주일마다 꺼내 질량을 잰다.'],
      needs: ['녹말', '키토산', '글리세롤', '아세트산', '페트리 접시', '추'], labs: ['weak-acid'], calcs: ['stats', 'percent-error'],
      caution: '가열할 때 튀지 않게 저어 주고, 키토산을 녹이는 아세트산은 환기하며 쓴다.', extend: '필름으로 과일을 싸서 보관 기간이 늘어나는지 본다.',
    },
    {
      id: 'chitosan-cu', title: '키토산 구슬의 구리 이온 흡착', careers: ['환경', '소재·나노'], tools: ['분광 광도계'], level: 3,
      keywords: ['키토산', '중금속', '구리', '흡착', '폐수', '착이온'],
      question: '키토산 구슬은 물속 구리 이온을 얼마나, 어떤 pH에서 잘 잡을까?',
      change: '용액의 pH, 구슬의 양, 접촉 시간', measure: '남은 구리 이온의 농도와 흡착량', fixed: '처음 농도, 온도, 부피',
      plan: ['키토산을 묽은 아세트산에 녹여 수산화 나트륨 수용액에 떨어뜨려 구슬을 만든다.', '구리 이온 용액에 암모니아수를 넣어 짙은 푸른색 착이온을 만들고 검량선을 그린다.', '구리 이온 용액에 구슬을 넣고 시간별로 남은 농도를 잰다.', 'pH를 바꾸어 흡착량을 견준다.'],
      needs: ['키토산', '황산 구리(II)', '암모니아수', '아세트산', '수산화 나트륨'], labs: ['beer', 'le-chatelier'], calcs: ['beer', 'mole'],
      caution: '구리 폐액은 따로 모으고 암모니아수는 후드에서 쓴다.', extend: '쓴 구슬을 산으로 씻어 다시 쓸 수 있는지 본다.',
    },
    {
      id: 'silver-nano', title: '식물 추출물로 은 나노 입자 만들기', careers: ['소재·나노', '의약·바이오'], tools: ['분광 광도계'], level: 3,
      keywords: ['나노', '은', '녹색 합성', '플라스몬', '환원', '추출물'],
      question: '추출물의 종류와 양은 은 나노 입자가 생기는 속도와 크기를 어떻게 바꿀까?',
      change: '추출물의 종류와 양, 온도, pH', measure: '400~450 nm 부근 흡수 봉우리의 위치와 높이', fixed: '질산 은의 농도, 반응 부피',
      plan: ['녹차나 허브를 뜨거운 물에 우려 걸러 추출물을 만든다.', '1 mM 질산 은 용액에 추출물을 넣고 색이 노란 갈색으로 변하는지 본다.', '10분마다 흡수 스펙트럼을 재어 봉우리의 변화를 기록한다.', '추출물의 양과 온도를 바꾸어 견준다.'],
      needs: ['질산 은', '녹차나 허브', '분광 광도계', '갈색 병'], labs: ['beer', 'rate-conc'], calcs: ['beer', 'mole'],
      caution: '질산 은은 피부에 검은 얼룩을 남긴다. 은이 든 폐액은 따로 모은다.', extend: '레이저를 비추어 틴들 현상으로 콜로이드임을 확인한다.',
    },
    {
      id: 'water-split', title: '물 전기 분해의 효율과 전극 재료', careers: ['에너지·배터리', '화학공학'], tools: ['전압계·전원 장치'], level: 2,
      keywords: ['수소', '전기 분해', '전극', '효율', '패러데이', '그린 수소'],
      question: '전극의 재료와 전해질의 농도는 수소가 나오는 효율을 어떻게 바꿀까?',
      change: '전극의 재료, 전해질의 농도, 전압', measure: '모인 수소의 부피와 흘린 전하량에서 구한 효율', fixed: '전극의 넓이와 간격, 시간, 온도',
      plan: ['수산화 나트륨이나 황산 나트륨 수용액에 두 전극을 넣고 눈금 실린더로 기체를 따로 모은다.', '전류와 시간을 재어 전하량을 구한다.', '패러데이 법칙으로 예상한 수소의 부피와 실제 부피를 견준다.', '흑연, 스테인리스강, 니켈 전극으로 되풀이한다.'],
      needs: ['직류 전원 장치', '전극 여러 종류', '황산 나트륨', '눈금 실린더', '전류계'], labs: ['electrolysis', 'gas-constant'], calcs: ['faraday', 'gas-collect', 'ideal-gas'],
      caution: '수소와 산소가 섞이지 않게 따로 모으고 불꽃을 가까이 하지 않는다.', extend: '같은 양의 수소를 얻는 데 든 전기 에너지를 계산해 견준다.',
    },
    {
      id: 'co2-capture', title: '염기성 용액의 이산화 탄소 흡수량 비교', careers: ['환경', '에너지·배터리', '화학공학'], tools: ['pH 미터'], level: 2,
      keywords: ['이산화 탄소', '탄소 포집', '기후', '흡수', '역적정', '탄산'],
      question: '어떤 용액이 같은 부피로 이산화 탄소를 가장 많이, 가장 빨리 흡수할까?',
      change: '흡수 용액의 종류와 농도', measure: '흡수한 이산화 탄소의 몰수, 시간에 따른 pH', fixed: '기체를 불어 넣는 속도와 시간, 용액의 부피',
      plan: ['탄산 칼슘과 염산으로 이산화 탄소를 일정하게 발생시킨다.', '수산화 나트륨, 수산화 칼슘, 탄산 나트륨 용액에 같은 시간 동안 통과시킨다.', '흡수 전후의 용액을 염산으로 적정해 줄어든 염기의 양을 구한다.', '시간에 따른 pH 변화를 그려 속도를 견준다.'],
      needs: ['탄산 칼슘', '염산', '수산화 나트륨', '수산화 칼슘', '기체 발생 장치'], labs: ['limiting', 'ksp', 'vinegar'], calcs: ['limiting', 'mole', 'ksp'],
      caution: '기체 발생 장치의 마개가 튀지 않게 압력이 빠지는 길을 둔다.', extend: '쓴 용액을 가열해 다시 쓸 수 있는지 본다.',
    },
    {
      id: 'ocean', title: '해양 산성화 모형: 이산화 탄소와 조개껍데기', careers: ['환경'], tools: ['pH 미터'], level: 1,
      keywords: ['해양 산성화', '이산화 탄소', '조개', '탄산 칼슘', '기후', '바다'],
      question: '물에 녹은 이산화 탄소가 늘면 조개껍데기는 얼마나 빨리 녹을까?',
      change: '물에 불어 넣은 이산화 탄소의 양(pH)', measure: '껍데기의 질량 감소, 물의 pH와 칼슘 이온의 양', fixed: '껍데기의 질량과 크기, 물의 부피와 염분, 기간',
      plan: ['바닷물과 비슷한 소금물을 만들어 pH를 잰다.', '이산화 탄소를 다른 시간만큼 불어 넣어 pH가 다른 물을 만든다.', '씻어 말린 조개껍데기 조각을 넣고 밀폐해 일주일 둔다.', '껍데기를 꺼내 말려 질량을 재고 물의 pH를 다시 잰다.'],
      needs: ['조개껍데기', '염화 나트륨', '탄산수나 이산화 탄소 발생 장치', 'pH 미터', '밀폐 용기'], labs: ['ksp', 'limiting'], calcs: ['ph-weak', 'percent-error', 'stats'],
      caution: '밀폐 용기에 기체를 지나치게 채우지 않는다.', extend: '탄산수소 나트륨을 넣었을 때 완충 효과가 있는지 본다.',
    },
    {
      id: 'luminol', title: '루미놀 화학 발광의 세기와 지속 시간', careers: ['분석화학', '의약·바이오'], tools: ['스마트폰 카메라'], level: 2,
      keywords: ['루미놀', '화학 발광', '빛', '촉매', '과학 수사', '혈흔'],
      question: '촉매와 pH를 바꾸면 루미놀의 빛을 더 밝게, 더 오래 낼 수 있을까?',
      change: '촉매의 종류와 농도, pH, 과산화 수소의 농도', measure: '영상에서 뽑은 밝기의 최댓값과 지속 시간', fixed: '루미놀의 농도, 부피, 촬영 조건',
      plan: ['어두운 상자 안에 스마트폰을 고정한다.', '루미놀 용액과 과산화 수소·촉매 용액을 섞는 순간부터 영상을 찍는다.', '영상의 밝기를 시간에 대해 그려 최댓값과 반으로 줄어드는 시간을 구한다.', '철 이온, 구리 이온, 헤모글로빈 용액으로 견준다.'],
      needs: ['루미놀 용액', '과산화 수소수', '수산화 나트륨', '철이나 구리 염', '어두운 상자'], labs: ['rate-conc', 'rate-temp'], calcs: ['rate-order', 'arrhenius'],
      caution: '수산화 나트륨과 과산화 수소가 피부에 닿지 않게 한다.', extend: '아주 묽은 금속 이온을 찾아내는 검출 한계를 구한다.',
    },
    {
      id: 'chromatography', title: '색소의 분리: 전개 용매의 극성과 이동 거리', careers: ['식품·화장품', '분석화학'], tools: ['스마트폰 카메라'], level: 1,
      keywords: ['크로마토그래피', '색소', '분리', '극성', '식용 색소', '잎'],
      question: '전개 용매의 극성을 바꾸면 색소가 나뉘는 정도는 어떻게 달라질까?',
      change: '전개 용매의 조성(물과 에탄올의 비 등)', measure: '색소별 이동 거리의 비(Rf)와 분리된 띠의 수', fixed: '종이의 종류, 점적량, 전개 거리, 온도',
      plan: ['사탕 껍질이나 잎에서 색소를 뽑는다.', '거름종이 아래쪽에 점을 찍고 용매에 세워 전개한다.', '용매가 올라간 거리와 색소가 올라간 거리를 재어 Rf를 구한다.', '용매의 조성을 5단계로 바꾸어 견준다.'],
      needs: ['거름종이', '에탄올', '식용 색소나 잎', '비커와 뚜껑'], labs: ['beer'], calcs: ['stats'],
      caution: '에탄올 가까이에 불꽃을 두지 않는다.', extend: '사진의 색 분석으로 띠의 진하기를 수치로 나타낸다.',
    },
    {
      id: 'hand-warmer', title: '손난로 조성의 최적화', careers: ['화학공학', '소재·나노'], tools: ['온도 센서'], level: 1,
      keywords: ['손난로', '발열', '철가루', '산화', '열화학', '최적화'],
      question: '철가루, 활성탄, 소금, 물을 어떤 비율로 섞어야 가장 따뜻하고 오래갈까?',
      change: '각 성분의 비율', measure: '최고 온도, 40 °C 넘게 유지되는 시간', fixed: '전체 질량, 주머니의 재질과 크기, 주위 온도',
      plan: ['기준 조성으로 손난로를 만들어 온도 센서를 넣고 온도-시간 곡선을 잰다.', '한 번에 한 성분의 양만 바꾸어 되풀이한다.', '최고 온도와 유지 시간을 표로 정리한다.', '가장 좋은 조합을 만들어 시판 제품과 견준다.'],
      needs: ['철가루', '활성탄', '염화 나트륨', '질석이나 톱밥', '부직포 주머니', '온도 센서'], labs: ['neutralization-heat', 'hess'], calcs: ['calorimetry', 'stats'],
      caution: '철가루는 불꽃 가까이에서 다루지 않고, 뜨거워진 주머니에 오래 닿지 않게 한다.', extend: '다 쓴 손난로의 질량 증가로 반응한 산소의 양을 구한다.',
    },
    {
      id: 'optimize', title: '실험 계획법과 회귀 모델로 반응 조건 찾기', careers: ['AI·데이터', '화학공학'], tools: ['온도 센서'], level: 3,
      keywords: ['최적화', '실험 계획법', '회귀', '머신러닝', '데이터', '반응 속도'],
      question: '농도와 온도 두 가지를 함께 바꿀 때 반응 시간을 예측하는 모델을 만들 수 있을까?',
      change: '티오황산 나트륨의 농도, 온도', measure: '× 표시가 가려질 때까지의 시간', fixed: '염산의 농도와 부피, 전체 부피',
      plan: ['농도 5단계와 온도 4단계를 짝지어 실험 조건표를 만든다.', '조건마다 세 번씩 시간을 재어 평균과 표준 편차를 구한다.', 'ln(시간)을 농도와 온도의 식으로 맞추는 회귀 모델을 만든다.', '해 보지 않은 조건의 시간을 예측하고 실제로 실험해 오차를 구한다.'],
      needs: ['티오황산 나트륨', '염산', '물중탕', '초시계', '파이썬이나 스프레드시트'], labs: ['rate-conc', 'rate-temp'], calcs: ['rate-order', 'arrhenius', 'stats'],
      caution: '이산화 황이 나오므로 환기하고 40 °C를 넘기지 않는다.', extend: '실험 횟수를 줄이면서도 같은 정확도를 내는 조건 배치를 찾는다.',
    },
    {
      id: 'diy-spectrometer', title: '직접 만드는 간이 분광기', careers: ['AI·데이터', '분석화학', '소재·나노'], tools: ['스마트폰 카메라'], level: 3,
      keywords: ['분광기', '회절격자', '스펙트럼', '제작', '아두이노', '측정 장치'],
      question: '회절격자와 스마트폰으로 만든 분광기는 상용 장비와 얼마나 가까운 값을 낼까?',
      change: '시료의 농도, 슬릿의 폭, 광원', measure: '파장별 빛의 세기와 그것으로 구한 흡광도', fixed: '광원과 시료와 카메라의 위치, 카메라 설정',
      plan: ['상자에 슬릿, 시료 자리, 회절격자(또는 DVD 조각), 스마트폰을 고정한다.', '파장을 아는 광원(레이저 포인터, 형광등)으로 화소 위치와 파장의 관계를 맞춘다.', '빈 용액과 시료의 스펙트럼 사진에서 세기를 뽑아 흡광도를 계산한다.', '같은 시료를 분광 광도계로 재어 견준다.'],
      needs: ['회절격자나 DVD', '검은 상자', 'LED 광원', '스마트폰', '큐벳'], labs: ['beer'], calcs: ['beer', 'percent-error'],
      caution: '레이저 포인터를 눈에 비추지 않는다.', extend: '사진 분석을 자동으로 하는 프로그램을 만든다.',
    },
    {
      id: 'soap', title: '기름의 종류에 따른 비누의 성질', careers: ['식품·화장품', '화학공학'], tools: ['pH 미터'], level: 1,
      keywords: ['비누', '비누화', '기름', '세정', '거품', '화장품'],
      question: '기름의 종류는 비누의 단단함, 거품, pH를 어떻게 바꿀까?',
      change: '기름의 종류(코코넛유, 올리브유, 폐식용유 등)', measure: '비누의 pH, 거품의 높이와 유지 시간, 단단함', fixed: '기름과 수산화 나트륨의 비, 숙성 기간',
      plan: ['기름마다 필요한 수산화 나트륨의 양을 비누화값으로 계산한다.', '기름에 수산화 나트륨 수용액을 넣고 걸쭉해질 때까지 저어 틀에 붓는다.', '몇 주 숙성하며 일주일마다 1 % 비눗물의 pH를 잰다.', '같은 농도의 비눗물을 흔들어 거품의 높이와 꺼지는 시간을 잰다.'],
      needs: ['기름 여러 종류', '수산화 나트륨', '틀', 'pH 미터', '눈금 실린더'], labs: ['vinegar', 'standard'], calcs: ['mole', 'limiting', 'stats'],
      caution: '수산화 나트륨은 피부와 눈을 상하게 한다. 보안경과 장갑을 쓰고, 덜 숙성된 비누를 피부에 쓰지 않는다.', extend: '센물과 단물에서의 세정력을 견준다.',
    },
  ];

  function squash(text) {
    return String(text || '').toLowerCase().replace(/\s+/g, '');
  }

  /*
   * input: { careers: [], keyword: '', tools: null | [], level: 0~3, limit }
   * tools가 null이면 장비를 따지지 않고, 배열이면 그 장비만 쓸 수 있다고 본다.
   * 점수: 진로 하나 +3, 키워드 하나 +2, 장비가 모두 있으면 +1(없는 장비 하나에 −4), 난이도가 같으면 +2(두 단계 차이는 −3)
   */
  function recommend(input) {
    const src = input || {};
    const careers = src.careers || [];
    const words = String(src.keyword || '').split(/[\s,]+/).map(squash).filter(Boolean);
    const tools = Array.isArray(src.tools) ? src.tools : null;
    const level = Number(src.level) || 0;
    const profile = vector(String(src.keyword || ''));
    const scored = TOPICS.map((topic, order) => {
      let score = 0;
      const why = [];
      for (const career of careers) {
        if (topic.careers.includes(career)) {
          score += 3;
          why.push(`진로: ${career}`);
        }
      }
      const hay = squash([topic.title, topic.question, topic.keywords.join(' ')].join(' '));
      for (const word of words) {
        if (hay.includes(word)) {
          score += 2;
          why.push(`키워드: ${word}`);
        }
      }
      if (tools) {
        const missing = topic.tools.filter((t) => !tools.includes(t));
        if (missing.length) {
          score -= 4 * missing.length;
          why.push(`더 필요한 장비: ${missing.join(', ')}`);
        } else {
          score += 1;
          why.push(topic.tools.length ? '가진 장비로 가능' : '기본 기구로 가능');
        }
      }
      if (level) {
        const gap = Math.abs(topic.level - level);
        if (gap === 0) {
          score += 2;
          why.push('난이도 맞음');
        } else if (gap >= 2) {
          score -= 3;
        }
      }
      return { topic, score, why, order, similarity: words.length ? cosine(profile, VECTORS[order]) : 0 };
    });
    scored.sort((a, b) => b.score + 3 * b.similarity - (a.score + 3 * a.similarity) || a.order - b.order);
    return scored.slice(0, src.limit || 5);
  }

  /* ---------- 낱말 가중치(TF-IDF)와 코사인 유사도 ----------
   * 한국어는 띄어쓰기만으로 낱말을 나누기 어려워 글자 두 개씩(바이그램)을 낱말처럼 쓴다.
   * 가중치는 기존 주제 30개에서 센다: 여러 주제에 흔한 글자쌍은 가볍게, 드문 글자쌍은 무겁게.
   */
  function grams(text) {
    const flat = squash(text).replace(/[^0-9a-z가-힣]/g, '');
    const out = [];
    for (let i = 0; i < flat.length - 1; i += 1) out.push(flat.slice(i, i + 2));
    return out;
  }

  function topicText(t) {
    return [t.title, t.question, t.keywords.join(' '), t.careers.join(' '), t.change, t.measure].join(' ');
  }

  const DF = {};
  for (const topic of TOPICS) for (const g of new Set(grams(topicText(topic)))) DF[g] = (DF[g] || 0) + 1;

  function vector(text) {
    const tf = {};
    for (const g of grams(text)) tf[g] = (tf[g] || 0) + 1;
    const v = {};
    let norm = 0;
    for (const g of Object.keys(tf)) {
      v[g] = tf[g] * (Math.log((TOPICS.length + 1) / ((DF[g] || 0) + 1)) + 1);
      norm += v[g] * v[g];
    }
    return { v, norm: Math.sqrt(norm) };
  }

  function cosine(a, b) {
    if (!a.norm || !b.norm) return 0;
    let dot = 0;
    for (const g of Object.keys(a.v)) if (b.v[g]) dot += a.v[g] * b.v[g];
    return dot / (a.norm * b.norm);
  }

  const VECTORS = TOPICS.map((t) => vector(topicText(t)));

  function similarity(textA, textB) {
    return cosine(vector(textA), vector(textB));
  }

  /* ---------- 글에서 분야 읽기: 가까운 주제 K개의 가중 투표(k-최근접 이웃) ----------
   * 학습 자료는 기존 주제의 글(제목·질문·키워드·변인)과 그 주제에 붙여 둔 진로다.
   * 진로 이름은 글에서 빼고 학습한다. 그래야 "하나 빼고 학습" 평가에서 정답이 새지 않는다.
   */
  const NEIGHBORS = 7;

  function topicBody(t) {
    return [t.title, t.question, t.keywords.join(' '), t.change, t.measure].join(' ');
  }

  function bodyModel(train) {
    const df = {};
    for (const t of train) for (const g of new Set(grams(topicBody(t)))) df[g] = (df[g] || 0) + 1;
    const vec = (text) => {
      const tf = {};
      for (const g of grams(text)) tf[g] = (tf[g] || 0) + 1;
      const v = {};
      let norm = 0;
      for (const g of Object.keys(tf)) {
        v[g] = tf[g] * (Math.log((train.length + 1) / ((df[g] || 0) + 1)) + 1);
        norm += v[g] * v[g];
      }
      return { v, norm: Math.sqrt(norm) };
    };
    const vectors = train.map((t) => vec(topicBody(t)));
    return (text) => {
      const q = vec(text);
      const near = vectors
        .map((v, i) => [cosine(q, v), i])
        .sort((a, b) => b[0] - a[0] || a[1] - b[1])
        .slice(0, NEIGHBORS);
      const votes = {};
      let total = 0;
      for (const [sim, i] of near) {
        for (const career of train[i].careers) {
          votes[career] = (votes[career] || 0) + sim;
          total += sim;
        }
      }
      if (!total) return [];
      return CAREERS.filter((c) => votes[c])
        .map((career) => ({ career, share: votes[career] / total }))
        .sort((a, b) => b.share - a.share || CAREERS.indexOf(a.career) - CAREERS.indexOf(b.career));
    };
  }

  const readCareers = bodyModel(TOPICS);

  // 글에서 읽은 분야. 겹치는 낱말이 하나도 없으면 빈 배열이다.
  function inferCareers(text) {
    return readCareers(String(text || ''));
  }

  // 하나 빼고 학습(leave-one-out): 주제 하나를 빼고 학습한 뒤 그 주제의 분야를 맞히는지 본다.
  function evaluateInference() {
    let top1 = 0;
    let top2 = 0;
    TOPICS.forEach((t, i) => {
      const guess = bodyModel(TOPICS.filter((_, j) => j !== i))(topicBody(t));
      if (guess[0] && t.careers.includes(guess[0].career)) top1 += 1;
      if (guess.slice(0, 2).some((g) => t.careers.includes(g.career))) top2 += 1;
    });
    const counts = CAREERS.map((c) => TOPICS.filter((t) => t.careers.includes(c)).length);
    return { total: TOPICS.length, top1, top2, baseline: Math.max(...counts) };
  }

  /* ---------- 새 주제 만들기: 재료 × 현상 × 바꾸는 것 × 재는 방법 ----------
   * 한 묶음(BLOCK) 안의 조합은 모두 말이 되게 골라 두었다. 조합마다 관심사와 가까운 정도,
   * 기존 주제와 다른 정도를 위의 유사도로 점수 매겨 높은 것부터 내놓는다.
   */
  const MEASURES = {
    abs: { name: '흡광도', tool: '분광 광도계', measure: '흡광도로 구한 농도', step: '분광 광도계로 흡광도를 재고 검량선으로 농도를 구한다.', calcs: ['beer'], needs: '분광 광도계와 큐벳' },
    phone: { name: '스마트폰 색 분석', tool: '스마트폰 카메라', measure: '사진에서 뽑은 색 값(RGB)', step: '같은 조명에서 사진을 찍어 색 값을 뽑고 표준 시료와 견준다.', calcs: ['beer'], needs: '스마트폰과 촬영 상자' },
    titration: { name: '적정', tool: null, measure: '적정에 든 부피로 구한 양', step: '농도를 아는 용액으로 적정해 종말점까지 든 부피를 잰다.', calcs: ['redox'], needs: '뷰렛' },
    ph: { name: 'pH 곡선', tool: 'pH 미터', measure: 'pH와 그 변화', step: 'pH 미터로 pH를 재어 변화 곡선을 그린다.', calcs: ['buffer'], needs: 'pH 미터' },
    volt: { name: '전압과 전류', tool: '전압계·전원 장치', measure: '전압과 전류', step: '멀티미터로 전압과 전류를 잰다.', calcs: ['cell'], needs: '멀티미터' },
    mass: { name: '질량 변화', tool: null, measure: '질량의 변화', step: '전자저울로 질량을 재어 처음 값과의 차이를 구한다.', calcs: ['percent-error'], needs: '전자저울' },
    gas: { name: '기체의 부피', tool: null, measure: '나온 기체의 부피', step: '수상 치환으로 모은 기체의 부피를 시간에 따라 잰다.', calcs: ['gas-collect'], needs: '눈금 실린더와 수조' },
    temp: { name: '온도 변화', tool: '온도 센서', measure: '온도의 변화', step: '온도 센서로 온도-시간 곡선을 기록한다.', calcs: ['calorimetry'], needs: '온도 센서' },
    image: { name: '사진 크기 측정', tool: '스마트폰 카메라', measure: '사진에서 잰 크기', step: '눈금자와 함께 사진을 찍어 크기를 잰다.', calcs: ['percent-error'], needs: '스마트폰과 눈금자' },
  };

  const BLOCKS = [
    { id: 'adsorb', noun: '염료 흡착 성능', careers: ['환경', '화학공학', '소재·나노'], objects: ['귤껍질 가루', '달걀 껍데기 가루', '톱밥 숯', '녹차 찌꺼기', '키토산 구슬'], variables: ['용액의 pH', '용액의 온도', '흡착제의 입자 크기', '염분'], measures: ['abs', 'phone'],
      steps: ['{o을} 씻어 말리고 같은 크기로 준비한다.', '메틸렌 블루 10 mg/L 용액 50 mL에 {o} 0.10 g을 넣고 같은 속도로 젓는다.'], fixed: '염료의 처음 농도, 용액의 부피, 젓는 속도, 접촉 시간', needs: ['메틸렌 블루', '거름종이', '자석 젓개'], labs: ['beer', 'standard'], caution: '염료 폐액은 하수구에 버리지 않고 모아서 처리한다.' },
    { id: 'photo', noun: '광촉매 염료 분해 속도', careers: ['환경', '소재·나노', '에너지·배터리'], objects: ['이산화 타이타늄 가루', '산화 아연 가루', '이산화 타이타늄을 입힌 유리판'], variables: ['빛의 종류', '촉매의 양', '용액의 pH', '염료의 처음 농도'], measures: ['abs', 'phone'],
      steps: ['메틸렌 블루 5 mg/L 용액 100 mL에 {o을} 넣고 어두운 곳에 30분 두어 흡착 평형을 맞춘다.', '빛을 쬐면서 10분마다 시료를 떠서 맑은 부분의 농도를 잰다.'], fixed: '용액의 부피, 광원과의 거리, 젓는 속도', needs: ['메틸렌 블루', '자외선 램프나 햇빛', '자석 젓개'], labs: ['beer', 'rate-conc'], caution: '자외선 램프를 맨눈으로 보지 않고 고운 가루를 들이마시지 않는다.' },
    { id: 'release', noun: '색소 방출 속도', careers: ['의약·바이오', '소재·나노', '화학공학'], objects: ['알긴산 구슬', '한천 젤', '젤라틴 젤', '키토산 구슬'], variables: ['젤의 농도', '젤의 크기', '용액의 pH', '온도'], measures: ['abs', 'phone'],
      steps: ['식용 색소를 넣은 {o을} 같은 크기로 여러 개 만든다.', '{o을} 증류수 100 mL에 넣고 일정한 시간마다 물을 조금 떠서 색소의 농도를 잰다.'], fixed: '넣은 색소의 양, 물의 부피, 젓는 정도', needs: ['식용 색소', '비커', '스포이트'], labs: ['beer', 'standard'], caution: '젤과 구슬은 하수구를 막을 수 있으니 굳혀서 버린다.' },
    { id: 'catalysis', noun: '과산화 수소 분해 속도', careers: ['화학공학', '의약·바이오', '에너지·배터리'], objects: ['이산화 망가니즈', '감자즙', '효모', '산화 구리(II)'], variables: ['온도', '용액의 pH', '촉매의 양', '과산화 수소의 농도'], measures: ['gas', 'temp'],
      steps: ['3 % 과산화 수소수 20 mL를 플라스크에 넣고 온도를 맞춘다.', '{o을} 넣는 순간부터 10초마다 변화를 기록한다.'], fixed: '과산화 수소수의 부피, 용기의 크기', needs: ['과산화 수소수', '삼각 플라스크', '초시계'], labs: ['gas-constant', 'rate-temp'], caution: '과산화 수소가 피부에 닿지 않게 장갑과 보안경을 쓴다.' },
    { id: 'cell', noun: '전압과 출력', careers: ['에너지·배터리', '화학공학', '소재·나노'], objects: ['알루미늄-공기 전지', '레몬즙 전지', '아연-구리 전지', '구리 농도차 전지'], variables: ['전해질의 농도', '전극 사이의 거리', '온도', '전극의 넓이'], measures: ['volt'],
      steps: ['{o을} 같은 구조로 여러 개 만든다.', '전압계와 저항을 연결해 1분마다 값을 기록한다.'], fixed: '전극의 재료, 용기의 크기, 연결한 저항', needs: ['전극용 금속', '전해질 용액', '집게 달린 도선'], labs: ['daniell', 'electrolysis'], caution: '전극이 서로 닿아 합선되지 않게 한다.' },
    { id: 'vitamin', noun: '비타민 C 함량', careers: ['식품·화장품', '의약·바이오', '분석화학'], objects: ['오렌지 주스', '키위즙', '레몬즙', '브로콜리 데친 물'], variables: ['가열 시간', '보관 온도', '보관 기간', '공기와 닿는 넓이'], measures: ['titration'],
      steps: ['{o을} 걸러 맑은 시료를 준비하고 조건을 달리해 둔다.', '시료 10.0 mL에 녹말 용액을 넣고 아이오딘 용액으로 적정할 준비를 한다.'], fixed: '시료의 부피, 지시약의 양, 적정 용액의 농도', needs: ['아이오딘-아이오딘화 칼륨 용액', '녹말 용액', '아스코르브산'], labs: ['vinegar', 'permanganate'], caution: '아이오딘 용액은 피부와 옷에 물이 든다.' },
    { id: 'corrosion', noun: '부식 속도', careers: ['소재·나노', '화학공학', '환경'], objects: ['철못', '강철 솜', '아연 도금 못', '알루미늄박'], variables: ['염분', '용액의 pH', '온도', '녹아 있는 산소의 양'], measures: ['mass', 'phone'],
      steps: ['사포로 닦아 질량을 잰 {o을} 조건이 다른 용액에 담근다.', '며칠마다 꺼내 씻어 말린 뒤 변화를 기록한다.'], fixed: '금속의 크기, 용액의 부피, 담가 둔 기간', needs: ['염화 나트륨', '비커', '사포'], labs: ['daniell'], caution: '산성 용액을 다룰 때 보안경을 쓴다.' },
    { id: 'crystal', noun: '결정의 크기와 모양', careers: ['소재·나노'], objects: ['명반', '황산 구리(II)', '염화 나트륨', '요소'], variables: ['식히는 속도', '용액의 농도', '넣어 준 다른 이온', '씨결정의 크기'], measures: ['mass', 'image'],
      steps: ['{o을} 뜨거운 물에 녹여 과포화 용액을 만든다.', '실에 매단 씨결정을 넣고 조건을 달리해 며칠 동안 기른다.'], fixed: '용액의 부피, 용기, 기르는 기간', needs: ['비커', '실', '보온 상자'], labs: ['standard', 'hydrate'], caution: '뜨거운 용액에 데지 않게 한다.' },
    { id: 'buffer', noun: '완충 능력', careers: ['식품·화장품', '의약·바이오', '환경'], objects: ['탄산음료', '과일 주스', '우유', '이온 음료', '토양 추출액'], variables: ['묽힌 정도', '온도', '보관 기간', '넣어 준 염의 농도'], measures: ['ph', 'titration'], calcs: ['buffer'],
      steps: ['{o} 50 mL를 비커에 담고 처음 pH를 확인한다.', '0.100 M 수산화 나트륨 수용액을 1 mL씩 넣어 가며 변화를 본다.'], fixed: '시료의 부피, 염기의 농도, 젓는 정도', needs: ['수산화 나트륨', '비커', '자석 젓개'], labs: ['buffer', 'vinegar'], caution: '수산화 나트륨 수용액이 눈에 들어가지 않게 한다.' },
    { id: 'indicator', noun: '색 변화', careers: ['AI·데이터', '식품·화장품', '분석화학'], objects: ['적양배추 색소', '포도 껍질 색소', '강황 색소', '검은콩 색소'], variables: ['용액의 pH', '온도', '금속 이온의 종류', '빛을 쬔 시간'], measures: ['phone', 'abs'],
      steps: ['{o을} 뜨거운 물이나 에탄올로 우려 걸러 지시약을 만든다.', '조건이 다른 용액에 같은 양씩 넣고 색이 자리 잡을 때까지 기다린다.'], fixed: '색소의 농도, 용액의 부피, 기다리는 시간', needs: ['완충 용액이나 산·염기 용액', '시험관', '스포이트'], labs: ['buffer', 'weak-acid'], caution: '산과 염기 용액을 다룰 때 보안경을 쓴다.' },
  ];

  // 받침이 있으면 앞의 조사, 없으면 뒤의 조사를 붙인다. 한글이 아니면 받침이 없다고 본다.
  function josa(word, withFinal, withoutFinal) {
    const code = word.charCodeAt(word.length - 1) - 0xac00;
    const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
    return word + (hasFinal ? withFinal : withoutFinal);
  }

  function fill(template, object) {
    return template.replace('{o을}', josa(object, '을', '를')).replace('{o}', object);
  }

  /*
   * input: { careers, keyword, tools(null | []), count, round }
   * 점수 = 관심사와의 유사도 × 2 + 진로가 맞으면 하나에 0.25 + (1 − 가장 가까운 기존 주제와의 유사도)
   * 진로를 고르지 않고 글만 적으면 글에서 읽은 분야(inferCareers)를 진로로 쓴다.
   * round를 올리면 같은 줄의 다음 count개가 나온다. 줄이 끝나면 빈 배열이다.
   */
  function generate(input) {
    const src = input || {};
    const picked0 = src.careers || [];
    const read = picked0.length ? [] : inferCareers(src.keyword).filter((r) => r.share >= 0.2).slice(0, 2).map((r) => r.career);
    const careers = picked0.length ? picked0 : read;
    const tools = Array.isArray(src.tools) ? src.tools : null;
    const count = src.count || 6;
    const profile = vector(`${careers.join(' ')} ${src.keyword || ''}`);
    const candidates = [];
    BLOCKS.forEach((block, bi) => {
      block.objects.forEach((object, oi) => {
        block.variables.forEach((variable, vi) => {
          for (const m of block.measures) {
            const measure = MEASURES[m];
            if (tools && measure.tool && !tools.includes(measure.tool)) continue;
            if (m === 'temp' && variable.includes('온도')) continue; // 바꾸는 것과 재는 것이 같아진다
            const vec = vector(`${object} ${block.noun} ${variable} ${measure.name} ${block.careers.join(' ')}`);
            let nearest = 0;
            let nearestIndex = 0;
            VECTORS.forEach((v, i) => {
              const sim = cosine(vec, v);
              if (sim > nearest) {
                nearest = sim;
                nearestIndex = i;
              }
            });
            const match = careers.filter((c) => block.careers.includes(c)).length;
            candidates.push({ block, object, variable, m, bi, oi, vi, nearest, nearestIndex, score: cosine(profile, vec) * 2 + match * 0.25 + (1 - nearest) });
          }
        });
      });
    });
    candidates.sort((a, b) => b.score - a.score || a.bi - b.bi || a.oi - b.oi || a.vi - b.vi);
    // 재료와 바꾸는 것이 같으면 제목이 같다. 그 가운데 점수가 가장 높은 재는 방법 하나만 남긴다.
    const best = new Map();
    for (const c of candidates) {
      const key = `${c.bi}-${c.oi}-${c.vi}`;
      if (!best.has(key)) best.set(key, c);
    }
    const pool = Array.from(best.values());
    // 여러 묶음이 고루 나오게 줄을 세운다: 한 바퀴에 묶음마다 둘, 재료마다 하나씩 더 허용한다.
    const ordered = [];
    const perBlock = {};
    const perObject = {};
    const taken = new Set();
    for (let pass = 0; ordered.length < pool.length; pass += 1) {
      for (const c of pool) {
        const objectKey = `${c.bi}-${c.oi}`;
        if (taken.has(c) || (perBlock[c.block.id] || 0) >= 2 * (pass + 1) || (perObject[objectKey] || 0) > pass) continue;
        taken.add(c);
        perBlock[c.block.id] = (perBlock[c.block.id] || 0) + 1;
        perObject[objectKey] = (perObject[objectKey] || 0) + 1;
        ordered.push(c);
      }
    }
    const skip = (src.round || 0) * count;
    return ordered.slice(skip, skip + count).map((c) => {
      const measure = MEASURES[c.m];
      return {
        id: `gen-${c.block.id}-${c.oi}-${c.vi}-${c.m}`,
        generated: true,
        title: `${c.object}의 ${c.block.noun}에 ${josa(c.variable, '이', '가')} 미치는 영향`,
        careers: c.block.careers,
        tools: measure.tool ? [measure.tool] : [],
        level: 2,
        keywords: [c.object, c.block.noun, c.variable, measure.name],
        question: `${josa(c.variable, '을', '를')} 바꾸면 ${c.object}의 ${josa(c.block.noun, '은', '는')} 어떻게 달라질까?`,
        change: c.variable,
        measure: measure.measure,
        fixed: c.block.fixed,
        plan: [
          fill(c.block.steps[0], c.object),
          `${josa(c.variable, '을', '를')} 네다섯 단계로 정하고, 나머지 조건은 모두 같게 맞춘다.`,
          fill(c.block.steps[1], c.object),
          measure.step,
          '조건마다 세 번 되풀이해 평균과 표준 편차를 구하고, 바꾼 조건과 결과의 관계를 그래프로 나타낸다.',
        ],
        needs: [c.object].concat(c.block.needs, [measure.needs]),
        labs: c.block.labs,
        calcs: (c.block.calcs || measure.calcs).concat(['stats']),
        caution: c.block.caution,
        extend: '가장 가까운 기존 주제와 무엇이 다른지 정리하고, 같은 연구가 이미 있는지 선행 연구를 찾아본다.',
        nearestTitle: TOPICS[c.nearestIndex].title,
        nearestSimilarity: c.nearest,
        novelty: 1 - c.nearest,
      };
    });
  }

  // 만들 수 있는 주제의 수: 재료 × 바꾸는 것 (재는 방법만 다른 것은 같은 주제로 센다)
  function countCombinations() {
    let n = 0;
    for (const block of BLOCKS) n += block.objects.length * block.variables.length;
    return n;
  }

  // 날짜('YYYY-MM-DD')가 같으면 같은 것을 고른다. 날마다 차례로 넘어간다.
  function pickOfDay(list, iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m || !list.length) return list[0] || null;
    const day = Math.floor(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86400000);
    return list[day % list.length];
  }

  const api = { CAREERS, TOOLS, LEVELS, TOPICS, BLOCKS, MEASURES, recommend, generate, similarity, josa, inferCareers, evaluateInference, countCombinations, pickOfDay };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TopicBook = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
