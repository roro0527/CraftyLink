
'use client';

import * as React from 'react';

export default function RegionExplorePage() {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">지역별 트렌드 대시보드</h1>
                <p className="text-muted-foreground">지도에서 지역을 선택하여 최신 트렌드를 확인하세요.</p>
            </header>
            
            <div className="text-center py-10 text-muted-foreground">
                <p>탐색 기능이 초기화되었습니다.</p>
            </div>
        </div>
    );
}
