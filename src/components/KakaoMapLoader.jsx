
import React, { useState, useEffect, useRef } from 'react';

/**
 * @component KakaoMapLoader
 * @description
 * 카카오맵 SDK를 동적으로 로드하고 지도를 렌더링하는 컴포넌트입니다.
 * 로딩, 성공, 오류 상태를 관리하며, 개발 및 운영에 필요한 상세 가이드를 포함합니다.
 *
 * @example
 * <KakaoMapLoader />
 *
 * @see https://apis.map.kakao.com/web/guide/
 */

// --- 운영 가이드 ---
// 1. 환경 변수 설정 (.env 파일)
//    - 프로젝트 루트에 `.env.development` 또는 `.env.production` 파일을 생성하세요.
//    - 파일 내에 발급받은 카카오맵 Javascript 키를 다음과 같이 추가합니다.
//      REACT_APP_KAKAO_KEY=YOUR_JAVASCRIPT_KEY
//    - CRA(Create React App) 기반 프로젝트에서는 `REACT_APP_` 접두사가 필수입니다.
//
// 2. API 키 노출 주의
//    - 이 코드는 클라이언트 사이드에서 실행되므로, 빌드된 JavaScript 파일에 API 키가 포함됩니다.
//    - 카카오 개발자 콘솔에서 허용 도메인을 정확하게 설정하여 키가 무단으로 사용되는 것을 방지하세요.
//
// 3. 도메인 등록 (카카오 개발자 콘솔)
//    - 카카오 개발자 콘솔(https://developers.kakao.com) > 내 애플리케이션 > 앱 설정 > 플랫폼으로 이동합니다.
//    - [Web] 플랫폼을 선택하고, 서비스를 제공할 도메인을 등록해야 합니다.
//      - 개발 환경: http://localhost:3000
//      - Firebase Hosting 배포 환경: https://your-firebase-project-id.web.app, https://your-custom-domain.com 등
// ---

const KakaoMapLoader = () => {
  const [loadStatus, setLoadStatus] = useState('loading'); // 'loading', 'loaded', 'error'
  const mapContainer = useRef(null); // 지도를 담을 DOM 레퍼런스
  const KAKAO_KEY = process.env.REACT_APP_KAKAO_KEY;

  useEffect(() => {
    // 디버그용 전역 플래그 초기화
    window.__KAKAO_SDK_LOADED__ = false;

    if (!KAKAO_KEY) {
      console.error(
        'KakaoMapLoader Error: REACT_APP_KAKAO_KEY 환경 변수가 설정되지 않았습니다.'
      );
      setLoadStatus('error');
      return;
    }

    // 스크립트가 이미 로드되었는지 확인
    if (document.getElementById('kakao-maps-sdk')) {
      setLoadStatus('loaded');
      // kakao.maps.load는 여러 번 호출해도 안전합니다.
      window.kakao.maps.load(() => {
        initializeMap();
      });
      return;
    }

    const script = document.createElement('script');
    script.id = 'kakao-maps-sdk';
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services&autoload=false`;
    script.async = true;

    // 스크립트 로드 성공 시
    script.onload = () => {
      window.kakao.maps.load(() => {
        // 이 콜백 함수는 실제 지도 API가 완전히 준비되었을 때 호출됩니다.
        if (mapContainer.current) {
          initializeMap();
          setLoadStatus('loaded');
          window.__KAKAO_SDK_LOADED__ = true; // 디버그 플래그 설정
        }
      });
    };

    // 스크립트 로드 실패 시
    script.onerror = (error) => {
      console.error('KakaoMapLoader Error: 카카오맵 SDK 로드에 실패했습니다.', error);
      setLoadStatus('error');
    };

    document.head.appendChild(script);

    // 컴포넌트 언마운트 시 스크립트 태그 정리 (선택적)
    // SPA(Single Page Application)에서 다른 페이지로 이동 시 불필요한 스크립트를 제거하여 메모리 누수를 방지합니다.
    return () => {
      const existingScript = document.getElementById('kakao-maps-sdk');
      // 다른 컴포넌트에서도 지도를 사용할 수 있으므로, 신중하게 제거하거나 제거하지 않을 수 있습니다.
      // 여기서는 예시로 제거 로직을 포함합니다.
      // if (existingScript) {
      //   document.head.removeChild(existingScript);
      // }
    };
  }, [KAKAO_KEY]); // KAKAO_KEY가 변경될 경우에만 재실행

  /**
   * 지도를 초기화하고 화면에 표시하는 함수
   */
  const initializeMap = () => {
    const mapOption = {
      center: new window.kakao.maps.LatLng(37.566826, 126.9786567), // 서울 시청
      level: 3, // 지도의 확대 레벨
    };
    // mapContainer.current에 지도를 생성합니다.
    // 지도가 이미 생성되어 있다면 다시 생성하지 않습니다.
    const map = new window.kakao.maps.Map(mapContainer.current, mapOption);
    
    // 일반 지도와 스카이뷰로 지도 타입을 전환할 수 있는 컨트롤을 생성합니다
    const mapTypeControl = new window.kakao.maps.MapTypeControl();
    map.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);

    // 줌 컨트롤을 생성합니다
    const zoomControl = new window.kakao.maps.ZoomControl();
    map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
  };

  return (
    <div>
      {loadStatus === 'loading' && <p>지도를 불러오는 중입니다...</p>}
      {loadStatus === 'error' && (
        <div>
          <p>지도 로딩 중 오류가 발생했습니다.</p>
          <p>
            - 인터넷 연결을 확인해주세요.
            <br />
            - 잠시 후 다시 시도해주세요.
            <br />- 개발자 콘솔(F12)에서 상세 오류를 확인할 수 있습니다.
          </p>
        </div>
      )}
      {/* 지도를 담을 영역 */}
      <div
        id="map"
        ref={mapContainer}
        style={{
          width: '100%',
          height: '500px',
          display: loadStatus === 'loaded' ? 'block' : 'none',
        }}
      />
      <div style={{ fontSize: '0.8rem', color: 'gray', marginTop: '10px' }}>
        <p>
          <strong>개발자 디버그 정보:</strong>
        </p>
        <ul>
          <li>현재 로드 상태: {loadStatus}</li>
          <li>
            콘솔에서 `window.__KAKAO_SDK_LOADED__`를 입력하여 SDK 로드 여부를
            확인할 수 있습니다.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default KakaoMapLoader;
